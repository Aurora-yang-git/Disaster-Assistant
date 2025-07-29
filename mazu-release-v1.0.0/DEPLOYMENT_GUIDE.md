# Mazu Deployment Guide

## For Hackathon Judges

### Quick Setup (5 minutes)

1. **Install the APK**
   - Download `mazu-debug.apk` from the release
   - Enable "Unknown Sources" in Android Settings > Security
   - Install the APK

2. **Get the Model File**
   - Option A: Download from our Google Drive (link in submission)
   - Option B: Use the included model in `/assets/models/gemma-3n-Q4_K_M.gguf`

3. **Deploy the Model**
   ```bash
   # Connect your Android device/emulator
   adb devices  # Verify device is connected
   
   # Push the model file
   adb push gemma-3n-Q4_K_M.gguf /sdcard/Android/data/com.mazu.app/files/Documents/
   ```

4. **Test Offline Functionality**
   - Enable Airplane Mode
   - Open Mazu
   - Try: "I'm trapped on the 5th floor and smell gas"

### Alternative: Using Our Script

```bash
git clone [repository]
cd mazu
./scripts/deploy-model.sh
# Select option 2 for Android
```

## Troubleshooting

**"Model not found" error**
- Ensure the model file is exactly named: `gemma-3n-Q4_K_M.gguf`
- Check the file is in: `/sdcard/Android/data/com.mazu.app/files/Documents/`
- File size should be ~2.3GB

**App crashes on startup**
- Device needs 4GB+ RAM
- Close other apps to free memory
- First load takes 10-20 seconds

**No response from AI**
- Check airplane mode is on (to verify offline)
- Wait for model to fully load (loading indicator)
- Try restarting the app

## Demo Scenarios

Test these to see Mazu's capabilities:

1. **Immediate Danger**
   - "The building is shaking"
   - "I'm bleeding badly"
   - "I smell gas"

2. **Trapped Scenarios**
   - "I'm trapped under debris"
   - "The exit is blocked"
   - "I can't move my leg"

3. **Resource Management**
   - "I need water"
   - "How do I signal for help"
   - "My phone battery is low"

## Performance Benchmarks

- Model Load Time: 10-20 seconds (first launch)
- Response Time: 1.2-1.8 seconds
- RAM Usage: ~3GB during inference
- Storage: 2.5GB total (app + model)

## Contact

For any issues during judging, please reach out via the hackathon platform.