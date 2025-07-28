#!/bin/bash
# Gemma 3n 模型部署脚本 - 绕过 Node.js 2GB 限制
# 直接使用原生工具部署大型模型文件

set -e

echo "🤖 Gemma 3n 模型部署工具"
echo "========================"
echo "⚡ 本脚本直接使用原生工具，支持 >2GB 模型文件"
echo ""

# 配置
MODEL_NAME="gemma-3n-Q4_K_M.gguf"  # 更新为你的实际模型文件名
MODEL_DIR="./assets/models"
ANDROID_PACKAGE="com.voiceassistant.app"  # 从 app.json 获取
IOS_BUNDLE_ID="com.voiceassistant.app"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查模型文件
check_model() {
    if [ ! -f "$MODEL_DIR/$MODEL_NAME" ]; then
        echo -e "${RED}❌ 错误: 模型文件不存在${NC}"
        echo "   期望位置: $MODEL_DIR/$MODEL_NAME"
        echo ""
        echo "请执行以下步骤："
        echo "1. 下载 Gemma 3n 量化模型 (Q4_K_M 格式，约 3GB)"
        echo "2. 将模型文件重命名为: $MODEL_NAME"
        echo "3. 将文件放置到: $MODEL_DIR/"
        exit 1
    fi
    
    # 获取文件大小
    if [[ "$OSTYPE" == "darwin"* ]]; then
        FILE_SIZE=$(stat -f%z "$MODEL_DIR/$MODEL_NAME" 2>/dev/null || echo "0")
    else
        FILE_SIZE=$(stat -c%s "$MODEL_DIR/$MODEL_NAME" 2>/dev/null || echo "0")
    fi
    
    # 转换为 GB
    FILE_SIZE_GB=$(echo "scale=2; $FILE_SIZE / 1073741824" | bc 2>/dev/null || echo "未知")
    
    echo -e "${GREEN}✅ 找到模型文件${NC}"
    echo "   文件: $MODEL_NAME"
    echo "   大小: ${FILE_SIZE_GB} GB"
    echo ""
}

# iOS 模拟器部署
deploy_ios() {
    echo "📱 开始部署到 iOS 模拟器..."
    
    # 检查是否在 macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${YELLOW}⚠️  跳过 iOS 部署 (需要 macOS)${NC}"
        return
    fi
    
    # 获取运行中的模拟器
    BOOTED_SIMS=$(xcrun simctl list devices | grep "Booted" | grep -E -o '[0-9A-F-]{36}' || true)
    
    if [ -z "$BOOTED_SIMS" ]; then
        echo -e "${RED}❌ 没有找到运行中的 iOS 模拟器${NC}"
        echo "   请先启动模拟器: npx expo start --ios"
        return 1
    fi
    
    # 部署到所有运行的模拟器
    echo "$BOOTED_SIMS" | while read -r SIM_ID; do
        echo "🔍 处理模拟器: $SIM_ID"
        
        # 获取应用容器路径
        APP_CONTAINER=$(xcrun simctl get_app_container "$SIM_ID" "$IOS_BUNDLE_ID" data 2>/dev/null || echo "")
        
        if [ -z "$APP_CONTAINER" ]; then
            echo -e "${YELLOW}⚠️  应用尚未安装在此模拟器${NC}"
            continue
        fi
        
        # 创建文档目录（如果不存在）
        DOCS_PATH="$APP_CONTAINER/Documents"
        mkdir -p "$DOCS_PATH"
        
        # 复制模型文件（使用 cp 而不是通过 Node.js）
        echo "📤 正在复制模型文件..."
        cp -v "$MODEL_DIR/$MODEL_NAME" "$DOCS_PATH/"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 成功部署到模拟器 $SIM_ID${NC}"
            echo "   路径: $DOCS_PATH/$MODEL_NAME"
        else
            echo -e "${RED}❌ 部署失败${NC}"
        fi
    done
}

