import { LlamaContext, initLlama } from "llama.rn";
import { Message } from "../../hooks/useApi";
import { RAGService } from "../rag/RAGService";
import { ResponseValidator } from "../rag/ResponseValidator";
import * as FileSystem from 'expo-file-system';

interface GemmaConfig {
  modelPath?: string; // This will now point to the asset path
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionParams {
  model: string;
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}


export class GemmaClient {
  private config: GemmaConfig;
  private context: LlamaContext | null = null;
  private isModelLoaded: boolean = false;
  private isLoading: boolean = false;
  private ragService: RAGService;
  private validator: ResponseValidator;

  constructor(config: GemmaConfig = {}) {
    this.config = {
      modelPath: config.modelPath || "gemma-3n",
      maxTokens: config.maxTokens || 150,
      temperature: config.temperature || 0.7,
      ...config,
    };
    this.ragService = RAGService.getInstance();
    this.validator = ResponseValidator.getInstance();
  }

  async loadModel(): Promise<void> {
    if (this.isModelLoaded || this.isLoading) {
      console.log("Model is already loaded or loading.");
      return;
    }
    this.isLoading = true;
    console.log("Loading TinyLlama model...");
    try {
      const documentsDirectory = FileSystem.documentDirectory;
      const localModelPath = documentsDirectory + 'tinyllama.gguf';
      
      console.log("=== SIMULATOR DOCUMENT DIRECTORY ===");
      console.log("Document directory:", documentsDirectory);
      console.log("Expected model path:", localModelPath);
      console.log("=====================================");
      
      // Check if model exists in document directory
      const fileInfo = await FileSystem.getInfoAsync(localModelPath);
      
      if (!fileInfo.exists) {
        throw new Error(`Model not found at ${localModelPath}. Please manually copy tinyllama.gguf to this location.`);
      }
      
      console.log("Initializing Llama with model at:", localModelPath);
      const llama = await initLlama({
        model: localModelPath,
        use_mlock: true,
        n_ctx: 2048,
        n_batch: 512,
        n_threads: 4,
      });
      this.context = llama;
      this.isModelLoaded = true;
      console.log("TinyLlama model loaded successfully");
    } catch (e) {
      console.error("Failed to load TinyLlama model:", e);
      this.isModelLoaded = false;
    } finally {
      this.isLoading = false;
    }
  }

  async createChatCompletion(
    params: ChatCompletionParams
  ): Promise<ChatCompletionResponse> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }

    // Extract the last user message and format conversation history
    const lastUserMessage =
      params.messages.filter((msg) => msg.role === "user").pop()?.content || "";
    const conversationHistory = this.formatConversationHistory(params.messages);

    // Use RAG service to process the query
    const ragContext = await this.ragService.processQuery(lastUserMessage);

    let responseContent: string;

    // If RAG finds relevant knowledge, use it.
    if (ragContext.relevantKnowledge.length > 0) {
      console.log("RAG service found relevant knowledge.");
      responseContent = this.getFormattedRAGResponse(ragContext);
    } else {
      // Otherwise, call Gemma for a generative response.
      console.log("No RAG context found. Calling Gemma...");
      if (!this.context) {
        responseContent =
          "Gemma model is not loaded. Cannot generate a response.";
      } else {
        try {
          // TinyLlama chat format
          const prompt = `<|system|>
You are a helpful disaster response assistant. Provide clear, actionable guidance in Chinese.
<|user|>
${lastUserMessage}
<|assistant|>`;
          
          const completion = await this.context.completion({
            prompt: prompt,
            temperature: 0.7,
            n_predict: 256, // Max tokens to generate
            stop: ["<|user|>", "<|system|>"], // Stop sequences
          });
          responseContent = completion.text;
        } catch (e) {
          console.error("Error during Gemma completion:", e);
          responseContent =
            "An error occurred while generating a response from Gemma.";
        }
      }
    }

    // TEMPORARILY DISABLED ResponseValidator for debugging
    // Validate response for safety
    // const validationResult = this.validator.validateResponse(
    //   lastUserMessage,
    //   responseContent,
    //   ragContext.relevantKnowledge
    // );

    // // If validation fails, use safe fallback
    // if (!validationResult.isValid) {
    //   console.warn("Response validation failed:", validationResult.warnings);
    //   responseContent = this.validator.getSafeResponse(
    //     lastUserMessage,
    //     validationResult
    //   );
    // }

    console.log("=== RAW AI RESPONSE (Validator Disabled) ===");
    console.log("User Query:", lastUserMessage);
    console.log("AI Response:", responseContent);
    console.log("===========================================");

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id: `gemma-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: params.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: responseContent,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: ragContext.contextualPrompt.length / 4, // Rough estimate
        completion_tokens: responseContent.length / 4,
        total_tokens:
          (ragContext.contextualPrompt.length + responseContent.length) / 4,
      },
    };
  }

  private getFormattedRAGResponse(ragContext: any): string {
    // This function now assumes relevantKnowledge exists.
    const topKnowledge = ragContext.relevantKnowledge[0];
    let response = topKnowledge.content;

    // Add quick actions if available
    if (ragContext.quickActions && ragContext.quickActions.length > 0) {
      response += "\n\nQuick Actions:\n";
      ragContext.quickActions.forEach((action: string, index: number) => {
        response += `${index + 1}. ${action}\n`;
      });
    }

    // Add priority indicator for critical situations
    if (ragContext.emergencyPriority === "critical") {
      response = `🚨 CRITICAL: ${response}`;
    } else if (ragContext.emergencyPriority === "urgent") {
      response = `⚠️ URGENT: ${response}`;
    }

    return response;
  }

  // 对话历史格式化：构建完整的对话上下文
  private formatConversationHistory(messages: Message[]): string {
    if (messages.length === 0) return '';
    
    // 只保留最近6轮对话，避免上下文过长
    const recentMessages = messages.slice(-12); // 6轮对话 = 12条消息（用户+助手）
    
    let conversationContext = '对话历史:\n';
    
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        conversationContext += `用户: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationContext += `助手: ${msg.content}\n`;
      }
    }
    
    conversationContext += '\n当前问题: ';
    return conversationContext;
  }
}

// OpenAI-compatible interface wrapper
export class GemmaOpenAIWrapper {
  private client: GemmaClient;

  constructor(config: { apiKey?: string; dangerouslyAllowBrowser?: boolean }) {
    // Ignore OpenAI-specific config, use Gemma client
    this.client = new GemmaClient();
  }

  get chat() {
    return {
      completions: {
        create: async (params: ChatCompletionParams) => {
          return await this.client.createChatCompletion(params);
        },
      },
    };
  }

  get images() {
    return {
      generate: async (params: any) => {
        // Mock image generation - not supported in MVP
        throw new Error("Image generation not supported in offline mode");
      },
    };
  }
}
