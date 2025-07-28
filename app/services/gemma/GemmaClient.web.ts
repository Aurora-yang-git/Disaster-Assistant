import { Message } from '../../hooks/useApi';
import { RAGService } from '../rag/RAGService';
import { ResponseValidator } from '../rag/ResponseValidator';

// --- Shared Interfaces (must match native version) ---

interface GemmaConfig {
  modelPath?: string;
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

// --- Web Implementation (Mock/Simulation) ---

export class GemmaClient {
  private config: GemmaConfig;
  private isModelLoaded: boolean = false;
  private ragService: RAGService;
  private validator: ResponseValidator;

  constructor(config: GemmaConfig = {}) {
    this.ragService = RAGService.getInstance();
    this.validator = ResponseValidator.getInstance();
    this.config = {
      modelPath: config.modelPath || 'gemma-web-mock',
      maxTokens: config.maxTokens || 2048,
      temperature: config.temperature || 0.7,
    };
  }

  async loadModel(): Promise<void> {
    console.log('[Web Mock] Loading Gemma model...');
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isModelLoaded = true;
    console.log('[Web Mock] Gemma model loaded successfully');
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }

    const lastUserMessage = params.messages.filter(msg => msg.role === 'user').pop()?.content || '';
    const conversationHistory = this.formatConversationHistory(params.messages);
    const contextInfo = params.userContext || '';
    
    // Use RAG service to process the query
    const ragContext = await this.ragService.processQuery(lastUserMessage);
    
    let responseContent: string;

    // If RAG finds relevant knowledge, use it
    if (ragContext.relevantKnowledge.length > 0) {
      console.log('[Web Mock] RAG service found relevant knowledge');
      responseContent = this.getFormattedRAGResponse(ragContext);
    } else {
      // For web version, provide a contextual fallback response
      console.log('[Web Mock] No RAG context found. Using contextual fallback response');
      responseContent = this.generateContextualFallback(lastUserMessage, params.messages, contextInfo);
    }
    
    // Validate response for safety
    const validationResult = this.validator.validateResponse(
      lastUserMessage,
      responseContent,
      ragContext.relevantKnowledge
    );
    
    if (!validationResult.isValid) {
      console.warn('[Web Mock] Response validation failed:', validationResult.warnings);
      responseContent = this.validator.getSafeResponse(lastUserMessage, validationResult);
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      id: `gemma-web-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: params.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: responseContent
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: ragContext.contextualPrompt.length / 4,
        completion_tokens: responseContent.length / 4,
        total_tokens: (ragContext.contextualPrompt.length + responseContent.length) / 4
      }
    };
  }

  private getFormattedRAGResponse(ragContext: any): string {
    const topKnowledge = ragContext.relevantKnowledge[0];
    let response = topKnowledge.content;

    // Add context if available
    if (topKnowledge.context) {
      response += `\n\n**Context:** ${topKnowledge.context}`;
    }

    // Add source information
    if (topKnowledge.source) {
      response += `\n\n*Source: ${topKnowledge.source}*`;
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

  // Format conversation history in English for consistency
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

  // Generate contextual fallback response in English
  private generateContextualFallback(currentMessage: string, messages: Message[], contextInfo: string): string {
    const hasEarthquakeContext = messages.some(msg => 
      msg.content.toLowerCase().includes('earthquake') ||
      msg.content.toLowerCase().includes('quake') ||
      msg.content.toLowerCase().includes('tremor')
    );
    
    const hasDisasterContext = messages.some(msg => 
      msg.content.toLowerCase().includes('disaster') || 
      msg.content.toLowerCase().includes('emergency') ||
      msg.content.toLowerCase().includes('rescue') ||
      msg.content.toLowerCase().includes('survival')
    );

    let contextualResponse = '[Web Mock] ';
    
    // Include user context if available
    if (contextInfo) {
      contextualResponse += `I understand your current situation: ${contextInfo}\n\n`;
    }
    
    if (hasEarthquakeContext) {
      contextualResponse += `I noticed you asked about earthquake-related topics earlier. Regarding "${currentMessage}", I couldn't find specific information in the earthquake knowledge base.`;
    } else if (hasDisasterContext) {
      contextualResponse += `Based on our previous conversation about emergency preparedness, regarding "${currentMessage}", I need more specific information to provide accurate guidance.`;
    } else {
      contextualResponse += `Regarding "${currentMessage}", I couldn't find relevant information in the knowledge base.`;
    }
    
    contextualResponse += `\n\n💡 Note: In the web version, I primarily answer earthquake safety and disaster preparedness questions.\n\n🚀 For full AI conversation capabilities, please run this app on an Android device.\n\n🔍 You can try asking me:\n- "What should I do during an earthquake?"\n- "How to prepare an emergency kit?"\n- "What to do in a high-rise during earthquake?"`;
    
    return contextualResponse;
  }
}

// --- OpenAI-compatible interface wrapper ---
export class GemmaOpenAIWrapper {
  private client: GemmaClient;

  constructor(config: { apiKey?: string; dangerouslyAllowBrowser?: boolean } = {}) {
    // Ignore OpenAI-specific config, use our Gemma client
    this.client = new GemmaClient();
  }

  chat = {
    completions: {
      create: (params: ChatCompletionParams): Promise<ChatCompletionResponse> => {
        return this.client.createChatCompletion(params);
      }
    }
  };

  // Placeholder for other OpenAI API endpoints (not implemented)
  images = {
    generate: (params: any) => {
      throw new Error('[Web Mock] Image generation not supported in web version');
    }
  };
}
