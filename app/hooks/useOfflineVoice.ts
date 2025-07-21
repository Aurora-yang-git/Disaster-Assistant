import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorCode,
  useSpeechRecognitionEvent 
} from "expo-speech-recognition";

export interface VoiceRecognitionResult {
  text: string;
  error?: string;
}

export const useOfflineVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [voiceResults, setVoiceResults] = useState<string[]>([]);
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // 存储事件监听器的引用，以便后续移除
  const listenersRef = useRef<any[]>([]);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    checkPermissionsAndAvailability();
    setupEventListeners();
    
    // 清理函数
    return () => {
      // 移除所有事件监听器
      listenersRef.current.forEach(listener => listener.remove());
      listenersRef.current = [];
    };
  }, []);

  const checkPermissionsAndAvailability = async () => {
    try {
      addDebugInfo('Checking speech recognition availability...');
      
      // 检查权限状态
      const permissionStatus = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log('Initial permission status:', permissionStatus);
      
      if (permissionStatus.status !== 'granted') {
        // 请求权限
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        console.log('Permission request result:', result);
        
        if (result.status !== 'granted') {
          addDebugInfo('Permission denied');
          Alert.alert('Permission Required', 'Microphone permission is required for speech recognition');
          setIsAvailable(false);
          return;
        }
      }
      
      addDebugInfo('Permission granted');
      setIsAvailable(true);
    } catch (error) {
      addDebugInfo(`Error checking permissions: ${error}`);
      console.error('Permission check error:', error);
      setIsAvailable(false);
    }
  };

  const setupEventListeners = () => {
    // 开始事件
    const startListener = ExpoSpeechRecognitionModule.addListener("start", () => {
      console.log('=== Speech Recognition Started ===');
      addDebugInfo('Speech recognition started');
      setIsRecording(true);
      setVoiceResults([]);
      setPartialResults([]);
    });
    listenersRef.current.push(startListener);

    // 结束事件
    const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
      console.log('=== Speech Recognition Ended ===');
      console.log('Final voice results:', voiceResults);
      console.log('Final partial results:', partialResults);
      addDebugInfo('Speech recognition ended');
      setIsRecording(false);
    });
    listenersRef.current.push(endListener);

    // 结果事件
    const resultListener = ExpoSpeechRecognitionModule.addListener("result", (event) => {
      console.log('=== Speech Recognition Result Event ===');
      console.log('Results:', event.results);
      console.log('Is Final:', event.isFinal);
      
      if (event.results && event.results.length > 0) {
        const transcripts = event.results.map((result: any) => result.transcript);
        console.log('Transcripts:', transcripts);
        
        if (!event.isFinal) {
          // 更新部分结果
          console.log('Setting partial results:', transcripts);
          setPartialResults(transcripts);
        } else {
          // 更新最终结果
          console.log('Setting final results:', transcripts);
          setVoiceResults(transcripts);
          setPartialResults([]);
        }
        
        addDebugInfo(`Got ${event.isFinal ? 'final' : 'partial'} result: ${transcripts.join(', ')}`);
      }
    });
    listenersRef.current.push(resultListener);

    // 错误事件 - 使用类型安全的方式
    const errorListener = ExpoSpeechRecognitionModule.addListener("error", (event) => {
      console.log('=== Speech Recognition Error ===');
      console.log('Error code:', event.error);
      console.log('Error message:', event.message);
      
      addDebugInfo(`Speech recognition error: ${event.error} - ${event.message}`);
      setIsRecording(false);
      
      let errorMessage = 'Speech recognition error';
      const errorCode: ExpoSpeechRecognitionErrorCode = event.error;
      
      // 根据错误代码显示友好的错误信息
      switch (errorCode) {
        case 'aborted':
          errorMessage = '语音识别被中止';
          break;
        case 'audio-capture':
          errorMessage = '音频捕获失败，请检查麦克风权限';
          break;
        case 'bad-grammar':
          errorMessage = '语音语法错误';
          break;
        case 'network':
          errorMessage = '网络错误，请检查网络连接';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请在设置中允许';
          break;
        case 'service-not-allowed':
          errorMessage = '语音识别服务不可用';
          break;
        case 'busy':
          errorMessage = '语音识别服务繁忙，请稍后再试';
          break;
        case 'client':
          errorMessage = '客户端错误';
          break;
        case 'speech-timeout':
          errorMessage = '未检测到语音，请重试';
          break;
        case 'unknown':
        default:
          errorMessage = event.message || '未知的语音识别错误';
          break;
      }
      
      // 特殊处理语言不支持的错误
      if (event.message && event.message.includes('language')) {
        errorMessage = '不支持所选语言，请切换到英文或检查设备语言包';
      }
      
      Alert.alert('语音识别错误', errorMessage);
    });
    listenersRef.current.push(errorListener);

    // 音频开始事件（可选）
    const audioStartListener = ExpoSpeechRecognitionModule.addListener("audiostart", () => {
      console.log('Audio capture started');
      addDebugInfo('Audio capture started');
    });
    listenersRef.current.push(audioStartListener);

    // 音频结束事件（可选）
    const audioEndListener = ExpoSpeechRecognitionModule.addListener("audioend", () => {
      console.log('Audio capture ended');
      addDebugInfo('Audio capture ended');
    });
    listenersRef.current.push(audioEndListener);
  };

  const startRecording = async (): Promise<boolean> => {
    try {
      console.log('=== Starting Recording ===');
      console.log('Is Available:', isAvailable);
      
      if (!isAvailable) {
        Alert.alert('Error', 'Speech recognition not available');
        return false;
      }

      // 再次检查权限
      const permissionStatus = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log('Permission status before recording:', permissionStatus);
      
      if (permissionStatus.status !== 'granted') {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (result.status !== 'granted') {
          Alert.alert('Permission Denied', 'Microphone permission is required');
          return false;
        }
      }

      addDebugInfo('Starting recording...');
      setVoiceResults([]);
      setPartialResults([]);
      
      const recognitionOptions = {
        lang: "en-US", // 先使用英文，之后可以改为 "zh-CN"
        interimResults: true, // 启用实时结果
        maxAlternatives: 1,
        continuous: false, // 不使用连续识别模式
        requiresOnDeviceRecognition: false, // 使用在线识别
        addsPunctuation: true, // 添加标点符号
        contextualStrings: [], // 可以添加上下文提示词
      };
      
      console.log('Recognition options:', recognitionOptions);
      
      // 开始语音识别
      await ExpoSpeechRecognitionModule.start(recognitionOptions);
      
      console.log('Recording started successfully');
      addDebugInfo('Recording started successfully');
      return true;
    } catch (error) {
      addDebugInfo(`Failed to start recording: ${error}`);
      console.error('Failed to start voice recognition:', error);
      Alert.alert('Error', `Failed to start voice recognition: ${error}`);
      return false;
    }
  };

  const stopRecording = async (): Promise<VoiceRecognitionResult> => {
    try {
      addDebugInfo('Stopping recording...');
      console.log('Stopping recording...');
      
      // 停止语音识别
      await ExpoSpeechRecognitionModule.stop();
      
      // 等待一下确保结果被处理
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 优先使用最终结果，如果没有则使用部分结果
      const finalText = voiceResults.length > 0 
        ? voiceResults[voiceResults.length - 1] 
        : (partialResults.length > 0 ? partialResults[partialResults.length - 1] : '');
      
      addDebugInfo(`Final text: ${finalText}`);
      console.log('Final recognized text:', finalText);
      
      if (!finalText || !finalText.trim()) {
        return {
          text: '',
          error: 'No speech detected'
        };
      }
      
      return {
        text: finalText.trim()
      };
    } catch (error) {
      addDebugInfo(`Failed to stop recording: ${error}`);
      console.error('Failed to stop voice recognition:', error);
      return {
        text: '',
        error: 'Failed to stop voice recognition'
      };
    }
  };

  const cancelRecording = async () => {
    try {
      addDebugInfo('Cancelling recording...');
      console.log('Cancelling recording...');
      
      // 立即取消语音识别（不处理最终结果）
      await ExpoSpeechRecognitionModule.abort();
      
      setIsRecording(false);
      setVoiceResults([]);
      setPartialResults([]);
      
      addDebugInfo('Recording cancelled');
    } catch (error) {
      addDebugInfo(`Failed to cancel recording: ${error}`);
      console.error('Failed to cancel voice recognition:', error);
    }
  };

  return {
    isRecording,
    isAvailable,
    startRecording,
    stopRecording,
    cancelRecording,
    voiceResults,
    partialResults,
    debugInfo,
  };
}; 