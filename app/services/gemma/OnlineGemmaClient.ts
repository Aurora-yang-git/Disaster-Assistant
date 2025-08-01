import OpenAI from 'openai';
import { Message } from '../../hooks/useApi';

// OpenRouter API配置
interface OpenRouterConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  headers: Record<string, string>;
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

export class OnlineGemmaClient {
  private openai: OpenAI;
  private openRouterConfig: OpenRouterConfig;

  constructor() {
    // 使用Hugging Face的推理API端点
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_HF_TOKEN || '',
      baseURL: 'https://huggingface.co/google/gemma-3n-E4B-it',
    });

    // 初始化OpenRouter配置
    this.openRouterConfig = {
      apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'google/gemma-3n-e4b-it:free',
      headers: {
        'HTTP-Referer': process.env.EXPO_PUBLIC_SITE_URL || 'https://ai-camp.vercel.app',
        'X-Title': 'AI Camp',
      }
    };
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      // 优先尝试使用OpenRouter API
      if (this.openRouterConfig.apiKey) {
        try {
          console.log('OnlineGemmaClient: 尝试使用OpenRouter API');
          return await this.callOpenRouterAPI(params);
        } catch (openRouterError) {
          console.log('OpenRouter API失败，回退到Hugging Face:', openRouterError);
        }
      }

      // 回退到Hugging Face API
      console.log('OnlineGemmaClient: 开始调用Hugging Face API');
      
      // 构建Hugging Face推理API的请求格式
      const messages = params.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      
      // 构建对话格式
      const conversation = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      const prompt = `${conversation}\nassistant:`;
      
      console.log('Sending prompt:', prompt);
      
      // 使用fetch直接调用Hugging Face推理API
      const response = await fetch('https://api-inference.huggingface.co/models/google/gemma-3n-E2B-it', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: params.max_tokens || 300,
            temperature: params.temperature || 0.7,
            do_sample: true,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Raw API response:', result);

      // 解析响应
      let generatedText = '';
      if (Array.isArray(result) && result.length > 0) {
        generatedText = result[0].generated_text || '';
      } else if (typeof result === 'string') {
        generatedText = result;
      } else {
        generatedText = 'No response generated';
      }

      // 提取assistant部分的回复
      const assistantMatch = generatedText.match(/assistant:\s*(.*)/s);
      const aiResponse = assistantMatch ? assistantMatch[1].trim() : generatedText;

      console.log('OnlineGemmaClient: API调用成功');
      console.log('Generated text:', generatedText);
      console.log('AI response:', aiResponse);

      return {
        id: `gemma-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'google/gemma-3n-E2B-it',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: aiResponse || 'No response generated'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
      };
    } catch (error) {
      console.error('OnlineGemmaClient API调用失败:', error);
      
      // 详细的错误处理
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('API密钥无效，请检查Hugging Face Token配置');
        } else if (error.message.includes('404')) {
          throw new Error('模型不可用，请检查模型名称');
        } else if (error.message.includes('429')) {
          throw new Error('请求频率过高，请稍后重试');
        } else if (error.message.includes('503')) {
          throw new Error('服务暂时不可用，模型正在加载中');
        } else if (error.message.includes('504')) {
          throw new Error('请求超时，请稍后重试');
        }
      }
      
      throw new Error(`在线API调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 调用OpenRouter API的私有方法
  private async callOpenRouterAPI(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
      console.log('OnlineGemmaClient: 调用OpenRouter API');
      
      // 构建OpenRouter API请求
      const messages = params.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // 创建OpenAI客户端用于OpenRouter
      const openRouterClient = new OpenAI({
        baseURL: this.openRouterConfig.baseURL,
        apiKey: this.openRouterConfig.apiKey,
        defaultHeaders: this.openRouterConfig.headers,
      });

      // 调用OpenRouter API
      const completion = await openRouterClient.chat.completions.create({
        model: this.openRouterConfig.model,
        messages: messages,
        max_tokens: params.max_tokens || 300,
        temperature: params.temperature || 0.7,
      });

      console.log('OpenRouter API调用成功');
      console.log('Response:', completion);

      return {
        id: completion.id || `openrouter-${Date.now()}`,
        object: 'chat.completion',
        created: completion.created || Math.floor(Date.now() / 1000),
        model: completion.model || this.openRouterConfig.model,
        choices: completion.choices.map(choice => ({
          index: choice.index,
          message: {
            role: 'assistant',
            content: choice.message.content || 'No response generated'
          },
          finish_reason: choice.finish_reason || 'stop'
        })),
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens || 0,
          completion_tokens: completion.usage.completion_tokens || 0,
          total_tokens: completion.usage.total_tokens || 0
        } : undefined,
      };
    } catch (error) {
      console.error('OpenRouter API调用失败:', error);
      
      // 详细的错误处理
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('OpenRouter API密钥无效，请检查配置');
        } else if (error.message.includes('404')) {
          throw new Error('OpenRouter模型不可用，请检查模型名称');
        } else if (error.message.includes('429')) {
          throw new Error('OpenRouter请求频率过高，请稍后重试');
        } else if (error.message.includes('503')) {
          throw new Error('OpenRouter服务暂时不可用');
        } else if (error.message.includes('504')) {
          throw new Error('OpenRouter请求超时，请稍后重试');
        }
      }
      
      throw new Error(`OpenRouter API调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 测试API连通性的方法
  async testConnectivity(): Promise<boolean> {
    try {
      console.log('OnlineGemmaClient: 测试API连通性');
      
      // 优先测试OpenRouter API
      if (this.openRouterConfig.apiKey) {
        try {
          console.log('OnlineGemmaClient: 测试OpenRouter API连通性');
          const openRouterClient = new OpenAI({
            baseURL: this.openRouterConfig.baseURL,
            apiKey: this.openRouterConfig.apiKey,
            defaultHeaders: this.openRouterConfig.headers,
          });

          const testResponse = await openRouterClient.chat.completions.create({
            model: this.openRouterConfig.model,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10,
          });

          console.log('OnlineGemmaClient: OpenRouter连通性测试成功');
          return true;
        } catch (openRouterError) {
          console.log('OpenRouter连通性测试失败，测试Hugging Face:', openRouterError);
        }
      }

      // 回退到测试Hugging Face API
      const testResponse = await this.openai.chat.completions.create({
        model: 'google/gemma-3-4b-it',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });

      console.log('OnlineGemmaClient: Hugging Face连通性测试成功');
      return true;
    } catch (error) {
      console.error('OnlineGemmaClient: 所有API连通性测试失败:', error);
      return false;
    }
  }
} 