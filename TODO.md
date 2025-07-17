# Earthquake Survival Chat App - TODO List

## Phase 1: Foundation (Week 1)

### Model Integration
- [ ] Research Gemma 3n model formats and download options
- [ ] **CRITICAL: Verify model size after quantization (expect ~1.3GB for INT4)**
- [ ] Choose inference runtime (TensorFlow Lite vs ONNX vs MediaPipe)
- [ ] Set up model loading and basic inference pipeline
- [ ] Create mock Gemma API interface matching OpenAI structure
- [ ] Test basic text generation on device
- [ ] Measure inference speed and memory usage
- [ ] Decide on app distribution strategy if model > 500MB

### Project Setup
- [ ] Fork and clone the ChatGPT Assistant template
- [ ] Remove OpenAI dependencies from package.json
- [ ] Set up development environment for chosen ML runtime
- [ ] Create project structure for knowledge base
- [ ] Document setup process for teammate

## Phase 2: Knowledge & RAG (Week 2)

### Knowledge Base Development
- [ ] Research authoritative earthquake survival sources (FEMA, Red Cross)
- [ ] Compile 10-20 essential survival tips
- [ ] Structure knowledge in categories (During, After, First Aid, Water, Shelter)
- [ ] Create JSON/SQLite schema for knowledge storage
- [ ] Write clear, concise survival instructions
- [ ] Validate information with emergency response guidelines

### RAG Implementation
- [ ] **Plan A: Implement lightweight vector search using MiniLM TFLite**
  - [ ] Pre-compute embeddings for all knowledge base entries
  - [ ] Implement cosine similarity search
- [ ] **Plan B (Fallback): Enhanced keyword system**
  - [ ] Design keyword extraction with synonyms
  - [ ] Add multiple phrasings per knowledge item ("被困", "压住", "trapped")
- [ ] Create mapping between queries and knowledge topics
- [ ] Implement retrieval logic with semantic understanding
- [ ] Add context injection into prompts
- [ ] Test retrieval accuracy with panic-scenario queries
- [ ] Optimize for mobile performance

## Phase 3: Integration & Polish (Week 3)

### App Integration
- [ ] Replace OpenAI calls with Gemma 3n interface
- [ ] Connect RAG system to chat flow
- [ ] Implement offline storage for chat history
- [ ] Add loading states and error handling
- [ ] **Add Quick Action Buttons for panic scenarios:**
  - [ ] "我被困住了" (I'm trapped)
  - [ ] "我正在流血" (I'm bleeding)
  - [ ] "如何找水？" (How to find water?)
  - [ ] "余震来了怎么办？" (What to do in aftershock?)
- [ ] **Implement high-contrast, large-button panic UI mode**
- [ ] Ensure app works fully offline
- [ ] Test on physical Android device

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
- [ ] Add voice input using device microphone
- [ ] Implement image recognition for injuries
- [ ] Create Spanish language support
- [ ] Add battery-saving mode
- [ ] Build iOS version
- [ ] Create web demo

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