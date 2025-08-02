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
// import { KnowledgeLoader } from '../data/knowledgeLoader'; // Replaced by GemmaClient
import { GemmaOpenAIWrapper } from '../services/gemma/GemmaClient';
import { Message, Role } from "../types/chat";
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
  const [breathingAnim] = useState(new Animated.Value(0.8));
  const [textInput, setTextInput] = useState("");
  const [emergencyStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const { updateContext, formatContextForPrompt, context } = useUserContext();
  const scrollViewRef = useRef<ScrollView>(null);
  const gemmaClientRef = useRef<GemmaOpenAIWrapper | null>(null);
  if (!gemmaClientRef.current) {
    gemmaClientRef.current = new GemmaOpenAIWrapper();
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

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - emergencyStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [emergencyStartTime]);

  // Breathing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

    // Track response time
    const requestStartTime = Date.now();

    // Call the GemmaClient with user context
    gemmaClient.chat.completions
      .create({
        model: "gemma-3n",
        messages: messages,
        userContext: userContext,
      })
      .then((completion: any) => {
        // Calculate response time
        const responseTimeMs = Date.now() - requestStartTime;
        setResponseTime(responseTimeMs / 1000); // Convert to seconds
        const aiResponseText =
          completion.choices[0]?.message?.content ||
          "Sorry, I couldn't generate a response.";

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
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "An error occurred while processing your request.",
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
        {!message.isUser && responseTime && (
          <Text style={styles.metadataText}>
            Gemma 3n • {responseTime.toFixed(1)}s • Offline mode • Based on Red Cross protocols
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Emergency Survival Dashboard */}
      <Animated.View style={[styles.survivalDashboard, { opacity: breathingAnim }]}>
        <View style={styles.dashboardContent}>
          <Text style={styles.emergencyTimer}>🔴 Post-earthquake {elapsedTime}</Text>
          <Text style={styles.dashboardDivider}>|</Text>
          {context.location?.floor !== undefined && (
            <>
              <Text style={styles.dashboardText}>📍 Floor {context.location.floor}</Text>
              <Text style={styles.dashboardDivider}>|</Text>
            </>
          )}
          {context.status?.isInjured && (
            <>
              <Text style={styles.dashboardText}>🩹 Injured</Text>
              <Text style={styles.dashboardDivider}>|</Text>
            </>
          )}
          {context.status?.isTrapped && (
            <>
              <Text style={styles.dashboardText}>⚠️ Trapped</Text>
              <Text style={styles.dashboardDivider}>|</Text>
            </>
          )}
          {context.companions?.count && context.companions.count > 0 && (
            <>
              <Text style={styles.dashboardText}>👥 {context.companions.count}</Text>
              <Text style={styles.dashboardDivider}>|</Text>
            </>
          )}
          <Text style={styles.batteryText}>🔋 {batteryLevel}%</Text>
        </View>
      </Animated.View>

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
  survivalDashboard: {
    backgroundColor: '#DD0000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#AA0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dashboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  emergencyTimer: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dashboardText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dashboardDivider: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.5,
    marginHorizontal: 8,
  },
  batteryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
  metadataText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
    fontStyle: 'italic',
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
