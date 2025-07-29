# Mazu v1.0.0 - Initial Release

## 🚨 Offline AI Disaster Response Assistant

Mazu is an offline AI assistant that provides life-saving guidance during disasters using Google's Gemma 3n model running entirely on-device. This initial release focuses on earthquake scenarios as a proof of concept, with plans to expand to all types of emergencies.

### 📱 Installation Instructions

1. **Download the APK** (210MB) from the release assets below
2. **Enable "Install from Unknown Sources"** in your Android settings
3. **Install the APK** on your device
4. **Download the AI Model** (2.3GB):
   - Download `gemma-3n-Q4_K_M.gguf` from [this link](#) 
   - Or use the model file from `assets/models/` if you cloned the repo
5. **Deploy the Model**:
   - Connect your device via USB
   - Run `./scripts/deploy-model.sh` and select Android
   - Or manually copy to: `/sdcard/Android/data/com.mazu.app/files/Documents/`

### ✨ Features

- 🤖 **100% Offline AI** - Works without internet using Gemma 3n
- 🎤 **Voice Input** - Hands-free operation for injured users
- 🚨 **Emergency Dashboard** - Real-time status tracking
- 💬 **Contextual Guidance** - Remembers your situation throughout conversation
- ⚡ **Fast Response** - 1.2-1.8 second inference time

### 📋 System Requirements

- Android 7.0+ (API level 24+)
- 4GB+ RAM recommended
- 3GB free storage (for app + model)

### 🧪 Testing the App

1. Open Mazu after model deployment
2. **Enable Airplane Mode** to verify offline functionality
3. Try scenarios like:
   - "I'm trapped and my leg is bleeding"
   - "The building is shaking, what do I do?"
   - "I smell gas and I'm on the 5th floor"
   - "How do I signal for help?"
   - "What should I do about this injury?"

### ⚠️ Important Notes

- This is a debug build for hackathon demonstration
- The model file (2.3GB) must be deployed separately due to size
- First launch may take 10-20 seconds to load the model
- Ensure adequate battery before relying on this in real emergencies

### 🐛 Known Issues

- Model deployment requires USB connection or manual file transfer
- iOS version coming soon
- Text-to-speech not yet implemented

### 🙏 Acknowledgments

Built for the Google Gemma Developer Contest 2024 using:
- Gemma 3n by Google
- llama.rn for on-device inference
- React Native + Expo

---

**Remember**: This app is designed to help when all else fails, but always seek professional emergency services when available.