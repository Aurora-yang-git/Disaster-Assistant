# Mazu - Offline AI Disaster Response Assistant

A React Native + Expo application that runs Gemma 3n entirely on-device for life-critical emergency response. When networks fail during any disaster - earthquakes, floods, hurricanes, or other emergencies - Mazu continues to provide AI-powered survival guidance without requiring internet connectivity.

## 📲 Quick Start - Try Mazu Now

### Android APK Download
- **Download APK**: [mazu-v1.0.0.apk](https://github.com/Aurora-yang-git/Disaster-Assistant/releases/latest) (210MB)
- **Model File**: [gemma-3n-E2B-it-Q4_K_M.gguf](https://huggingface.co/unsloth/gemma-3n-E2B-it-GGUF?show_file_info=gemma-3n-E2B-it-Q4_K_M.gguf) (2.3GB)
- **Installation**: Enable "Install from Unknown Sources" in Android settings

### Important Setup Steps
1. Install the APK on your Android device
2. Download the Gemma 3n model file (instructions below)
3. Deploy the model using our deployment script
4. Enable airplane mode to test offline functionality

## 🚀 Core Features

- **100% On-Device AI**: Gemma 3n (2.3GB) runs entirely on mobile devices
- **Edge-Optimized Performance**: <2 second response time using quantized models
- **Disaster Response Chat**: Context-aware survival guidance based on user's situation
- **Intelligent Memory System**: Tracks location, injuries, and resources throughout crisis
- **Voice Interaction**: Hands-free operation for injured users
- **Zero Network Dependency**: True edge computing - works in airplane mode

## 📱 Supported Platforms

- **Android** (Primary development platform)
- **iOS** (Full support)
- **Web** (Development and testing)

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo
- **AI Technology**: Gemma offline model + RAG (Retrieval-Augmented Generation)
- **Local Storage**: AsyncStorage
- **Voice Features**: Native system APIs
- **State Management**: React Context + Hooks

## 📋 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: macOS with Xcode 14+
- For Android: Android Studio
- ~4GB free storage for AI model

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd gemma-3n

# Install dependencies
npm install

# iOS specific (macOS only)
cd ios && pod install && cd ..
```

### Model Deployment

The Gemma 3n model file (2.3GB) must be deployed separately from the app:

#### Option 1: Automatic Deployment (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/mazu.git
cd mazu

# Run the deployment script
./scripts/deploy-model.sh

# Select option 2 for Android deployment
```

#### Option 2: Manual Deployment
1. Download the model: `gemma-3n-E2B-it-Q4_K_M.gguf` from [Hugging Face](https://huggingface.co/unsloth/gemma-3n-E2B-it-GGUF?show_file_info=gemma-3n-E2B-it-Q4_K_M.gguf)
2. Connect your Android device via USB
3. Copy the model file to: `/sdcard/Android/data/com.mazu.app/files/Documents/`

For detailed instructions, see [MODEL_DEPLOYMENT.md](docs/MODEL_DEPLOYMENT.md)

### Running the App

```bash
# Start development server
npx expo start --dev-client

# Or run directly on platform
npx expo run:ios      # iOS
npx expo run:android  # Android
```

For complete running instructions, see [RUNNING_GUIDE.md](docs/RUNNING_GUIDE.md)

## 💡 Usage Guide

1. **Launch the app** and grant microphone permissions
2. **Describe your situation** using voice or text input
3. **Receive AI guidance** based on your specific circumstances
4. **Continue the conversation** - the AI remembers context for follow-up questions

### Voice Features

- 🎤 **Voice Input**: Long press the microphone button to record
- 🔊 **Voice Output**: AI responses are automatically spoken
- 📱 **Offline Processing**: All voice features work without internet

## 🎯 Development Roadmap

- [x] Basic chat interface
- [x] RAG knowledge system (earthquake scenarios)
- [x] Voice recording functionality
- [x] Offline AI integration (Gemma 3n)
- [x] Context-aware memory system
- [ ] Text-to-speech functionality
- [ ] Expand to other disasters (floods, hurricanes, fires)
- [ ] Pre-disaster preparation checklists
- [ ] Multilingual support
- [ ] Location-based disaster guidance

## 🏗️ Architecture

### Technical Stack
- **AI Model**: Gemma 3n Q4_K_M (2.3GB quantized)
- **Inference Engine**: llama.rn for cross-platform execution
- **Frontend**: React Native + Expo
- **Voice**: Native speech recognition APIs
- **Storage**: AsyncStorage for conversation history

### Performance Metrics
- **Model Size**: 2.3GB (quantized from 9GB)
- **Response Time**: 1.2-1.8 seconds
- **RAM Usage**: ~3GB during inference
- **Minimum Device**: 4GB+ RAM recommended

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed technical implementation.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

Quick steps:
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 Emergency Usage Notice

**This app is designed for all types of emergency situations:**
- 🌍 **Earthquakes** - Drop, cover, hold procedures and post-quake survival
- 🌊 **Floods** - Evacuation routes and water safety
- 🌪️ **Hurricanes/Typhoons** - Shelter protocols and storm preparation
- 🔥 **Fires** - Escape procedures and smoke inhalation prevention
- 🏔️ **Avalanches** - Survival techniques and rescue signaling
- ⚡ **General Emergencies** - First aid, signaling, and resource management

**Important Guidelines:**
- Install and test the app BEFORE emergencies occur
- Keep your device adequately charged
- Download the AI model when you have good connectivity
- This app provides guidance but cannot replace professional rescue services

**Current Version**: Focuses on earthquake scenarios as the primary use case, with plans to expand to comprehensive disaster coverage.

## 📚 Documentation

- [Running Guide](docs/RUNNING_GUIDE.md) - How to run the project
- [Model Deployment](docs/MODEL_DEPLOYMENT.md) - Deploy AI models to devices
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture overview
- [API Reference](docs/API_REFERENCE.md) - Component and service documentation
- [Contributing](docs/CONTRIBUTING.md) - How to contribute

## 🔗 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Gemma Model Info](https://ai.google.dev/gemma)
- [llama.rn Library](https://github.com/mybigday/llama.rn)

