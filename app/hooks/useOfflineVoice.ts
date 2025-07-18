import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';

export interface VoiceRecognitionResult {
  text: string;
  error?: string;
}

// Web Speech API interface declaration
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export const useOfflineVoice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [webRecognition, setWebRecognition] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setupWebSpeechRecognition();
    } else {
      setupNativeVoiceRecognition();
    }

    return () => {
      if (Platform.OS === 'web') {
        if (webRecognition) {
          webRecognition.stop();
        }
      } else {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, []);

  const setupWebSpeechRecognition = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.log('Web Speech API not supported');
        setIsAvailable(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setResults([]);
      };

      recognition.onresult = (event: any) => {
        console.log('Speech recognition result:', event);
        const newResults = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            newResults.push(result[0].transcript);
          } else {
            // Also capture interim results
            newResults.push(result[0].transcript);
          }
        }
        console.log('New results:', newResults);
        if (newResults.length > 0) {
          setResults(newResults);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Web Speech Recognition error:', event.error);
        setIsRecording(false);
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected, please try again';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone access failed, please check permissions';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied, please allow in browser settings';
            break;
          case 'network':
            errorMessage = 'Network error, please check your connection';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        window.alert(errorMessage);
      };

      setWebRecognition(recognition);
      setIsAvailable(true);
      console.log('Web Speech Recognition setup complete');
    } catch (error) {
      console.error('Failed to setup web speech recognition:', error);
      setIsAvailable(false);
    }
  };

  const setupNativeVoiceRecognition = async () => {
    try {
      // Check if voice recognition is available
      const available = await Voice.isAvailable();
      setIsAvailable(Boolean(available));

      // Set up voice recognition event listeners
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
    } catch (error) {
      console.error('Voice availability check failed:', error);
      setIsAvailable(false);
    }
  };

  const onSpeechStart = () => {
    console.log('Native speech recognition started');
    setIsRecording(true);
    setResults([]);
  };

  const onSpeechEnd = () => {
    console.log('Native speech recognition ended');
    setIsRecording(false);
  };

  const onSpeechError = (error: any) => {
    console.error('Native speech recognition error:', error);
    setIsRecording(false);
    
    let errorMessage = 'Speech recognition error';
    if (error.error) {
      switch (error.error.code) {
        case '7':
          errorMessage = 'No speech detected, please try again';
          break;
        case '6':
          errorMessage = 'Speech recognition service unavailable';
          break;
        case '5':
          errorMessage = 'Network error, please check your connection';
          break;
        default:
          errorMessage = `Speech recognition error: ${error.error.message || 'Unknown error'}`;
      }
    }
    
    Alert.alert('Speech Recognition Error', errorMessage);
  };

  const onSpeechResults = (event: any) => {
    console.log('Native speech results:', event);
    if (event.value && event.value.length > 0) {
      setResults(event.value);
    }
  };

  const onSpeechPartialResults = (event: any) => {
    console.log('Native speech partial results:', event);
    if (event.value && event.value.length > 0) {
      setResults(event.value);
    }
  };

  const startRecording = async (): Promise<boolean> => {
    try {
      if (!isAvailable) {
        const errorMessage = 'Speech recognition not available';
        if (Platform.OS === 'web') {
          window.alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
        return false;
      }

      console.log('Starting recording...');
      setResults([]);
      
      if (Platform.OS === 'web') {
        if (webRecognition) {
          webRecognition.start();
          return true;
        }
        return false;
      } else {
        await Voice.start('zh-CN');
        return true;
      }
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      
      const errorMessage = 'Failed to start voice recognition';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
      return false;
    }
  };

  const stopRecording = async (): Promise<VoiceRecognitionResult> => {
    try {
      console.log('Stopping recording...');
      console.log('Current results:', results);
      
      if (Platform.OS === 'web') {
        if (webRecognition) {
          webRecognition.stop();
        }
      } else {
        await Voice.stop();
      }
      
      // Wait a moment to ensure results are processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Final results after wait:', results);
      
      const text = results.length > 0 ? results[results.length - 1] : '';
      
      if (!text.trim()) {
        return {
          text: '',
          error: 'No speech detected'
        };
      }
      
      return {
        text: text.trim()
      };
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
      return {
        text: '',
        error: 'Failed to stop voice recognition'
      };
    }
  };

  const cancelRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (webRecognition) {
          webRecognition.stop();
        }
      } else {
        await Voice.cancel();
      }
      setIsRecording(false);
      setResults([]);
    } catch (error) {
      console.error('Failed to cancel voice recognition:', error);
    }
  };

  return {
    isRecording,
    isAvailable,
    results,
    startRecording,
    stopRecording,
    cancelRecording
  };
}; 