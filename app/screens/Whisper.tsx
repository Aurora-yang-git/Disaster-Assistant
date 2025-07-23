import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineVoice } from '../hooks/useOfflineVoice';
// import { KnowledgeLoader } from '../data/knowledgeLoader'; // Replaced by GemmaClient
import { GemmaOpenAIWrapper } from '../services/gemma/GemmaClient';
import { Message, Role } from '../hooks/useApi'; // GemmaClient uses this type
import { COLORS } from '../colors';

const { width } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Whisper() {


  const {
    isRecording,
    voiceResults,
    partialResults,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useOfflineVoice();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [textInput, setTextInput] = useState('');
  const [gemmaClient] = useState(() => new GemmaOpenAIWrapper({}));

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (!success) {
      Alert.alert('权限被拒绝', '需要麦克风权限才能使用语音功能');
    }
  };

  const processMessage = (text: string) => {
    if (!text || text.trim().length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Convert chat history to the format GemmaClient expects
    const history: Message[] = chatMessages.map(msg => ({
      role: msg.isUser ? Role.User : Role.Assistant,
      content: msg.text,
    }));

    // Add the new user message to the history for the API call
    const messages: Message[] = [
      ...history,
      { role: Role.User, content: text },
    ];

    // Call the GemmaClient (which currently simulates the decision engine)
    gemmaClient.chat.completions.create({
      model: 'gemma-3n',
      messages: messages,
    }).then(completion => {
      const aiResponseText = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };

      // Use a short timeout to allow the UI to update before the AI message appears
      setTimeout(() => {
        setChatMessages(prev => [...prev, aiMessage]);
        setIsProcessing(false);
      }, 500);

    }).catch(error => {
      console.error("Error getting completion from GemmaClient:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'An error occurred while processing your request.',
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setIsProcessing(false);
    });
  };



  const handleSendText = () => {
    processMessage(textInput);
    setTextInput('');
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    if (result.text && result.text.trim()) {
      processMessage(result.text);
    }
  };

  const renderChatMessage = (message: ChatMessage) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userMessageBubble : styles.aiMessageBubble
      ]}>
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={styles.timestampText}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 聊天区 */}
      <ScrollView style={styles.chatArea} showsVerticalScrollIndicator={false}>
        {chatMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.bubbleAI + '99'} />
            <Text style={styles.emptyStateText}>开始对话</Text>
            <Text style={styles.emptyStateSubtext}>长按录音按钮开始语音输入</Text>
          </View>
        ) : (
          chatMessages.map(renderChatMessage)
        )}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <View style={styles.processingBubble}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.processingText}>AI正在思考中...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Panel */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.inputContainer}
        keyboardVerticalOffset={90}
      >
        <TextInput
          style={styles.textInput}
          placeholder="或在此输入文字测试..."
          placeholderTextColor={COLORS.textSub}
          value={textInput}
          onChangeText={setTextInput}
          onSubmitEditing={handleSendText} // Allow sending with keyboard 'return' key
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendText} disabled={!textInput.trim()}>
          <Ionicons name="send" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* 录音按钮和提示 */}
      <View style={styles.controlPanel}>
        <View style={styles.voiceButtonContainer}>
          <Animated.View style={[
            styles.recordButtonWrapper,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton
              ]}
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
              disabled={isProcessing}
            >
              <View style={styles.recordButtonContent}>
                <Ionicons 
                  name={isRecording ? "stop" : "mic"} 
                  size={32} 
                  color={COLORS.text} 
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.instructionText}>
            {isRecording ? '松开停止录音' : '长按开始录音'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: COLORS.textSub,
    marginTop: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 16,
    borderRadius: 20,
  },
  userMessageBubble: {
    backgroundColor: COLORS.bubbleUser,
    borderBottomRightRadius: 8,
  },
  aiMessageBubble: {
    backgroundColor: COLORS.bubbleAI,
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text,
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 4,
    textAlign: 'right',
  },
  processingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  processingBubble: {
    backgroundColor: COLORS.bubbleAI,
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    marginRight: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textSub,
    marginHorizontal: 2,
  },
  processingText: {
    color: COLORS.textSub,
    fontSize: 14,
  },
  controlPanel: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  voiceButtonContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButtonWrapper: {
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: COLORS.bubbleUser,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: COLORS.button,
  },
  recordingButton: {
    shadowColor: COLORS.buttonActive,
    backgroundColor: COLORS.buttonActive,
  },
  recordButtonContent: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: COLORS.bubbleAI,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.bubbleAI,
    borderRadius: 20,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bubbleUser,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
