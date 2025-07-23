import { LlamaContext, initLlama } from "llama.rn";
import { Message } from "../../hooks/useApi";
import { RAGService } from "../rag/RAGService";
import { ResponseValidator } from "../rag/ResponseValidator";

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

const MODEL_ASSET_PATH = "models/gemma-3n-E2B-it-Q4_K_M.gguf";

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
    console.log("Loading Gemma model from path:", MODEL_ASSET_PATH);
    try {
      const llama = await initLlama({
        model: MODEL_ASSET_PATH,
        use_mlock: true, // Keep model in memory
        n_ctx: 2048, // Context size
      });
      this.context = llama;
      this.isModelLoaded = true;
      console.log("Gemma model loaded successfully");
    } catch (e) {
      console.error("Failed to load Gemma model:", e);
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
          // Use full conversation history for better context understanding
          const completion = await this.context.completion({
            prompt: conversationHistory + lastUserMessage,
            temperature: 0.7,
          });
          responseContent = completion.text;
        } catch (e) {
          console.error("Error during Gemma completion:", e);
          responseContent =
            "An error occurred while generating a response from Gemma.";
        }
      }
    }

    // Validate response for safety
    const validationResult = this.validator.validateResponse(
      lastUserMessage,
      responseContent,
      ragContext.relevantKnowledge
    );

    // If validation fails, use safe fallback
    if (!validationResult.isValid) {
      console.warn("Response validation failed:", validationResult.warnings);
      responseContent = this.validator.getSafeResponse(
        lastUserMessage,
        validationResult
      );
    }

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
