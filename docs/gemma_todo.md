# Gemma 3B Integration To-Do List

This list outlines the steps to integrate the local Gemma 3B model into the React Native application for Android.

- [x] **Step 1: Install `llama.rn` Library**
  - [x] Run `npm install llama.rn --legacy-peer-deps` to add the library to the project.

- [x] **Step 2: Configure Native Projects**
  - [x] **Android:** Run `npx expo prebuild --platform android` to generate the native project.
  - [x] **Android:** Add the Proguard rule `-keep class com.rnllama.** { *; }` to `android/app/proguard-rules.pro`.

- [ ] **Step 3: Add Model File to Project**
  - [ ] Create a new directory: `assets/models`.
  - [ ] Manually move the `gemma-3n-E2B-it-Q4_K_M.gguf` file into the `assets/models` directory.

- [ ] **Step 4: Integrate Model into App Code**
  - [ ] Modify `App.tsx` to import `initLlama` from `llama.rn`.
  - [ ] Add logic to load the model from the local file path when the app starts.
  - [ ] Create a basic UI with a text input, a button, and a text area to display the model's response.
  - [ ] Implement the `onPress` handler for the button to send the input text to the model and update the UI with the result.

- [ ] **Step 5: Run on Android Emulator**
    - [ ] Run `npx expo run:android` to build and launch the app on the emulator.
