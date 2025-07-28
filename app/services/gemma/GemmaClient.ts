import OpenAI from 'openai';
import { Message } from '../../hooks/useApi';

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
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_HF_TOKEN || '',
      baseURL: 'https://router.huggingface.co/v1',
      dangerouslyAllowBrowser: true, // 仅Web端开发用，生产请移除
    });
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      if (params.stream) {
        throw new Error('当前实现不支持stream模式');
      }
      const completion = await this.openai.chat.completions.create({
        model: 'google/gemma-3n-E2B-it',
        messages: params.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        max_tokens: params.max_tokens || 300,
        temperature: params.temperature || 0.7,
        stream: false,
      }) as any;

      return {
        id: completion.id,
        object: completion.object,
        created: completion.created,
        model: completion.model,
        choices: completion.choices,
        usage: completion.usage,
      };
    } catch (error) {
      throw new Error(`在线API调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
} 