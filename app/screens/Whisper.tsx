import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useOfflineVoice } from '../hooks/useOfflineVoice';
import { useApi } from '../hooks/useApi';
import { Ionicons } from '@expo/vector-icons';

export default function Whisper() {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // 默认显示调试信息
  const { sendMessage } = useApi();
  const {
    isRecording,
    isAvailable,
    startRecording,
    stopRecording,
    cancelRecording,
    voiceResults,
    partialResults,
    debugInfo,
  } = useOfflineVoice();

  // 动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // 处理长按开始
  const handlePressIn = async () => {
    console.log('长按开始');
    setIsLongPressing(true);
    setInputText('');
    setResponse('');
    const success = await startRecording();
    if (success) {
      // 开始录音动画
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rippleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rippleAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  };

  // 处理长按结束
  const handlePressOut = async () => {
    if (!isLongPressing) return;
    
    console.log('长按结束');
    setIsLongPressing(false);
    const result = await stopRecording();
    
    // 重置动画
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    console.log('语音识别结果:', result);

    if (result.text) {
      setInputText(result.text);
      try {
        const aiResponse = await sendMessage(result.text);
        setResponse(aiResponse);
      } catch (error) {
        console.error('发送消息失败:', error);
        setResponse('抱歉，AI服务暂时不可用');
      }
    } else if (result.error) {
      // 错误已经在 useOfflineVoice 中处理，这里只记录日志
      console.log('语音识别结果包含错误:', result.error);
    }
  };

  // 处理取消录音
  const handlePressCancel = async () => {
    console.log('取消录音');
    setIsLongPressing(false);
    await cancelRecording();
    
    // 重置动画
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 监听语音识别结果并实时显示
  useEffect(() => {
    if (isRecording) {
      // 显示实时识别结果
      if (partialResults.length > 0) {
        const latestResult = partialResults[partialResults.length - 1];
        console.log('显示实时结果:', latestResult);
        setInputText(latestResult);
      }
    }
  }, [isRecording, partialResults]);

  // 监听最终结果
  useEffect(() => {
    if (!isRecording && voiceResults.length > 0) {
      const finalResult = voiceResults[voiceResults.length - 1];
      console.log('显示最终结果:', finalResult);
      setInputText(finalResult);
    }
  }, [isRecording, voiceResults]);

  // 波纹动画样式
  const rippleStyle = {
    transform: [
      {
        scale: rippleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2],
        }),
      },
    ],
    opacity: rippleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 0],
    }),
  };

  // 获取当前显示的状态文本
  const getStatusText = () => {
    if (isRecording) {
      return '正在聆听...';
    } else if (inputText) {
      return inputText;
    } else {
      return '长按麦克风说话';
    }
  };

  return (
    <View style={styles.container}>
      {/* 顶部调试信息切换按钮 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => setShowDebug(!showDebug)}
        >
          <Text style={styles.debugToggleText}>
            {showDebug ? '隐藏调试' : '显示调试'}
          </Text>
        </TouchableOpacity>
        <Text style={[
          styles.availabilityText,
          { color: isAvailable ? '#27ae60' : '#e74c3c' }
        ]}>
          语音识别: {isAvailable ? '可用' : '不可用'}
        </Text>
      </View>

      {/* 调试信息面板 */}
      {showDebug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>调试信息:</Text>
          <ScrollView style={styles.debugScrollView} nestedScrollEnabled>
            <Text style={styles.debugText}>
              平台: {Platform.OS} {Platform.Version}
            </Text>
            <Text style={styles.debugText}>
              录音状态: {isRecording ? '录音中' : '未录音'}
            </Text>
            <Text style={styles.debugText}>
              实时结果数量: {partialResults.length}
            </Text>
            <Text style={styles.debugText}>
              最终结果数量: {voiceResults.length}
            </Text>
            <Text style={styles.debugText}>
              当前实时结果: {partialResults.join(', ')}
            </Text>
            <Text style={styles.debugText}>
              当前最终结果: {voiceResults.join(', ')}
            </Text>
            
            <Text style={styles.debugSubTitle}>日志:</Text>
            {debugInfo.map((log, index) => (
              <Text key={index} style={styles.debugLogText}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 显示识别结果和AI回复 */}
      <View style={styles.contentContainer}>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: isRecording ? '#e74c3c' : '#333' }
          ]}>
            {getStatusText()}
          </Text>
        </View>

        {inputText && !isRecording ? (
          <View style={styles.messageContainer}>
            <View style={styles.userMessage}>
              <Text style={styles.messageText}>{inputText}</Text>
            </View>
            {response && (
              <View style={styles.aiMessage}>
                <Text style={styles.messageText}>{response}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* 麦克风按钮和动画 */}
      <View style={styles.bottomContainer}>
        <View style={styles.micButtonContainer}>
          <Animated.View style={[styles.ripple, rippleStyle]} />
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={() => {}}
            delayLongPress={200}
            style={({ pressed }) => [
              styles.micButton,
              {
                backgroundColor: pressed || isRecording ? '#e74c3c' : '#3498db',
              },
            ]}
          >
            <Animated.View
              style={[
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={40}
                color="white"
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* 取消按钮 */}
        {isLongPressing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handlePressCancel}
          >
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  debugToggle: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  debugToggleText: {
    color: 'white',
    fontSize: 12,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  debugPanel: {
    backgroundColor: '#2c3e50',
    padding: 12,
    maxHeight: 200,
  },
  debugTitle: {
    color: '#ecf0f1',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugSubTitle: {
    color: '#bdc3c7',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  debugScrollView: {
    maxHeight: 150,
  },
  debugText: {
    color: '#ecf0f1',
    fontSize: 11,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugLogText: {
    color: '#95a5a6',
    fontSize: 10,
    marginBottom: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  messageContainer: {
    width: '100%',
    marginTop: 16,
  },
  userMessage: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    marginLeft: '20%',
    marginBottom: 8,
  },
  aiMessage: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginRight: '20%',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  },
  bottomContainer: {
    padding: 16,
    alignItems: 'center',
  },
  micButtonContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#3498db',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cancelButton: {
    marginTop: 16,
    padding: 8,
  },
  cancelText: {
    color: '#e74c3c',
    fontSize: 16,
  },
});
