import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  FlatList,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import React, { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Message, Role, useApi } from '../hooks/useApi';
import { useOfflineVoice } from '../hooks/useOfflineVoice';
import userImage from '../../assets/user.png';
import aiImage from '../../assets/ai.png';

const { width, height } = Dimensions.get('window');

const WhisperPage = () => {

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const { getCompletion, messages } = useApi();
  const { 
    isRecording, 
    isAvailable, 
    startRecording, 
    stopRecording, 
    cancelRecording 
  } = useOfflineVoice();
  
  const flatListRef = useRef<FlatList>(null);

  // Start recording
  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      console.log('Failed to start recording');
    }
  };

  // Stop recording and handle speech recognition result
  const handleStopRecording = async () => {
    setLoading(true);
    const result = await stopRecording();
    
    if (result.error) {
      if (Platform.OS === 'web') {
        window.alert(result.error);
      } else {
        Alert.alert('Speech Recognition Error', result.error);
      }
    } else if (result.text) {
      setInputText(result.text);
    }
    
    setLoading(false);
  };

  // Handle recording button press
  const handleRecordingPress = () => {
    console.log('Recording button pressed, isRecording:', isRecording);
    console.log('isAvailable:', isAvailable);
    
    if (isRecording) {
      console.log('Stopping recording...');
      handleStopRecording();
    } else {
      console.log('Starting recording...');
      handleStartRecording();
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (inputText.trim().length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      const messageContent = inputText.trim();
      setInputText('');
      setLoading(true);
      await getCompletion(messageContent);
      setLoading(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Render single message
  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.role === Role.User;

    return (
      <View style={[
        styles.messageContainer,
        isUserMessage ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}>
        <Image source={isUserMessage ? userImage : aiImage} style={styles.messageImage} />
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    );
  };

  // Get microphone button style
  const getMicButtonStyle = () => {
    if (isRecording) {
      return [styles.micButton, styles.micButtonRecording];
    } else if (!isAvailable) {
      return [styles.micButton, styles.micButtonDisabled];
    } else {
      return [styles.micButton, styles.micButtonActive];
    }
  };

  const getMicIcon = () => {
    if (isRecording) {
      return 'stop-circle';
    } else {
      return 'mic';
    }
  };

  const getStatusText = () => {
    if (!isAvailable) {
      return 'Speech recognition unavailable';
    } else if (isRecording) {
      return 'Recording, please speak...';
    } else if (loading) {
      return 'Processing speech...';
    } else {
      return 'Tap microphone to start voice input';
    }
  };

  const getStatusColor = () => {
    if (!isAvailable) {
      return '#ef4444';
    } else if (isRecording) {
      return '#10b981';
    } else if (loading) {
      return '#f59e0b';
    } else {
      return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat history area */}
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#4a5568" />
              <Text style={styles.emptyText}>Start Voice Chat</Text>
              <Text style={styles.emptySubText}>Communicate with AI using voice</Text>
            </View>
          }
        />
      </View>

      {/* Voice control area */}
      <View style={styles.voiceContainer}>
        {/* Status display */}
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {Platform.OS === 'web' && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>
                Web Speech API: {
                  typeof window !== 'undefined' && 
                  (window.SpeechRecognition || window.webkitSpeechRecognition) 
                    ? 'Supported' : 'Not supported'
                }
              </Text>
              <Text style={styles.debugText}>
                Available: {isAvailable ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.debugText}>
                Recording: {isRecording ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.debugText}>
                Loading: {loading ? 'Yes' : 'No'}
              </Text>
            </View>
          )}
        </View>

        {/* Speech recognition result display */}
        {inputText ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Recognition Result:</Text>
            <Text style={styles.resultText}>{inputText}</Text>
          </View>
        ) : null}

        {/* Test button for debugging */}
        {Platform.OS === 'web' && (
          <View style={styles.testContainer}>
            <Pressable
              style={styles.testButton}
              onPress={() => {
                console.log('Test button pressed');
                setInputText('This is a test message from the test button');
              }}
            >
              <Text style={styles.testButtonText}>Test Recognition</Text>
            </Pressable>
            <Pressable
              style={[styles.testButton, { backgroundColor: '#f59e0b', marginTop: 8 }]}
              onPress={async () => {
                console.log('Checking microphone permissions...');
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  console.log('Microphone access granted');
                  stream.getTracks().forEach(track => track.stop());
                  window.alert('Microphone access granted!');
                } catch (error) {
                  console.error('Microphone access denied:', error);
                  window.alert('Microphone access denied. Please allow microphone access in your browser.');
                }
              }}
            >
              <Text style={styles.testButtonText}>Check Microphone</Text>
            </Pressable>
          </View>
        )}

        {/* Microphone button */}
        <View style={styles.micContainer}>
          <Pressable
            style={getMicButtonStyle()}
            onPress={handleRecordingPress}
            disabled={!isAvailable || loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Ionicons name={getMicIcon()} size={48} color="white" />
            )}
          </Pressable>
          
          {/* Recording indicator */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={[styles.ripple, styles.ripple1]} />
              <View style={[styles.ripple, styles.ripple2]} />
              <View style={[styles.ripple, styles.ripple3]} />
            </View>
          )}
        </View>

        {/* Send button */}
        {inputText ? (
          <View style={styles.actionContainer}>
            <Pressable
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={loading || isRecording}
            >
              <Ionicons name="send" size={24} color="white" />
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
            <Pressable
              style={styles.clearButton}
              onPress={() => setInputText('')}
              disabled={loading || isRecording}
            >
              <Ionicons name="trash-outline" size={20} color="#6b7280" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  chatContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  userMessageContainer: {
    backgroundColor: '#1e293b',
    marginLeft: 20,
    borderRadius: 16,
    marginVertical: 4,
  },
  aiMessageContainer: {
    backgroundColor: '#374151',
    marginRight: 20,
    borderRadius: 16,
    marginVertical: 4,
  },
  messageImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    flex: 1,
    color: '#fff',
    lineHeight: 22,
    userSelect: 'text',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  voiceContainer: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugContainer: {
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  resultLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  testContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    } : {
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
  },
  micButtonActive: {
    backgroundColor: '#3b82f6',
  },
  micButtonRecording: {
    backgroundColor: '#ef4444',
  },
  micButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 100,
    opacity: 0.6,
  },
  ripple1: {
    width: 140,
    height: 140,
  },
  ripple2: {
    width: 160,
    height: 160,
  },
  ripple3: {
    width: 180,
    height: 180,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  sendButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 16,
    borderRadius: 25,
    backgroundColor: '#374151',
  },
});

export default WhisperPage;
