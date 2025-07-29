#!/bin/bash
echo "Mazu Quick Installer"
echo "==================="
echo ""
echo "1. Installing APK..."
adb install mazu-v1.0.0.apk

echo ""
echo "2. Deploying model..."
echo "Please ensure you have gemma-3n-Q4_K_M.gguf in this directory"
if [ -f "gemma-3n-Q4_K_M.gguf" ]; then
    adb push gemma-3n-Q4_K_M.gguf /sdcard/Android/data/com.mazu.app/files/Documents/
    echo "✅ Model deployed successfully!"
else
    echo "❌ Model file not found. Please download gemma-3n-Q4_K_M.gguf"
fi

echo ""
echo "✅ Installation complete!"
echo "📱 Enable airplane mode and open Mazu to test"
