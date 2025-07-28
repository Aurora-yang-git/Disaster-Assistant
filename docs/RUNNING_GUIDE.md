# 🚀 Voice Assistant Running Guide

This guide explains how to run the Voice Assistant app on iOS and Android simulators, including Gemma 3n model deployment.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [iOS Simulator Setup](#ios-simulator-setup)
- [Android Emulator Setup](#android-emulator-setup)
- [Troubleshooting](#troubleshooting)
- [Testing Guide](#testing-guide)

## Prerequisites

### 1. System Requirements

- **macOS** (required for iOS development)
- **Node.js** 18+ and npm/yarn
- **Xcode** 14+ (for iOS)
- **Android Studio** (for Android)
- **Expo CLI**: `npm install -g expo-cli`

### 2. Clone Project and Install Dependencies

```bash
# Clone the project
git clone [project-url]
cd gemma-3n

# Install dependencies
npm install

# iOS specific dependencies
cd ios
pod install
cd ..
```

### 3. Prepare Model Files

#### Download Gemma 3n Model

1. **Download from Hugging Face**
   - Visit: https://huggingface.co/mlx-community/quantized-gemma-3n/tree/main
   - Download file: `gemma-3n-Q4_K_M.gguf` (approximately 3GB)
   - Or use command line:
   ```bash
   # Install huggingface-cli first
   pip install huggingface-hub
   
   # Download model file
   huggingface-cli download mlx-community/quantized-gemma-3n gemma-3n-Q4_K_M.gguf --local-dir ./models
   ```

2. **Prepare Model Directory**
   ```bash
   # Create model directory
   mkdir -p ./models
   
   # Verify model file is downloaded
   ls -lh ./models/gemma-3n-Q4_K_M.gguf
   # Should show a file of approximately 3GB
   ```

3. **Configure Deployment Script**
   ```bash
   # Set environment variables for deployment script
   export MODEL_DIR="./models"
   export MODEL_NAME="gemma-3n-Q4_K_M.gguf"
   ```

⚠️ **Important Notes**:
- Model files are NOT included in the Git repository (too large)
- Due to Node.js 2GB Buffer limit, native deployment scripts must be used
- First model load may take 10-30 seconds

## iOS Simulator Setup

### Method 1: Using Xcode (Recommended for First Run)

#### Step 1: Open Project
```bash
# From project root directory
open ios/VoiceAssistant.xcworkspace
```
⚠️ Note: Use `.xcworkspace` not `.xcodeproj`

#### Step 2: Configure and Run
1. Select simulator from Xcode top bar (recommend iPhone 14 or 15)
2. Click Run button (▶️) or press `Cmd + R`
3. Wait for build to complete (first time takes 3-5 minutes)

#### Step 3: Deploy Model
```bash
# After app is installed, run in new terminal
./scripts/deploy-model.sh

# Select option 1 (iOS Simulator)
# Script will automatically find running simulator and deploy model
```

#### Step 4: Start Metro
```bash
# From project root
npx expo start --dev-client
```

#### Step 5: Connect App
1. Open Voice Assistant app in simulator
2. Click `http://localhost:8081`
3. Wait for JavaScript bundle to load

### Method 2: Using Expo CLI

#### Step 1: Build and Run
```bash
# Clean build
npx expo run:ios --device

# Or run directly (if previously built)
npx expo run:ios
```

#### Step 2: Deploy Model
Same as Method 1 Step 3

#### Step 3: Subsequent Runs
```bash
# Can use directly after first build
npx expo start --dev-client
```

## Android Emulator Setup

### Initial Setup

#### 1. Start Android Emulator
- Open Android Studio
- Tools → AVD Manager
- Create or start an emulator (recommend Pixel 5 API 33)

#### 2. Verify ADB Connection
```bash
# Check device connection
adb devices
# Should show: emulator-5554 device
```

### Running Steps

#### Step 1: Build and Install
```bash
# First run
npx expo run:android

# Or use Android Studio
# Open android directory as project
# Click Run button
```

#### Step 2: Deploy Model
```bash
# Run deployment script
./scripts/deploy-model.sh

# Select option 2 (Android Emulator)
# Wait for upload to complete (3GB takes 2-5 minutes)
```

#### Step 3: Start App
```bash
# Start Metro
npx expo start --dev-client
```

#### Step 4: Connect App
1. Open Voice Assistant in emulator
2. Click `http://10.0.2.2:8081` (Android emulator specific address)
3. Or use local IP: `http://[your-IP]:8081`

## Troubleshooting

### iOS Issues

#### 1. Pod Installation Failed
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

#### 2. Signing Errors
- Xcode → VoiceAssistant → Signing & Capabilities
- Select "Personal Team" for Team

#### 3. Architecture Errors
- Build Settings → Architectures → Ensure arm64 is included

### Android Issues

#### 1. Metro Connection Failed
```bash
# Reverse proxy port
adb reverse tcp:8081 tcp:8081
```

#### 2. Build Failed
```bash
cd android
./gradlew clean
cd ..
npx expo run:android --clear
```

### Model Deployment Issues

#### 1. Model Not Found
Check deployment paths:
```bash
# iOS
xcrun simctl get_app_container booted com.voiceassistant.app data

# Android
adb shell ls /sdcard/Android/data/com.voiceassistant.app/files/Documents/
```

#### 2. Manual Model Deployment
```bash
# iOS
cp ./models/*.gguf "[APP_CONTAINER]/Documents/"

# Android
adb push ./models/*.gguf /sdcard/Android/data/com.voiceassistant.app/files/Documents/
```

## Testing Guide

### 1. Basic Functionality Tests

#### RAG System Test (Knowledge Base)
```
Input: Earthquake!
Expected: Emergency DROP, COVER, HOLD ON instructions

Input: I'm trapped
Expected: Stay calm, tap on pipes advice

Input: How to find water?
Expected: Water source finding methods
```

#### Gemma Model Test (General Conversation)
```
Input: What's the weather?
Expected: Model-generated response (not from knowledge base)

Input: Tell me a story
Expected: Creative content generation
```

### 2. Voice Function Test
- Long press microphone button
- Speak test phrase
- Release to see recognition result

### 3. Performance Verification
- [ ] Model load time < 5 seconds
- [ ] Response time < 2 seconds
- [ ] Stable memory usage
- [ ] No crashes during continuous conversation

## 🎯 Quick Checklist

### iOS Running Checklist
- [ ] Xcode installed
- [ ] iOS simulator launched
- [ ] App successfully built and installed
- [ ] Model file deployed
- [ ] Metro server running
- [ ] App can have normal conversations

### Android Running Checklist
- [ ] Android Studio installed
- [ ] Android emulator launched
- [ ] ADB connection normal
- [ ] App successfully built and installed
- [ ] Model file deployed
- [ ] Metro server running
- [ ] App can have normal conversations

## 📝 Tips & Tricks

1. **Development Efficiency**
   - Use Xcode/Android Studio for first build
   - Use `npx expo start --dev-client` for subsequent runs
   - Keep simulator open to avoid redeploying model

2. **Debugging Tips**
   - iOS: Check Xcode console for logs
   - Android: `adb logcat | grep -i llama`
   - Metro: Check terminal output

3. **Model Management**
   - Use deployment script's cleanup function to manage space
   - Test with smaller model first (TinyLlama)
   - Switch to larger model (Gemma 3n) for production

---

For unlisted issues, please refer to:
- [Model Deployment Documentation](./MODEL_DEPLOYMENT.md)
- [Project README](../README.md)
- Submit an Issue to the project repository