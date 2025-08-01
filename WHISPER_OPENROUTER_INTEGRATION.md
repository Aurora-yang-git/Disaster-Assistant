# Whisper OpenRouter 集成说明

## 概述

Whisper.tsx 已成功更新，现在使用集成 OpenRouter API 的 OnlineGemmaClient。简化了代码结构，移除了不必要的依赖，提供了更稳定的 API 调用体验。

## 主要修改

### 1. 简化了 processMessage 函数
- 移除了对不存在的 useUserContext 的依赖
- 移除了复杂的 OpenRouter API 直接调用
- 使用更新后的 OnlineGemmaClient，自动处理 API 回退

### 2. 移除了不必要的功能
- 移除了 context awareness bar
- 移除了复杂的用户上下文管理
- 简化了错误处理逻辑

### 3. 优化了 API 调用
- 直接使用 OnlineGemmaClient.createChatCompletion()
- 自动处理 OpenRouter 和 Hugging Face 的回退
- 统一的错误处理机制

## 新的 processMessage 函数

```typescript
const processMessage = async (text: string) => {
  if (!text || text.trim().length === 0) return;

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    text: text,
    isUser: true,
    timestamp: new Date(),
  };
  setChatMessages((prev) => [...prev, userMessage]);
  setIsProcessing(true);

  // Convert chat history to the format GemmaClient expects
  const history: Message[] = chatMessages.map((msg) => ({
    role: msg.isUser ? Role.User : Role.Assistant,
    content: msg.text,
  }));

  // Add the new user message to the history for the API call
  const messages: Message[] = [
    ...history,
    { role: Role.User, content: text },
  ];

  try {
    // 使用更新后的OnlineGemmaClient，它会自动处理OpenRouter和Hugging Face的回退
    const completion = await gemmaClient.createChatCompletion({
      model: "google/gemma-3n-e4b-it:free",
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    // 处理响应...
  } catch (error) {
    // 错误处理...
  }
};
```

## 功能特性

### 1. 智能 API 回退
- OnlineGemmaClient 自动优先使用 OpenRouter API
- 如果 OpenRouter 失败，自动回退到 Hugging Face API
- 无需手动处理 API 选择逻辑

### 2. 简化的错误处理
- 统一的错误处理机制
- 用户友好的错误信息
- 详细的日志记录

### 3. 优化的用户体验
- 保持了原有的 UI 交互
- 语音输入功能完整保留
- 快速操作按钮功能正常

## 环境变量配置

确保设置了正确的环境变量：

```bash
# OpenRouter API 配置
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
EXPO_PUBLIC_SITE_URL=https://your-app-domain.com

# Hugging Face API 配置 (备用)
EXPO_PUBLIC_HF_TOKEN=your_huggingface_token
```

## 使用方法

### 1. 语音输入
- 长按录音按钮开始语音输入
- 松开按钮结束录音并发送消息
- 自动转换为文本并调用 AI API

### 2. 文本输入
- 在输入框中输入文本
- 点击发送按钮或按回车键发送
- 自动调用 AI API 获取回复

### 3. 快速操作
- 点击预设的快速操作按钮
- 自动发送相应的紧急情况消息
- 获得针对性的 AI 回复

## 日志输出

### 1. 成功调用
```
OnlineGemmaClient: 尝试使用OpenRouter API
OnlineGemmaClient: 调用OpenRouter API
OpenRouter API调用成功
Response: {...}
```

### 2. 回退调用
```
OnlineGemmaClient: 尝试使用OpenRouter API
OpenRouter API失败，回退到Hugging Face: Error
OnlineGemmaClient: 开始调用Hugging Face API
OnlineGemmaClient: API调用成功
```

## 注意事项

1. 确保环境变量正确配置
2. 网络连接稳定
3. 语音权限已授权
4. 监控 API 使用量
5. 定期检查错误日志

## 更新日志

- 2024-01-XX: 简化 Whisper.tsx
- 移除 useUserContext 依赖
- 使用集成 OpenRouter 的 OnlineGemmaClient
- 优化错误处理
- 修复 TypeScript 类型错误 