# API Reference

This document provides detailed API documentation for key components and services in the Disaster Response Assistant.

## Table of Contents

- [Services](#services)
  - [GemmaClient](#gemmaclient)
  - [RAGService](#ragservice)
  - [ResponseValidator](#responsevalidator)
- [Hooks](#hooks)
  - [useGemmaApi](#usegemmaapi)
  - [useRAGApi](#useragapi)
  - [useOfflineVoice](#useofflinevoice)
- [Components](#components)
  - [Whisper](#whisper)
  - [Chat](#chat)
- [Data Types](#data-types)

## Services

### GemmaClient

**Location**: `app/services/gemma/GemmaClient.native.ts` (iOS/Android)  
**Location**: `app/services/gemma/GemmaClient.web.ts` (Web)

The GemmaClient manages interaction with the offline AI model.

#### Constructor

```typescript
constructor(config?: GemmaConfig)
```

**Parameters:**
- `config` (optional): Configuration object
  - `modelPath`: Path to model file (default: "gemma-3n")
  - `maxTokens`: Maximum tokens to generate (default: 150)
  - `temperature`: Model temperature (default: 0.7)

#### Methods

##### loadModel()
```typescript
async loadModel(): Promise<void>
```
Loads the AI model into memory. Automatically called on first use.

**Throws:**
- Error if model file not found
- Error if loading fails

##### createChatCompletion()
```typescript
async createChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>
```

**Parameters:**
```typescript
interface ChatCompletionParams {
  model: string;              // Model name
  messages: Message[];        // Conversation history
  max_tokens?: number;        // Max tokens to generate
  temperature?: number;       // Response randomness (0-1)
  stream?: boolean;          // Streaming (not implemented)
}
```

**Returns:**
```typescript
interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### RAGService

**Location**: `app/services/rag/RAGService.ts`

Singleton service for Retrieval-Augmented Generation.

#### Methods

##### getInstance()
```typescript
static getInstance(): RAGService
```
Returns the singleton instance.

##### processQuery()
```typescript
async processQuery(query: string): Promise<RAGContext>
```

**Parameters:**
- `query`: User's question

**Returns:**
```typescript
interface RAGContext {
  relevantKnowledge: KnowledgeItem[];
  contextualPrompt: string;
  emergencyPriority: 'critical' | 'urgent' | 'important' | 'normal';
  quickActions: string[];
}
```

##### getQuickActions()
```typescript
getQuickActions(query: string): string[]
```
Returns quick action suggestions based on keywords.

### ResponseValidator

**Location**: `app/services/rag/ResponseValidator.ts`

Validates AI responses for safety and accuracy.

#### Methods

##### validateResponse()
```typescript
validateResponse(
  query: string,
  response: string,
  relevantKnowledge: KnowledgeItem[]
): ValidationResult
```

**Returns:**
```typescript
interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  suggestedResponse?: string;
}
```

##### getSafeResponse()
```typescript
getSafeResponse(query: string, validationResult: ValidationResult): string
```
Returns a safe fallback response when validation fails.

## Hooks

### useGemmaApi

**Location**: `app/hooks/useGemmaApi.ts`

React hook for interacting with the Gemma AI model.

```typescript
const { messages, getCompletion, generateImage, speechToText } = useGemmaApi();
```

**Returns:**
- `messages`: Array of conversation messages
- `getCompletion(prompt: string)`: Send message to AI
- `generateImage(prompt: string)`: Not implemented (shows error)
- `speechToText(audioUri: string)`: Not implemented (shows error)

### useRAGApi

**Location**: `app/hooks/useRAGApi.ts`

React hook for RAG-enhanced chat (legacy, uses OpenAI).

```typescript
const { messages, getCompletion, generateImage, speechToText } = useRAGApi();
```

Similar interface to useGemmaApi but uses OpenAI API with RAG enhancement.

### useOfflineVoice

**Location**: `app/hooks/useOfflineVoice.ts`

React hook for offline voice recognition.

```typescript
const {
  isRecording,
  voiceResults,
  partialResults,
  startRecording,
  stopRecording,
  cancelRecording
} = useOfflineVoice();
```

**Returns:**
- `isRecording`: Boolean indicating recording state
- `voiceResults`: Final transcription results
- `partialResults`: Real-time partial results
- `startRecording()`: Start voice recording
- `stopRecording()`: Stop and get transcription
- `cancelRecording()`: Cancel without processing

## Components

### Whisper

**Location**: `app/screens/Whisper.tsx`

Main chat interface with voice capabilities.

**Props:** None (uses internal state)

**Key Features:**
- Voice input with visual feedback
- Text input fallback
- Message history display
- AI thinking indicator

### Chat

**Location**: `app/screens/Chat.tsx`

Alternative chat interface (legacy).

**Props:** None (uses internal state)

**Features:**
- Text-only input
- Simple message display
- RAG + ChatGPT integration

## Data Types

### Message
```typescript
interface Message {
  content: string;
  role: Role;
}

enum Role {
  User = 'user',
  Assistant = 'assistant'
}
```

### KnowledgeItem
```typescript
interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  content: string;
  priority: number;
  source?: string;
  lastUpdated?: string;
}
```

### ChatMessage (Whisper component)
```typescript
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
```

## Error Handling

All services follow a consistent error handling pattern:

```typescript
try {
  // Operation
} catch (error) {
  console.error('Descriptive error message:', error);
  // Return safe fallback or throw
}
```

## Platform Differences

### Native (iOS/Android)
- Full AI model support via llama.rn
- Native voice recognition
- Direct file system access

### Web
- Mock AI responses
- Browser speech API
- Limited to RAG knowledge base

## Usage Examples

### Basic Chat Flow
```typescript
// In a React component
const { getCompletion, messages } = useGemmaApi();

const handleSendMessage = async (text: string) => {
  await getCompletion(text);
  // Messages array automatically updated
};
```

### Voice Input
```typescript
const { startRecording, stopRecording, voiceResults } = useOfflineVoice();

const handleVoiceInput = async () => {
  await startRecording();
  // User speaks...
  const result = await stopRecording();
  if (result.text) {
    await handleSendMessage(result.text);
  }
};
```

### Direct Service Usage
```typescript
// Using services directly (not recommended in components)
const ragService = RAGService.getInstance();
const context = await ragService.processQuery("earthquake safety");

const validator = ResponseValidator.getInstance();
const validation = validator.validateResponse(
  query,
  aiResponse,
  context.relevantKnowledge
);
```

## Best Practices

1. **Always use hooks in React components** rather than services directly
2. **Handle loading states** when calling async operations
3. **Provide user feedback** for voice operations
4. **Test offline scenarios** thoroughly
5. **Monitor memory usage** when working with AI models