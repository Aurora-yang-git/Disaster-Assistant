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

export class OnlineGemmaClient {
  private openai: OpenAI;

  constructor() {
    // 使用Hugging Face的推理API端点
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_HF_TOKEN || '',
      baseURL: 'https://huggingface.co/google/gemma-3n-E4B-it',
    });
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    try {
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

  // 测试API连通性的方法
  async testConnectivity(): Promise<boolean> {
    try {
      console.log('OnlineGemmaClient: 测试API连通性');
      
      const testResponse = await this.openai.chat.completions.create({
        model: 'google/gemma-3-4b-it',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });

      console.log('OnlineGemmaClient: 连通性测试成功');
      return true;
    } catch (error) {
      console.error('OnlineGemmaClient: 连通性测试失败:', error);
      return false;
    }
  }
} 