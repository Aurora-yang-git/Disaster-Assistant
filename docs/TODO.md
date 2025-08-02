# Earthquake Survival Chat App - TODO List

## Phase 1: Foundation (Week 1) ✅

### Model Integration
- [x] Research Gemma 3n model formats and download options
- [x] **CRITICAL: Verify model size after quantization (expect ~1.3GB for INT4)** *(Actual: ~3GB for Q4_K_M)*
- [x] Choose inference runtime ~~(TensorFlow Lite vs ONNX vs MediaPipe)~~ *(Using llama.rn)*
- [x] Set up model loading and basic inference pipeline
- [x] Create ~~mock~~ Gemma API interface matching OpenAI structure
- [x] Test basic text generation on device
- [x] Measure inference speed and memory usage *(~2 seconds response time)*
- [x] Decide on app distribution strategy if model > 500MB *(Separate deployment script)*

### Project Setup
- [x] Fork and clone the ChatGPT Assistant template
- [x] Remove OpenAI dependencies from package.json
- [x] Set up development environment for chosen ML runtime
- [x] Create project structure for knowledge base
- [x] Document setup process for teammate

## Phase 2: Knowledge & RAG (Week 2) ✅

### Knowledge Base Development
- [x] Research authoritative earthquake survival sources (FEMA, Red Cross)
- [x] Compile 10-20 essential survival tips *(50+ tips compiled)*
- [x] Structure knowledge in categories (During, After, First Aid, Water, Shelter)
- [x] Create JSON/~~SQLite~~ schema for knowledge storage
- [x] Write clear, concise survival instructions
- [x] Validate information with emergency response guidelines

### RAG Implementation
- [ ] ~~**Plan A: Implement lightweight vector search using MiniLM TFLite**~~
  - [ ] ~~Pre-compute embeddings for all knowledge base entries~~
  - [ ] ~~Implement cosine similarity search~~
- [x] **Plan B (Fallback): Enhanced keyword system** *(Implemented as primary approach)*
  - [x] Design keyword extraction with synonyms
  - [x] Add multiple phrasings per knowledge item ("被困", "压住", "trapped")
- [x] Create mapping between queries and knowledge topics
- [x] Implement retrieval logic with semantic understanding
- [x] Add context injection into prompts
- [x] Test retrieval accuracy with panic-scenario queries
- [x] Optimize for mobile performance

## Phase 3: Integration & Polish (Week 3) ✅

### App Integration
- [x] Replace OpenAI calls with Gemma 3n interface
- [x] Connect RAG system to chat flow
- [x] Implement offline storage for chat history
- [x] Add loading states and error handling
- [x] **Add Quick Action Buttons for panic scenarios:**
  - [x] "🚨 Emergency" (I need immediate help!)
  - [x] "🏥 Medical Help" (I'm injured and need medical help)
  - [x] "🆘 Trapped" (I'm trapped and can't move)
  - [x] "✅ Safe" (I'm safe but need guidance)
- [x] **Implement high-contrast, large-button panic UI mode**
- [x] Ensure app works fully offline
- [ ] Test on physical Android device *(iOS tested, Android has deployment issues)*

### Demo Preparation
- [ ] Create compelling demo scenarios
- [ ] Write script for video demonstration
- [ ] Design test cases showing offline functionality
- [ ] Prepare before/after earthquake scenarios
- [ ] Test app under various network conditions

## Phase 4: Hackathon Submission

### Video Production
- [ ] Record app demo showing real-world impact
- [ ] Show offline functionality clearly
- [ ] Demonstrate quick response times
- [ ] Include emotional storytelling element
- [ ] Edit to under 3 minutes
- [ ] Upload to YouTube/platform

### Documentation
- [ ] Write technical writeup explaining architecture
- [ ] Document Gemma 3n integration approach
- [ ] Explain RAG implementation
- [ ] Create clear README with setup instructions
- [ ] Prepare code repository for public release
- [ ] Submit Kaggle writeup with all links

## Ongoing Tasks

### Testing & Optimization
- [ ] Monitor app size (be realistic about >1GB with model)
- [ ] **Consider Android App Bundle with install-time assets if needed**
- [ ] Optimize model loading time
- [ ] Test on low-end devices
- [ ] **Test UI under simulated panic conditions (shaking hands, poor lighting)**
- [ ] Verify offline functionality
- [ ] Collect performance metrics

### Knowledge Quality & Legal
- [ ] Fact-check all survival information
- [ ] **Add prominent disclaimer about emergency information**
- [ ] **Cite all official sources (FEMA, Red Cross, 应急管理部)**
- [ ] Ensure advice is globally applicable
- [ ] Add location-specific tips if time permits
- [ ] Review for clarity and actionability
- [ ] **Validate all advice with multiple authoritative sources**

## Nice-to-Have (If Time Permits)
- [x] Add voice input using device microphone *(Implemented with useOfflineVoice)*
- [ ] Implement image recognition for injuries
- [ ] Create Spanish language support
- [ ] Add battery-saving mode
- [x] Build iOS version *(Full support implemented)*
- [x] Create web demo *(Development mode available)*

## Team Coordination
- [ ] Daily sync on progress
- [ ] Share API interfaces early
- [ ] Test integration points regularly
- [ ] Divide video production tasks
- [ ] Review each other's work

## Success Checklist
- [ ] App works completely offline
- [ ] Responds in under 2 seconds
- [ ] Provides accurate survival information
- [ ] Runs on real Android device
- [ ] Video tells compelling story
- [ ] Code is clean and documented
- [ ] All submission requirements met