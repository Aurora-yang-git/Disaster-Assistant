# Technical Architecture

## Overview

The Disaster Response Assistant is built with an offline-first architecture, ensuring all critical features work without internet connectivity. The system uses a modular design with platform-specific implementations for optimal performance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Interface                          │
│                    (React Native + Expo)                         │
├─────────────────┬───────────────────┬───────────────────────────┤
│   Voice Input   │   Chat Interface  │    Voice Output           │
│  (Native APIs)  │   (React Native)  │   (Text-to-Speech)       │
└────────┬────────┴─────────┬─────────┴───────────┬───────────────┘
         │                  │                     │
         ▼                  ▼                     │
┌─────────────────┐ ┌──────────────┐            │
│ Speech-to-Text  │ │ Chat Service │            │
│    Service      │ │              │            │
└────────┬────────┘ └──────┬───────┘            │
         │                 │                     │
         ▼                 ▼                     │
┌─────────────────────────────────────────────────┐
│              Decision Engine                     │
│         (Query Classification)                   │
└─────────┬─────────────────┬─────────────────────┘
          │                 │
          ▼                 ▼
┌──────────────────┐ ┌─────────────────┐
│   RAG Service    │ │  Gemma Client   │
│ (Knowledge Base) │ │ (AI Model)      │
└──────────────────┘ └─────────────────┘
```

## Core Components

### 1. User Interface Layer

**Technology**: React Native + Expo

**Components**:
- `Whisper.tsx` - Main chat interface with voice capabilities
- `Chat.tsx` - Alternative chat interface (legacy)
- `DrawerNavigation.tsx` - Navigation structure

**Key Features**:
- Platform-agnostic UI components
- Responsive design for different screen sizes
- Accessibility support

### 2. Voice Services

#### Speech-to-Text
**Implementation**: `useOfflineVoice.ts`
- iOS: Native Speech Recognition API
- Android: Google Speech Recognition
- Web: Browser Speech API

#### Text-to-Speech (Planned)
- iOS: AVSpeechSynthesizer
- Android: Android TTS
- Web: Web Speech API

### 3. AI Services

#### GemmaClient
**Purpose**: Manages offline AI model interaction

**Platform-specific implementations**:
- `GemmaClient.native.ts` - iOS/Android using llama.rn
- `GemmaClient.web.ts` - Web mock implementation

**Key Features**:
- Model loading with progress tracking
- Memory-efficient inference
- Conversation history management
- Error handling and fallbacks

#### RAG Service
**Purpose**: Retrieval-Augmented Generation for verified knowledge

**Components**:
- `RAGService.ts` - Query processing and knowledge retrieval
- `KnowledgeLoader.ts` - Singleton knowledge base manager
- `ResponseValidator.ts` - Response verification
- `useUserContext.ts` - User context tracking hook

**Features**:
- Keyword-based search (no vector DB required)
- Priority classification (critical/urgent/important/normal)
- Multi-language support
- Quick action suggestions
- User context extraction (location, injuries, companions)
- Conversation history management

### 4. Data Layer

#### Knowledge Base
**Format**: JSON files
**Location**: `app/data/earthquakeKnowledge.json`

**Structure**:
```json
{
  "knowledge": [{
    "id": "unique-id",
    "category": "during|after|preparedness",
    "title": "Knowledge title",
    "keywords": ["keyword1", "keyword2"],
    "content": "Detailed information",
    "priority": 1-5
  }]
}
```

#### Local Storage
- **Technology**: AsyncStorage
- **Usage**: Chat history, user preferences
- **Platform**: All platforms

## Platform-Specific Considerations

### iOS
- **Model Format**: GGUF via llama.rn
- **Deployment**: xcrun simctl for simulators
- **Storage**: App Documents directory
- **Permissions**: Microphone, Speech Recognition

### Android
- **Model Format**: GGUF via llama.rn
- **Deployment**: adb push for devices
- **Storage**: External files directory
- **Permissions**: RECORD_AUDIO, INTERNET (for dev)

### Web
- **Model**: Mock implementation (no actual model)
- **Features**: Limited to RAG knowledge base
- **Purpose**: Development and testing

## Model Deployment Architecture

### Challenge: Node.js 2GB Limit
- Model files are ~3GB
- Cannot use standard bundling

### Solution: Native Deployment
```bash
iOS:    xcrun simctl → App Container/Documents/
Android: adb push → /sdcard/Android/data/com.mazu.app/files/
```

### Model Loading Process
1. Check multiple possible locations
2. Verify file existence and size
3. Initialize llama.rn context
4. Load model into memory
5. Ready for inference

## Performance Optimizations

### 1. Lazy Loading
- Models loaded only when needed
- UI remains responsive during loading

### 2. Memory Management
- Single model instance (singleton)
- Conversation history trimming (last 6 rounds)
- Efficient tokenization

### 3. Response Caching
- RAG responses cached by query
- Reduces redundant searches

## Security Considerations

### 1. Offline Operation
- No data leaves device
- No external API calls in production
- Complete privacy preservation

### 2. Input Validation
- Query sanitization
- Response validation
- Medical disclaimer enforcement

### 3. Model Security
- Models stored in app-specific directories
- No network access for model files
- Integrity checks (planned)

## Future Architecture Enhancements

### 1. Model Management
- Multiple model support
- Dynamic model switching
- Model versioning

### 2. Enhanced RAG
- Vector embeddings
- Semantic search
- Larger knowledge base

### 3. Additional Features
- Offline maps integration
- Sensor data utilization
- Peer-to-peer communication

## Development Guidelines

### Adding New Features
1. Maintain offline-first principle
2. Implement platform-specific when needed
3. Test on all target platforms
4. Update documentation

### Code Organization
```
app/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # Business logic
│   ├── gemma/     # AI model service
│   └── rag/       # Knowledge retrieval
├── hooks/         # Custom React hooks
├── data/          # Static data files
└── navigation/    # Navigation configuration
```

### Testing Strategy
- Unit tests for services
- Integration tests for AI pipeline
- E2E tests for critical user flows
- Performance benchmarks

## Deployment Architecture

### Development
- Expo development build
- Hot reloading support
- Debug logging enabled

### Production
- Standalone apps
- Optimized builds
- Minimal logging
- Error tracking (planned)