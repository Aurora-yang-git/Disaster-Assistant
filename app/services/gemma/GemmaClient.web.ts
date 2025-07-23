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
      responseContent = this.generateContextualFallback(lastUserMessage, params.messages);
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

  // 生成上下文相关的降级回复
  private generateContextualFallback(currentMessage: string, messages: Message[]): string {
    const hasEarthquakeContext = messages.some(msg => 
      msg.content.toLowerCase().includes('地震') || 
      msg.content.toLowerCase().includes('earthquake')
    );
    
    const hasDisasterContext = messages.some(msg => 
      msg.content.toLowerCase().includes('灾难') || 
      msg.content.toLowerCase().includes('emergency') ||
      msg.content.toLowerCase().includes('救援')
    );

    let contextualResponse = '[Web Mock] ';
    
    if (hasEarthquakeContext) {
      contextualResponse += `我注意到您之前询问了地震相关的问题。关于"${currentMessage}"，我在地震知识库中没有找到具体信息。`;
    } else if (hasDisasterContext) {
      contextualResponse += `基于我们之前关于灾难应急的对话，关于"${currentMessage}"，我需要更多具体信息才能提供准确建议。`;
    } else {
      contextualResponse += `关于"${currentMessage}"，我在知识库中没有找到相关信息。`;
    }
    
    contextualResponse += `\n\n💡 提示：在Web版本中，我主要能回答地震安全和灾难应急相关的问题。\n\n🚀 要获得完整的AI对话能力，请在Android设备上运行此应用。\n\n🔍 您可以尝试问我：\n- "地震时应该怎么办？"\n- "如何准备应急包？"\n- "高楼遇到地震怎么办？"`;
    
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
