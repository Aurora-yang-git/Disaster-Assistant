# Offline AI Assistant: Project Plan

## 1. Core Vision
To create a fully self-contained, offline AI assistant that runs on a mobile device. All components, from voice recognition to knowledge retrieval and language generation, must function without an internet connection.

## 2. System Architecture
The assistant is built on three core offline components:

### a. Offline Voice Recognition (The Ears)
- **Technology:** `useOfflineVoice` hook.
- **Function:** Transcribes user's speech into text directly on the device.
- **Status:** Implemented.

### b. Offline Knowledge Base (The Memory - RAG)
- **Technology:** `KnowledgeLoader` class with local JSON files (e.g., `earthquakeKnowledge.json`).
- **Function:** Provides fast, accurate, pre-defined answers to specific, high-priority questions. This is our Retrieval-Augmented Generation (RAG) system.
- **Status:** Implemented and integrated into the chat UI.

### c. Offline Language Model (The Reasoning - LLM)
- **Technology:** `llama.rn` library with a local Gemma GGUF model.
- **Function:** Provides general conversational ability, understands complex queries, and generates human-like responses based on information provided by the RAG system or its own internal knowledge.
- **Status:** `llama.rn` is installed. Model loading and integration are the next major steps.

## 3. Workflow & Decision Engine
The user interaction follows this offline process:

1.  **Input:** User speaks to the app.
2.  **Transcription:** `useOfflineVoice` converts speech to text.
3.  **Decision:** The transcribed text is sent to a **Decision Engine** (to be built).
    -   **If the query is critical (e.g., "earthquake"):** The engine queries the **RAG system** for a direct, reliable answer.
    -   **If the query is general:** The engine queries the **RAG system** for relevant context, then passes the context and the original query to the **Gemma model** to generate a conversational response.
4.  **Output:** The final answer is displayed in the chat UI.

## 4. Implementation Roadmap

-   [x] **Phase 1: Project Setup & Cleanup**
    -   [x] Resolve initial build and dependency issues.
    -   [x] Remove all online API calls (`useApi`, `ApiKeyContext`).
-   [x] **Phase 2: Offline RAG Integration**
    -   [x] Locate and analyze the offline knowledge base (`KnowledgeLoader`, JSON files).
    -   [x] Integrate the `KnowledgeLoader` into the `Whisper.tsx` chat screen.
    -   [x] Replace placeholder AI responses with real data from the RAG system.
-   [ ] **Phase 3: Offline LLM (Gemma) Integration**
    -   [ ] Place the `gemma-3n-E2B-it-Q4_K_M.gguf` model file into the `assets/models` directory.
    -   [ ] Create a new service/hook to manage the `llama.rn` context (loading the model, managing state).
    -   [ ] Modify the `Whisper.tsx` screen to call the Gemma service for general questions (when RAG returns no results).
-   [ ] **Phase 4: Decision Engine**
    -   [ ] Implement the logic to decide whether to use RAG-only or RAG+Gemma based on the user's query.
-   [ ] **Phase 5: Final Testing & Refinement**
    -   [ ] Thoroughly test all components on an Android device.
    -   [ ] Refine prompts and logic for the best user experience.
