# 🚀 Voice Assistant 运行指南

本指南详细说明如何在 iOS 和 Android 模拟器上运行 Voice Assistant 应用，包括 Gemma 3n 模型的部署。

## 📋 目录

- [前置准备](#前置准备)
- [iOS 模拟器运行流程](#ios-模拟器运行流程)
- [Android 模拟器运行流程](#android-模拟器运行流程)
- [常见问题解决](#常见问题解决)
- [功能测试指南](#功能测试指南)

## 前置准备

### 1. 环境要求

- **macOS**（iOS 开发必需）
- **Node.js** 18+ 和 npm/yarn
- **Xcode** 14+（iOS）
- **Android Studio**（Android）
- **Expo CLI**：`npm install -g expo-cli`

### 2. 克隆项目并安装依赖

```bash
# 克隆项目
git clone [项目地址]
cd gemma-3n

# 安装依赖
npm install

# iOS 特定依赖
cd ios
pod install
cd ..
```

### 3. 准备模型文件

```bash
# 创建模型目录
mkdir -p ./assets/models

# 下载模型文件（选择其一）：
# - Gemma 3n Q4_K_M 量化版（约 3GB）
# - TinyLlama GGUF（测试用，约 600MB）

# 将模型文件放入 assets/models 目录
# 重命名为：gemma-3n-Q4_K_M.gguf
```

⚠️ **重要**：由于 Node.js 的 2GB 文件限制，模型文件必须通过原生工具部署，不能通过 Metro bundler。

## iOS 模拟器运行流程

### 方法 1：使用 Xcode（推荐首次运行）

#### 步骤 1：打开项目
```bash
# 在项目根目录
open ios/VoiceAssistant.xcworkspace
```
⚠️ 注意：是 `.xcworkspace` 而不是 `.xcodeproj`

#### 步骤 2：配置和运行
1. 在 Xcode 顶部选择模拟器（推荐 iPhone 14 或 15）
2. 点击运行按钮（▶️）或按 `Cmd + R`
3. 等待构建完成（首次约 3-5 分钟）

#### 步骤 3：部署模型
```bash
# 应用安装后，在新终端窗口运行
./scripts/deploy-model.sh

# 选择选项 1（iOS 模拟器）
# 脚本会自动找到运行中的模拟器并部署模型
```

#### 步骤 4：启动 Metro
```bash
# 在项目根目录
npx expo start --dev-client
```

#### 步骤 5：连接应用
1. 在模拟器中打开 Voice Assistant 应用
2. 点击 `http://localhost:8081`
3. 等待 JavaScript bundle 加载

### 方法 2：使用 Expo CLI

#### 步骤 1：构建和运行
```bash
# 清理并构建
npx expo run:ios --device

# 或直接运行（如果之前已构建）
npx expo run:ios
```

#### 步骤 2：部署模型
同方法 1 的步骤 3

#### 步骤 3：后续运行
```bash
# 之后可以直接使用
npx expo start --dev-client
```

## Android 模拟器运行流程

### 前置设置

#### 1. 启动 Android 模拟器
- 打开 Android Studio
- Tools → AVD Manager
- 创建或启动一个模拟器（推荐 Pixel 5 API 33）

#### 2. 确认 ADB 连接
```bash
# 检查设备连接
adb devices
# 应该显示：emulator-5554 device
```

### 运行步骤

#### 步骤 1：构建和安装
```bash
# 首次运行
npx expo run:android

# 或使用 Android Studio
# 打开 android 目录作为项目
# 点击运行按钮
```

#### 步骤 2：部署模型
```bash
# 运行部署脚本
./scripts/deploy-model.sh

# 选择选项 2（Android 模拟器）
# 等待上传完成（3GB 约需 2-5 分钟）
```

#### 步骤 3：启动应用
```bash
# 启动 Metro
npx expo start --dev-client
```

#### 步骤 4：连接应用
1. 在模拟器中打开 Voice Assistant
2. 点击 `http://10.0.2.2:8081`（Android 模拟器专用地址）
3. 或使用本机 IP：`http://[你的IP]:8081`

## 常见问题解决

### iOS 问题

#### 1. Pod 安装失败
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

#### 2. 签名错误
- Xcode → VoiceAssistant → Signing & Capabilities
- Team 选择 "Personal Team"

#### 3. 架构错误
- Build Settings → Architectures → 确保包含 arm64

### Android 问题

#### 1. Metro 连接失败
```bash
# 反向代理端口
adb reverse tcp:8081 tcp:8081
```

#### 2. 构建失败
```bash
cd android
./gradlew clean
cd ..
npx expo run:android --clear
```

### 模型部署问题

#### 1. 模型未找到
检查部署路径：
```bash
# iOS
xcrun simctl get_app_container booted com.voiceassistant.app data

# Android
adb shell ls /sdcard/Android/data/com.voiceassistant.app/files/Documents/
```

#### 2. 手动部署模型
```bash
# iOS
cp ./assets/models/*.gguf "[APP_CONTAINER]/Documents/"

# Android
adb push ./assets/models/*.gguf /sdcard/Android/data/com.voiceassistant.app/files/Documents/
```

## 功能测试指南

### 1. 基础功能测试

#### RAG 系统测试（知识库）
```
输入：Earthquake!
预期：紧急 DROP, COVER, HOLD ON 指令

输入：I'm trapped
预期：保持冷静、敲击管道等建议

输入：How to find water?
预期：水源查找方法
```

#### Gemma 模型测试（通用对话）
```
输入：What's the weather?
预期：模型生成的回复（非知识库）

输入：Tell me a story
预期：创造性内容生成
```

### 2. 语音功能测试
- 长按麦克风按钮
- 说出测试短语
- 松开查看识别结果

### 3. 性能验证
- [ ] 模型加载时间 < 5 秒
- [ ] 响应时间 < 2 秒
- [ ] 内存使用稳定
- [ ] 连续对话无崩溃

## 🎯 快速检查清单

### iOS 运行检查
- [ ] Xcode 已安装
- [ ] iOS 模拟器已启动
- [ ] 应用成功构建安装
- [ ] 模型文件已部署
- [ ] Metro 服务器运行中
- [ ] 应用可正常对话

### Android 运行检查
- [ ] Android Studio 已安装
- [ ] Android 模拟器已启动
- [ ] ADB 连接正常
- [ ] 应用成功构建安装
- [ ] 模型文件已部署
- [ ] Metro 服务器运行中
- [ ] 应用可正常对话

## 📝 提示与技巧

1. **开发效率**
   - 使用 Xcode/Android Studio 首次构建
   - 后续使用 `npx expo start --dev-client`
   - 保持模拟器开启，避免重复部署模型

2. **调试技巧**
   - iOS: Xcode 控制台查看日志
   - Android: `adb logcat | grep -i llama`
   - Metro: 查看终端输出

3. **模型管理**
   - 使用部署脚本的清理功能管理空间
   - 测试可先用小模型（TinyLlama）
   - 生产环境再换大模型（Gemma 3n）

---

如遇到未列出的问题，请查看：
- [模型部署文档](./MODEL_DEPLOYMENT.md)
- [项目 README](./README.md)
- 提交 Issue 到项目仓库