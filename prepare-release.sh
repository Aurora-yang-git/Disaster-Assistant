#!/bin/bash
# Prepare Mazu release package for hackathon submission

echo "🚀 Preparing Mazu Release Package"
echo "=================================="

# Create release directory
RELEASE_DIR="mazu-release-v1.0.0"
mkdir -p $RELEASE_DIR

# Copy APK
echo "📱 Copying APK..."
cp android/app/build/outputs/apk/debug/app-debug.apk $RELEASE_DIR/mazu-v1.0.0.apk

# Copy deployment script
echo "📜 Copying deployment script..."
cp scripts/deploy-model.sh $RELEASE_DIR/

# Copy documentation
echo "📚 Copying documentation..."
cp DEPLOYMENT_GUIDE.md $RELEASE_DIR/
cp RELEASE_NOTES.md $RELEASE_DIR/
cp README.md $RELEASE_DIR/

# Create simple install script
echo "🔧 Creating quick install script..."
cat > $RELEASE_DIR/quick-install.sh << 'EOF'
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
EOF

chmod +x $RELEASE_DIR/quick-install.sh

# Create submission checklist
echo "📋 Creating submission checklist..."
cat > $RELEASE_DIR/SUBMISSION_CHECKLIST.md << 'EOF'
# Mazu Hackathon Submission Checklist

## Video Demo
- [ ] 3-minute demo video uploaded
- [ ] Shows offline functionality (airplane mode)
- [ ] Demonstrates emergency scenarios
- [ ] Shows response time metrics

## Code Repository
- [ ] GitHub repo is public
- [ ] README includes setup instructions
- [ ] Model deployment script included
- [ ] Clean commit history

## Release Package
- [ ] APK file (mazu-v1.0.0.apk)
- [ ] Deployment guide
- [ ] Model file hosted (Google Drive/Hugging Face)
- [ ] Quick install script

## Technical Documentation
- [ ] Architecture explained
- [ ] Gemma 3n integration detailed
- [ ] Performance metrics included
- [ ] Edge computing benefits highlighted

## Testing
- [ ] Tested on real Android device
- [ ] Verified offline functionality
- [ ] Response time < 2 seconds
- [ ] Multiple emergency scenarios work

## Submission Links
- Video: [Add YouTube/Vimeo link]
- GitHub: https://github.com/yourusername/mazu
- APK: [Add direct download link]
- Model: [Add Google Drive link]
EOF

# Create README for the release
cat > $RELEASE_DIR/README.txt << 'EOF'
Mazu - Offline AI Disaster Response Assistant
============================================

This package contains:
- mazu-v1.0.0.apk: The Android application (210MB)
- quick-install.sh: One-click installer script
- deploy-model.sh: Model deployment script
- Documentation files

Quick Start:
1. Download the Gemma model: gemma-3n-Q4_K_M.gguf (2.3GB)
2. Place it in this directory
3. Run: ./quick-install.sh

For detailed instructions, see DEPLOYMENT_GUIDE.md

Built for Google Gemma Developer Contest 2024
EOF

echo ""
echo "✅ Release package prepared in: $RELEASE_DIR/"
echo ""
echo "📦 Package contents:"
ls -la $RELEASE_DIR/
echo ""
echo "Next steps:"
echo "1. Add the model file (gemma-3n-Q4_K_M.gguf) to the package"
echo "2. Create a ZIP file: zip -r mazu-release-v1.0.0.zip $RELEASE_DIR"
echo "3. Upload to GitHub releases or Google Drive"
echo "4. Share the link with hackathon judges"