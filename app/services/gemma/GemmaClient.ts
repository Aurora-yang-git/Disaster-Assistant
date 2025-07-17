import { Message } from '../../hooks/useApi';
import { RAGService } from '../rag/RAGService';
import { ResponseValidator } from '../rag/ResponseValidator';

interface GemmaConfig {
  modelPath?: string;
  maxTokens?: number;
  temperature?: number;
}

interface ChatCompletionParams {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
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
  private isModelLoaded: boolean = false;
  private ragService: RAGService;
  private validator: ResponseValidator;

  constructor(config: GemmaConfig = {}) {
    this.config = {
      modelPath: config.modelPath || 'gemma-3n',
      maxTokens: config.maxTokens || 150,
      temperature: config.temperature || 0.7,
      ...config
    };
    this.ragService = RAGService.getInstance();
    this.validator = ResponseValidator.getInstance();
  }

  async loadModel(): Promise<void> {
    console.log('Loading Gemma model...');
    // TODO: Implement actual model loading with TensorFlow Lite or MediaPipe
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
    this.isModelLoaded = true;
    console.log('Gemma model loaded successfully');
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    if (!this.isModelLoaded) {
      await this.loadModel();
    }

    // Extract the last user message
    const lastUserMessage = params.messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';

    // Use RAG service to process the query
    const ragContext = await this.ragService.processQuery(lastUserMessage);

    // For now, simulate the response using the enhanced RAG context
    let mockResponse = this.getMockResponseWithRAG(ragContext.contextualPrompt, ragContext);
    
    // Validate response for safety
    const validationResult = this.validator.validateResponse(
      lastUserMessage,
      mockResponse,
      ragContext.relevantKnowledge
    );
    
    // If validation fails, use safe fallback
    if (!validationResult.isValid) {
      console.warn('Response validation failed:', validationResult.warnings);
      mockResponse = this.validator.getSafeResponse(lastUserMessage, validationResult);
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: `gemma-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: params.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: mockResponse
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: ragContext.contextualPrompt.length / 4, // Rough estimate
        completion_tokens: mockResponse.length / 4,
        total_tokens: (ragContext.contextualPrompt.length + mockResponse.length) / 4
      }
    };
  }

  private getMockResponseWithRAG(contextualPrompt: string, ragContext: any): string {
    // If no relevant knowledge found, use the enhanced "no information" response
    if (ragContext.relevantKnowledge.length === 0) {
      return `I don't have specific knowledge about this question in my earthquake survival database. I cannot provide accurate information for this query. Please rely on your own judgment and seek help from emergency personnel or official sources if this is an emergency situation.

If you have other earthquake survival questions, I'd be happy to help with those.`;
    }

    // Use the first relevant knowledge item as the response
    const topKnowledge = ragContext.relevantKnowledge[0];
    let response = topKnowledge.content;

    // Add quick actions if available
    if (ragContext.quickActions && ragContext.quickActions.length > 0) {
      response += '\n\nQuick Actions:\n';
      ragContext.quickActions.forEach((action: string, index: number) => {
        response += `${index + 1}. ${action}\n`;
      });
    }

    // Add priority indicator for critical situations
    if (ragContext.emergencyPriority === 'critical') {
      response = `🚨 CRITICAL: ${response}`;
    } else if (ragContext.emergencyPriority === 'urgent') {
      response = `⚠️ URGENT: ${response}`;
    }

    return response;
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
        }
      }
    };
  }

  get images() {
    return {
      generate: async (params: any) => {
        // Mock image generation - not supported in MVP
        throw new Error('Image generation not supported in offline mode');
      }
    };
  }
}