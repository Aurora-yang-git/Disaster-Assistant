import { Message } from '../../hooks/useApi';

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

  constructor(config: GemmaConfig = {}) {
    this.config = {
      modelPath: config.modelPath || 'gemma-3n',
      maxTokens: config.maxTokens || 150,
      temperature: config.temperature || 0.7,
      ...config
    };
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

    // Mock response for earthquake survival scenarios
    const mockResponse = this.getMockResponse(lastUserMessage);

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
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };
  }

  private getMockResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Earthquake during
    if (lowerPrompt.includes('earthquake') && (lowerPrompt.includes('during') || lowerPrompt.includes('happening'))) {
      return 'DROP to your hands and knees immediately. COVER your head and neck under a sturdy desk or table. HOLD ON to your shelter and be prepared to move with it. Stay in position until shaking stops. Do NOT run outside during shaking.';
    }

    // Water finding
    if (lowerPrompt.includes('water') || lowerPrompt.includes('thirsty') || lowerPrompt.includes('drink')) {
      return 'After an earthquake: 1) Check water heater tank (turn off power first), 2) Toilet tank water (not bowl) is usually safe, 3) Ice cubes in freezer. To purify: Boil for 1 minute, or use 8 drops of bleach per gallon, wait 30 minutes.';
    }

    // Bleeding/First aid
    if (lowerPrompt.includes('bleeding') || lowerPrompt.includes('blood') || lowerPrompt.includes('injured')) {
      return 'Apply direct pressure with clean cloth. Elevate the wound above heart if possible. Do NOT remove embedded objects. If blood soaks through, add more cloth without removing first layer. Call emergency services if available.';
    }

    // Trapped
    if (lowerPrompt.includes('trapped') || lowerPrompt.includes('stuck') || lowerPrompt.includes('被困')) {
      return 'Stay calm and conserve energy. Tap on pipes or walls to signal rescuers. Use whistle if available. Avoid shouting except when you hear rescuers nearby. Cover your mouth with cloth to avoid dust inhalation. Do not light matches.';
    }

    // Aftershock
    if (lowerPrompt.includes('aftershock') || lowerPrompt.includes('余震')) {
      return 'Aftershocks are common after major earthquakes. When you feel one: DROP, COVER, and HOLD ON again. Stay away from damaged buildings. If outdoors, move to open area away from buildings, trees, and power lines.';
    }

    // Default response
    return 'I can help with earthquake survival information. You can ask about: what to do during an earthquake, finding water, treating injuries, being trapped, or dealing with aftershocks.';
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