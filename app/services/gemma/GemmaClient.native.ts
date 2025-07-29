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
  userContext?: string; // Added for user context injection
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
    console.log("Loading Gemma 3n model...");
    
    try {
      const documentsDirectory = FileSystem.documentDirectory;
      
      // Try multiple model names and locations
      const modelNames = [
        'gemma-3n-Q4_K_M.gguf',  // Primary Gemma 3n model
        'gemma-3n.gguf',         // Alternative name
        'tinyllama.gguf'         // Fallback for testing
      ];
      
      let modelPath: string | null = null;
      let modelFound = false;
      
      // Check each possible model name
      for (const modelName of modelNames) {
        const candidatePath = documentsDirectory + modelName;
        const fileInfo = await FileSystem.getInfoAsync(candidatePath);
        
        if (fileInfo.exists) {
          modelPath = candidatePath;
          modelFound = true;
          console.log(`✅ Found model: ${modelName}`);
          console.log(`   Path: ${candidatePath}`);
          console.log(`   Size: ${(fileInfo.size! / 1073741824).toFixed(2)} GB`);
          break;
        }
      }
      
      if (!modelFound || !modelPath) {
        console.error("❌ Model not found in any expected location");
        console.error("\n📱 Model Deployment Instructions:");
        console.error("==================================");
        console.error("1. Make sure you have the Gemma 3n model file (Q4_K_M format, ~3GB)");
        console.error("2. Run the deployment script from project root:");
        console.error("   ./scripts/deploy-model.sh");
        console.error("\n🔍 Expected locations:");
        modelNames.forEach(name => {
          console.error(`   - ${documentsDirectory}${name}`);
        });
        console.error("\n💡 For simulators:");
        console.error("   iOS: The script will use xcrun simctl");
        console.error("   Android: The script will use adb push");
        console.error("\n⚠️  Note: The model file is >2GB, so it must be deployed");
        console.error("   using native tools, not through Node.js/Metro bundler");
        
        throw new Error(
          "Model not found. Please run ./scripts/deploy-model.sh to deploy the Gemma 3n model."
        );
      }
      
      console.log("Initializing Llama with model at:", modelPath);
      const llama = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: 2048,
        n_batch: 512,
        n_threads: 4,
      });
      
      this.context = llama;
      this.isModelLoaded = true;
      console.log("✅ Gemma 3n model loaded successfully!");
      
    } catch (e) {
      console.error("❌ Failed to load Gemma 3n model:", e);
      this.isModelLoaded = false;
      throw e; // Re-throw to handle in UI
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
          "The AI model is not loaded yet. Please wait a moment and try again.";
      } else {
        try {
          // Gemma chat format with conversation history in English
          const contextInfo = params.userContext || '';
          
          if (contextInfo) {
            console.log('=== INJECTING USER CONTEXT INTO PROMPT ===');
            console.log('User context:', contextInfo);
            console.log('=========================================');
          }
          
          const prompt = `You are an emergency response AI assistant powered by Gemma 3n, designed to help people survive earthquakes when no other help is available. You operate completely offline.

CORE PRINCIPLE: First, do no harm. Never give advice that could cause greater risk.

CRITICAL GUIDELINES:
1. EMPATHY FIRST: Acknowledge fear with genuine care
2. ASSESS FIRST: If situation unclear, ask: "Are you injured? Are you trapped? Is anyone with you?"
3. CLARITY: Use simple language and clear structure
4. HOPE MATTERS: End with encouragement

RESPONSE FORMAT:

Empathy (1-2 sentences):
"I understand you're [situation]. I'm here to help you get through this."

🚨 IMMEDIATE (Do NOW):
• [Most critical action]
• [Second priority if applicable]

📋 NEXT STEPS (2-5 minutes):
1. [Action with reason]
2. [Action with reason]

⚠️ IMPORTANT:
• [Critical safety reminder]
• DO NOT: [Critical prohibition]

End: "[Personalized encouragement]"

PRIORITIES: Air/Safety → Bleeding → Signaling → Shelter → Resources

${contextInfo}
USER CONTEXT AWARENESS: If context provided above, incorporate naturally (e.g., "Since you're on the 5th floor..." or "Given your injury...")

${conversationHistory}${lastUserMessage}

Assistant:`;
          
          const completion = await this.context.completion({
            prompt: prompt,
            temperature: 0.7,
            n_predict: 256, // Max tokens to generate
            stop: ["\nUser:", "\nHuman:", "\n\nUser:", "\n\nHuman:"], // Stop sequences
          });
          responseContent = completion.text.trim();
          
          // Clean up model-specific tokens
          responseContent = responseContent
            .replace(/<end_of_turn>/g, '')
            .replace(/<start_of_turn>/g, '')
            .replace(/<eos>/g, '')
            .replace(/<bos>/g, '')
            .trim();
          
          // Ensure we have a valid response
          if (!responseContent || responseContent.length < 5) {
            responseContent = "I apologize, but I couldn't generate a valid response. Please try rephrasing your question.";
          }
        } catch (e) {
          console.error("Error during Gemma completion:", e);
          responseContent =
            "An error occurred while generating a response. Please ensure the model is properly loaded or try restarting the app.";
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

    // Clean up any model-specific tokens
    response = response
      .replace(/<end_of_turn>/g, '')
      .replace(/<start_of_turn>/g, '')
      .replace(/<eos>/g, '')
      .replace(/<bos>/g, '')
      .trim();

    return response;
  }

  // Format conversation history in English for better model understanding
  private formatConversationHistory(messages: Message[]): string {
    if (messages.length === 0) return '';
    
    // Keep last 6 rounds of conversation to avoid context being too long
    const recentMessages = messages.slice(-12); // 6 rounds = 12 messages (user + assistant)
    
    let conversationContext = 'Conversation History:\n';
    
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        conversationContext += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationContext += `Assistant: ${msg.content}\n`;
      }
    }
    
    conversationContext += '\nCurrent Question: ';
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