# Android 模拟器部署
deploy_android() {
    echo "🤖 开始部署到 Android 模拟器..."
    
    # 检查 ADB
    if ! command -v adb &> /dev/null; then
        echo -e "${RED}❌ ADB 未安装${NC}"
        echo "   请安装 Android SDK 或 Android Studio"
        return 1
    fi
    
    # 检查设备
    DEVICES=$(adb devices | grep -E "device$|emulator" | cut -f1)
    
    if [ -z "$DEVICES" ]; then
        echo -e "${RED}❌ 没有找到 Android 设备/模拟器${NC}"
        echo "   请先启动模拟器: npx expo start --android"
        return 1
    fi
    
    # 部署到所有连接的设备
    echo "$DEVICES" | while read -r DEVICE; do
        echo "🔍 处理设备: $DEVICE"
        
        # 检查应用是否安装
        APP_INSTALLED=$(adb -s "$DEVICE" shell pm list packages | grep "$ANDROID_PACKAGE" || true)
        
        if [ -z "$APP_INSTALLED" ]; then
            echo -e "${YELLOW}⚠️  应用尚未安装，将创建目录结构${NC}"
        fi
        
        # 创建目录
        TARGET_DIR="/sdcard/Android/data/$ANDROID_PACKAGE/files/Documents"
        adb -s "$DEVICE" shell mkdir -p "$TARGET_DIR"
        
        # 推送模型文件
        echo "📤 正在上传模型文件 (约 3GB，请耐心等待)..."
        echo "   使用 adb push 直接传输，不受 Node.js 限制"
        
        # 显示进度
        adb -s "$DEVICE" push "$MODEL_DIR/$MODEL_NAME" "$TARGET_DIR/$MODEL_NAME"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 成功部署到设备 $DEVICE${NC}"
            echo "   路径: $TARGET_DIR/$MODEL_NAME"
            
            # 验证文件
            REMOTE_SIZE=$(adb -s "$DEVICE" shell "ls -l $TARGET_DIR/$MODEL_NAME" | awk '{print $5}')
            echo "   远程文件大小: $REMOTE_SIZE bytes"
        else
            echo -e "${RED}❌ 部署失败${NC}"
        fi
    done
}

# 清理函数
cleanup_model() {
    echo "🧹 清理模型文件..."
    
    read -p "确定要删除所有已部署的模型文件吗？(y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "取消清理"
        return
    fi
    
    # iOS 清理
    if [[ "$OSTYPE" == "darwin"* ]]; then
        BOOTED_SIMS=$(xcrun simctl list devices | grep "Booted" | grep -E -o '[0-9A-F-]{36}' || true)
        echo "$BOOTED_SIMS" | while read -r SIM_ID; do
            APP_CONTAINER=$(xcrun simctl get_app_container "$SIM_ID" "$IOS_BUNDLE_ID" data 2>/dev/null || echo "")
            if [ -n "$APP_CONTAINER" ]; then
                rm -f "$APP_CONTAINER/Documents/$MODEL_NAME"
                echo "已清理 iOS 模拟器 $SIM_ID"
            fi
        done
    fi
    
    # Android 清理
    if command -v adb &> /dev/null; then
        DEVICES=$(adb devices | grep -E "device$|emulator" | cut -f1)
        echo "$DEVICES" | while read -r DEVICE; do
            TARGET_FILE="/sdcard/Android/data/$ANDROID_PACKAGE/files/Documents/$MODEL_NAME"
            adb -s "$DEVICE" shell rm -f "$TARGET_FILE"
            echo "已清理 Android 设备 $DEVICE"
        done
    fi
}

# 主菜单
main_menu() {
    check_model
    
    echo "请选择操作："
    echo "1) 部署到 iOS 模拟器"
    echo "2) 部署到 Android 模拟器"
    echo "3) 部署到所有平台"
    echo "4) 清理已部署的模型"
    echo "5) 退出"
    echo ""
    
    read -p "请输入选项 (1-5): " choice
    
    case $choice in
        1)
            deploy_ios
            ;;
        2)
            deploy_android
            ;;
        3)
            deploy_ios
            echo ""
            deploy_android
            ;;
        4)
            cleanup_model
            ;;
        5)
            echo "👋 再见！"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选项${NC}"
            exit 1
            ;;
    esac
}

# 运行主程序
main_menu

echo ""
echo "✅ 操作完成！"
echo ""
echo "💡 提示："
echo "- 如果应用正在运行，请重启以加载模型"
echo "- 首次加载模型可能需要几秒钟"
echo "- 确保设备有足够的存储空间 (>4GB)"