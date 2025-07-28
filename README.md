# Disaster Response Assistant

A React Native + Expo offline application designed for earthquake and natural disaster scenarios. This app integrates offline AI technology to provide real-time survival advice and safety guidance without requiring internet connectivity.

## 🚀 Core Features

- **Disaster Response Chat**: Provides targeted safety advice based on user's current situation
- **Intelligent Memory System**: Remembers user's location, injuries, resources, and other critical information
- **Voice Interaction**: Supports voice input and automatic speech output for hands-free operation during emergencies
- **Fully Offline**: Works without any network connection

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

Since the AI model is >2GB, it must be deployed using native tools:

```bash
# Run the deployment script
./scripts/deploy-model.sh

# Follow the prompts to deploy to iOS/Android
```

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
- [x] RAG knowledge system
- [x] Voice recording functionality
- [x] Offline AI integration (Gemma/TinyLlama)
- [x] Speech-to-text system
- [ ] Text-to-speech functionality
- [ ] Pre-disaster preparation checklist
- [ ] Multi-disaster scenario support
- [ ] Multilingual support

## 🏗️ Architecture

- **Offline-First Design**: All critical features work without internet
- **Modular Services**: Separate services for AI, RAG, and voice
- **Platform-Specific Implementations**: Optimized for each platform
- **Efficient Model Loading**: Lazy loading with progress indicators

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details.

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

**This app is designed for emergency situations. Please ensure:**
- Device is adequately charged
- App is installed before emergencies occur
- You are familiar with basic operations
- Personal safety remains the top priority

**Disclaimer**: This app provides reference suggestions only. In emergencies, please also contact professional rescue services when possible.

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