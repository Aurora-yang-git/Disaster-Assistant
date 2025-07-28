# 在线Gemma API集成设置指南

## 概述

本项目已成功集成了Hugging Face的Gemma API，实现了在线/离线混合AI系统。系统会优先尝试使用在线API，如果失败则自动回退到本地模型。

## 快速开始

### 1. 获取Hugging Face API Token

1. 访问 [Hugging Face](https://huggingface.co/settings/tokens)
2. 登录或注册账户
3. 创建新的API Token
4. 复制Token（以`hf_`开头）

### 2. 配置环境变量

在项目根目录创建`.env`文件：

```bash
# Hugging Face API Token
EXPO_PUBLIC_HF_TOKEN=hf_your_token_here

# API配置
EXPO_PUBLIC_API_BASE_URL=https://router.huggingface.co/v1
EXPO_PUBLIC_MODEL_NAME=google/gemma-3n-E2B-it
```