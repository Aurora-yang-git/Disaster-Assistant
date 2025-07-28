# Earthquake Survival Chat App - MVP Definition

## Project Overview
An offline-first mobile chat application powered by Gemma 3n that provides critical earthquake survival information without requiring internet connectivity.

## MVP Core Features

### 1. Offline Gemma 3n Integration
- Replace OpenAI API with local Gemma 3n inference
- Model runs entirely on-device
- No internet connection required
- Target response time: <2 seconds per query

### 2. Essential Knowledge Base
- 10-20 critical earthquake survival tips covering:
  - **During earthquake**: Drop, Cover, Hold On procedure
  - **After earthquake**: Safety checks, evacuation procedures
  - **Water**: Finding and purifying water sources
  - **First aid**: Basic injury treatment
  - **Shelter**: Creating safe temporary shelter
  - **Communication**: Emergency contact methods

### 3. Simple RAG Implementation
- Keyword-based retrieval system
- Match user queries to relevant survival tips
- Example mappings:
  - "earthquake happening" → Drop/Cover/Hold instructions
  - "water", "thirsty" → Water purification methods
  - "injured", "bleeding" → First aid procedures

### 4. Basic Chat Interface
- Utilize existing ChatGPT Assistant template UI
- Simple question-answer format
- Chat history persistence (local storage)
- Clear, readable text formatting

### 5. Platform Support
- **Primary target**: Android (easier deployment)
- iOS and Web support if time permits

## Demo Scenario

```
User: "What do I do during an earthquake?"
App: "DROP to your hands and knees immediately. COVER your head and neck under a sturdy desk or table. HOLD ON to your shelter and be prepared to move with it. Stay in position until shaking stops."

User: "How can I find clean water?"
App: "After an earthquake: 1) Check water heater tank (turn off power first), 2) Toilet tank water (not bowl) is usually safe, 3) Ice cubes in freezer. To purify: Boil for 1 minute, or use 8 drops of bleach per gallon, wait 30 minutes."

User: "Someone is bleeding badly"
App: "Apply direct pressure with clean cloth. Elevate the wound above heart if possible. Do NOT remove embedded objects. If blood soaks through, add more cloth without removing first layer. Call 911 if available."
```

## Success Metrics
- Answers 5 basic earthquake survival questions offline
- Response time under 2 seconds
- Works without any internet connection
- Clear, actionable survival information

## NOT in MVP (Future Features)
- Voice input/output
- Image recognition capabilities
- Dynamic model size switching (2B/4B)
- Multi-language support
- Advanced RAG with semantic search
- Battery optimization features
- Social features or location sharing

## Technical Architecture

### Components
1. **Model Runtime**: TensorFlow Lite or MediaPipe
2. **Model Storage**: Local file system (~3GB for Gemma 3n)
3. **Knowledge Base**: JSON/SQLite for survival tips
4. **RAG System**: Simple keyword matching algorithm
5. **UI Layer**: React Native (existing template)

### Development Priorities
1. Get basic Gemma 3n inference working
2. Create minimal knowledge base
3. Implement keyword matching
4. Integrate with chat UI
5. Test on real device

## Timeline
- **Week 1**: Gemma 3n integration, basic inference
- **Week 2**: Knowledge base creation, RAG implementation
- **Week 3**: UI integration, testing, demo video preparation

## Hackathon Alignment
- **Category**: Crisis Response / Accessibility
- **Key Features**: Offline-first, privacy-preserving, real-world impact
- **Unique Value**: Life-saving information when infrastructure fails