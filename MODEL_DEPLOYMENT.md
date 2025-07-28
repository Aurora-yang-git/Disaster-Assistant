# Gemma 3n 模型部署指南

本文档详细说明如何在开发环境中部署 Gemma 3n 模型（约 3GB）到模拟器/设备。

## 🚨 重要说明

由于 Node.js 有 2GB 文件大小限制，我们**不能**通过以下方式部署模型：
- ❌ Metro bundler 打包
- ❌ Expo 资源系统
- ❌ npm/yarn 脚本
- ❌ 任何基于 Node.js 的文件操作

必须使用**原生工具**（adb/xcrun）直接部署。

## 📋 前置要求

1. **模型文件**
   - 下载 Gemma 3n 量化模型（Q4_K_M 格式，约 3GB）
   - 推荐使用 Hugging Face 或其他模型仓库
   - 文件名：`gemma-3n-Q4_K_M.gguf`

2. **开发环境**
   - macOS（用于 iOS 开发）
   - Android Studio / Android SDK（用于 Android 开发）
   - Expo 开发环境已配置

## 🚀 快速开始

### 步骤 1：准备模型文件

```bash
# 创建模型目录
mkdir -p ./assets/models

# 将下载的模型文件放入此目录
# 重命名为: gemma-3n-Q4_K_M.gguf
mv ~/Downloads/your-model-file.gguf ./assets/models/gemma-3n-Q4_K_M.gguf
```

### 步骤 2：运行部署脚本

```bash
# 赋予执行权限
chmod +x ./scripts/deploy-model.sh

# 运行部署脚本
./scripts/deploy-model.sh
```

脚本会显示交互式菜单：
- 选项 1：部署到 iOS 模拟器
- 选项 2：部署到 Android 模拟器  
- 选项 3：部署到所有平台
- 选项 4：清理已部署的模型

### 步骤 3：启动应用

```bash
# iOS
npx expo start --ios

# Android
npx expo start --android

# 或使用 Expo Go
npx expo start
```

## 📱 平台特定说明

### iOS 模拟器

1. **确保模拟器正在运行**
   ```bash
   # 查看运行中的模拟器
   xcrun simctl list devices | grep Booted
   ```

2. **模型部署位置**
   ```
   ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/
   ```

3. **常见问题**
   - 如果应用未安装：先运行应用一次，然后重新部署
   - 权限问题：确保有写入模拟器文件系统的权限

### Android 模拟器

1. **确保 ADB 可用**
   ```bash
   # 检查连接的设备
   adb devices
   ```

2. **模型部署位置**
   ```
   /sdcard/Android/data/com.voiceassistant.app/files/Documents/
   ```

3. **常见问题**
   - 传输速度慢：使用 USB 连接真机会更快
   - 存储空间不足：确保模拟器有足够空间（>4GB）

## 🔍 验证部署

### 检查模型是否正确部署

**iOS:**
```bash
# 获取应用容器路径
xcrun simctl get_app_container booted com.voiceassistant.app data

# 列出文档目录
ls -la [容器路径]/Documents/
```

**Android:**
```bash
# 列出模型文件
adb shell ls -la /sdcard/Android/data/com.voiceassistant.app/files/Documents/
```

### 应用内验证

1. 打开应用
2. 进入聊天界面
3. 发送测试消息
4. 查看控制台日志：
   - ✅ "Gemma 3n model loaded successfully!"
   - ❌ "Model not found" - 需要重新部署

## 🛠️ 故障排除

### 模型加载失败

1. **检查文件名**
   - 支持的文件名：
     - `gemma-3n-Q4_K_M.gguf` (推荐)
     - `gemma-3n.gguf`
     - `tinyllama.gguf` (测试用)

2. **检查文件大小**
   ```bash
   # Android
   adb shell du -h /sdcard/Android/data/com.voiceassistant.app/files/Documents/*.gguf
   ```

3. **重启应用**
   - 完全关闭应用
   - 清除应用缓存
   - 重新启动

### 性能问题

1. **内存不足**
   - 确保设备/模拟器有足够 RAM（建议 >8GB）
   - 关闭其他应用

2. **加载缓慢**
   - 首次加载需要时间
   - 考虑使用更小的量化版本

## 📝 开发提示

1. **模型切换**
   - 修改 `GemmaClient.native.ts` 中的 `modelNames` 数组
   - 添加新的模型文件名

2. **调试日志**
   - 查看 Metro 控制台输出
   - 使用 `adb logcat` 查看 Android 日志
   - 使用 Xcode 控制台查看 iOS 日志

3. **CI/CD 考虑**
   - 模型文件不应提交到 Git
   - 使用 Git LFS 或外部存储
   - 在 CI 环境中单独下载

## 🔗 相关资源

- [llama.rn 文档](https://github.com/mybigday/llama.rn)
- [Gemma 模型信息](https://ai.google.dev/gemma)
- [GGUF 格式说明](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)

## ⚠️ 注意事项

1. **不要尝试**：
   - 通过 `require()` 或 `import` 加载模型
   - 使用 fetch/axios 下载大模型
   - 将模型打包进 APK/IPA

2. **生产环境**：
   - 考虑使用应用内下载（分片）
   - 实现模型版本管理
   - 添加模型完整性校验

---

如有问题，请查看项目 README 或提交 Issue。