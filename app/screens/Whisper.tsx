import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from 'react-native-markdown-display';
import { useOfflineVoice } from "../hooks/useOfflineVoice";
import { OnlineGemmaClient } from '../services/gemma/OnlineGemmaClient';
// import { KnowledgeLoader } from '../data/knowledgeLoader'; // Replaced by GemmaClient
import { GemmaClient } from '../services/gemma/GemmaClient.native';
import { Message, Role } from "../hooks/useApi"; // GemmaClient uses this type
import { COLORS } from "../colors";
import { useUserContext } from "../hooks/useUserContext";

const { width } = Dimensions.get("window");

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
  const [textInput, setTextInput] = useState("");
  const { updateContext, formatContextForPrompt, context } = useUserContext();
  const scrollViewRef = useRef<ScrollView>(null);
  const gemmaClientRef = useRef<OnlineGemmaClient | null>(null);
  if (!gemmaClientRef.current) {
    gemmaClientRef.current = new OnlineGemmaClient();
  }
  const gemmaClient = gemmaClientRef.current;

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
    // Haptic feedback for button press
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
    const success = await startRecording();
    if (!success) {
      Alert.alert("Permission Denied", "Microphone permission is required to use voice features");
    }
  };

  const processMessage = (text: string) => {
    if (!text || text.trim().length === 0) return;

    // Update user context based on the message
    updateContext(text);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    // Convert chat history to the format GemmaClient expects
    const history: Message[] = chatMessages.map((msg) => ({
      role: msg.isUser ? Role.User : Role.Assistant,
      content: msg.text,
    }));

    // Add the new user message to the history for the API call
    const messages: Message[] = [
      ...history,
      { role: Role.User, content: text },
    ];

    // Get formatted context for the prompt
    const userContext = formatContextForPrompt();

    // Call the GemmaClient (which uses online API)
    gemmaClient
      .createChatCompletion({
        model: "google/gemma-3n-E2B-it",
        messages: messages,
      })
      .then((completion: any) => {
        console.log('API Response:', completion);
        console.log('Choices:', completion.choices);
        console.log('First choice:', completion.choices?.[0]);
        console.log('Message content:', completion.choices?.[0]?.message?.content);
        
        const aiResponseText =
          completion.choices[0]?.message?.content ||
          "Sorry, I couldn't generate a response.";

        console.log('Final AI response text:', aiResponseText);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isUser: false,
          timestamp: new Date(),
        };

        // Use a short timeout to allow the UI to update before the AI message appears
        setTimeout(() => {
          setChatMessages((prev) => [...prev, aiMessage]);
          setIsProcessing(false);
          // Auto-scroll to bottom
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 500);
      })
      .catch((error: any) => {
        console.error("Error getting completion from GemmaClient:", error);
        
        // 根据错误类型提供更友好的错误信息
        let errorText = "处理请求时发生错误。";
        
        if (error.message) {
          if (error.message.includes('API密钥未配置')) {
            errorText = "API密钥未配置。请检查环境变量设置。";
          } else if (error.message.includes('模型不可用')) {
            errorText = "模型暂时不可用，请稍后重试。";
          } else if (error.message.includes('401')) {
            errorText = "API密钥无效，请检查配置。";
          } else if (error.message.includes('429')) {
            errorText = "请求频率过高，请稍后重试。";
          } else if (error.message.includes('503')) {
            errorText = "服务暂时不可用，模型正在加载中。";
          } else if (error.message.includes('网络')) {
            errorText = "网络连接失败，请检查网络设置。";
          }
        }
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          isUser: false,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, errorMessage]);
        setIsProcessing(false);
      });
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(10);
      }
      processMessage(textInput);
      setTextInput("");
    }
  };

  const handleQuickAction = (action: string) => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
    processMessage(action);
  };

  const handleStopRecording = async () => {
    const result = await stopRecording();
    if (result.text && result.text.trim()) {
      processMessage(result.text);
    }
  };

  const renderChatMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser
          ? styles.userMessageContainer
          : styles.aiMessageContainer,
      ]}>
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userMessageBubble : styles.aiMessageBubble,
        ]}>
        {message.isUser ? (
          <Text style={styles.messageText}>{message.text}</Text>
        ) : (
          <Markdown 
            style={markdownStyles}
          >
            {message.text}
          </Markdown>
        )}
        <Text style={styles.timestampText}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Context awareness bar */}
      {(context.location || context.status) && (
        <View style={styles.contextBar}>
          <Text style={styles.contextText}>
            {context.location?.floor !== undefined && (
              <Text>📍 Floor {context.location.floor} </Text>
            )}
            {context.status?.isInjured && <Text>• 🚑 Injured </Text>}
            {context.status?.isTrapped && <Text>• ⚠️ Trapped </Text>}
            {context.companions?.count && context.companions.count > 0 && (
              <Text>• 👥 {context.companions.count} people </Text>
            )}
          </Text>
        </View>
      )}

      {/* Chat area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}>
        {chatMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color={COLORS.bubbleAI + "99"}
            />
            <Text style={styles.emptyStateText}>Start Conversation</Text>
            <Text style={styles.emptyStateSubtext}>
              Long press the record button to start voice input
            </Text>
          </View>
        ) : (
          chatMessages.map(renderChatMessage)
        )}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <View style={styles.processingBubble}>
              <ActivityIndicator size="small" color={COLORS.warning} style={styles.loadingIndicator} />
              <Text style={styles.processingText}>Analyzing your situation...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => handleQuickAction("I need immediate help!")}>
            <Text style={styles.quickButtonText}>🚨 Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => handleQuickAction("I'm injured and need medical help")}>
            <Text style={styles.quickButtonText}>🏥 Medical Help</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => handleQuickAction("I'm trapped and can't move")}>
            <Text style={styles.quickButtonText}>🆘 Trapped</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={() => handleQuickAction("I'm safe but need guidance")}>
            <Text style={styles.quickButtonText}>✅ Safe</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Input Panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
        keyboardVerticalOffset={90}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor={COLORS.textSub}
          value={textInput}
          onChangeText={setTextInput}
          onSubmitEditing={handleSendText}
          returnKeyType="send"
          accessibilityLabel="Message input field"
        />
        <TouchableOpacity
          style={[styles.sendButton, !textInput.trim() && styles.sendButtonDisabled]}
          onPress={handleSendText}
          disabled={!textInput.trim()}
          accessibilityLabel="Send message button">
          <Ionicons name="send" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* 录音按钮和提示 */}
      <View style={styles.controlPanel}>
        <View style={styles.voiceButtonContainer}>
          <Animated.View
            style={[
              styles.recordButtonWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
              ]}
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
              disabled={isProcessing}
              accessibilityLabel="Hold to record voice message">
              <View style={styles.recordButtonContent}>
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={28}
                  color={COLORS.text}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
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
  contextBar: {
    backgroundColor: COLORS.contextBar,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contextText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 18,
    color: COLORS.textSub,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  aiMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: width * 0.8,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessageBubble: {
    backgroundColor: COLORS.bubbleUser,
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: COLORS.bubbleAI,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.text,
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 4,
    textAlign: "right",
  },
  processingContainer: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  processingBubble: {
    backgroundColor: COLORS.bubbleAI,
    padding: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingIndicator: {
    marginRight: 12,
  },
  processingText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickActions: {
    paddingHorizontal: 16,
  },
  quickButton: {
    backgroundColor: COLORS.quickAction,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  controlPanel: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  voiceButtonContainer: {
    alignItems: "center",
  },
  recordButtonWrapper: {
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: COLORS.button,
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
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    color: COLORS.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.button,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

// Markdown styles
const markdownStyles = {
  body: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: COLORS.text,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ordered_list_icon: {
    color: COLORS.text,
    marginRight: 8,
  },
  bullet_list_icon: {
    color: COLORS.text,
    marginRight: 8,
  },
  code_inline: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
  },
  code_block: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    paddingLeft: 12,
    marginVertical: 8,
    fontStyle: 'italic',
  },
};
