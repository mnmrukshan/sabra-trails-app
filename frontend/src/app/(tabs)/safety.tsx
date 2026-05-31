import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { sendChatMessage } from '@/services/api';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function TrailAIChatScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const flatListRef = useRef<FlatList | null>(null);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 Hello Explorer! I'm your SabraTrails Safety AI.\n\nAsk me anything about trail safety, weather, route hazards, or packing essentials for Sabaragamuwa region hikes.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Track keyboard visibility to adjust input bar spacing dynamically
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsgText = input.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Call Gemini API on backend
    sendChatMessage(userMsgText, messages)
      .then(res => {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          timestamp: res.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      })
      .catch(err => {
        console.error('Failed to get safety advice:', err);
        const errorMessage: Message = {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: "⚠️ I'm sorry, I'm having trouble connecting to my safety database right now. Please ensure you are online and try again. Always prioritize safety first!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsTyping(false);
      });
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Breathing ambient background gradient */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#0F0F15', '#161920', '#090A0E']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Keyboard Avoiding Container wrapping the entire screen (Y=0) to ensure zero-gap layout */}
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Fixed Top Title Bar (styled inside KeyboardAvoidingView to start at the status bar top) */}
        <View style={[styles.topBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
          <View style={styles.topBarContent}>
            <View style={styles.aiBadge}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.accent} />
            </View>
            <View>
              <Text style={styles.assistantTitle}>Trail AI Safety</Text>
              <Text style={styles.assistantStatus}>Online • Safety Assistant</Text>
            </View>
          </View>
        </View>

        {/* Child 1: FlatList style={{ flex: 1 }} */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[styles.flatListContent, { paddingTop: insets.top + 75 }]}
          renderItem={({ item }) => {
            const isUser = item.sender === 'user';
            return (
              <View 
                style={[
                  styles.messageRow, 
                  isUser ? styles.messageRowUser : styles.messageRowAI
                ]}
              >
                {isUser ? (
                  <View style={styles.userShadowWrapper}>
                    <View style={styles.bubbleContainerUser}>
                      <LinearGradient
                        colors={['#FF8C32', '#FF5F00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <View style={styles.bubbleContentUser}>
                        <Text style={styles.messageTextUser}>{item.text}</Text>
                        <Text style={styles.timestampTextUser}>{item.timestamp}</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.bubbleContainerAI}>
                    <BlurView 
                      intensity={40} 
                      tint="dark" 
                      style={StyleSheet.absoluteFillObject} 
                    />
                    <View style={styles.bubbleContentAI}>
                      <Text style={styles.messageTextAI}>{item.text}</Text>
                      <Text style={styles.timestampTextAI}>{item.timestamp}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.messageRow, styles.messageRowAI, { marginTop: 8 }]}>
                <View style={styles.bubbleContainerAI}>
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
                  <View style={styles.bubbleContentAI}>
                    <Text style={[styles.messageTextAI, { fontStyle: 'italic', color: '#A0A0A0' }]}>
                      ✨ Trail AI is thinking...
                    </Text>
                  </View>
                </View>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Child 2: Input Bar Sitting Naturally at the bottom */}
        <View style={styles.inputContainerArea}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.inputInner}>
            <TextInput
              placeholder="Ask about safety, weather, leeches..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              style={styles.textInput}
            />
            <Pressable 
              style={[
                styles.sendButton, 
                { backgroundColor: input.trim() ? '#FF8C32' : 'rgba(255,255,255,0.06)' }
              ]} 
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Ionicons 
                name="send" 
                size={16} 
                color={input.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} 
              />
            </Pressable>
          </View>
        </View>

      </KeyboardAvoidingView>

      {/* Spacer below KeyboardAvoidingView to clear the bottom tab bar capsule when keyboard is closed */}
      {!isKeyboardVisible && (
        <View style={{ height: Platform.OS === 'ios' ? insets.bottom + 85 : 100 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: '#0F0F15',
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 140, 50, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(255, 140, 50, 0.3)',
    borderWidth: 1,
  },
  assistantTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  assistantStatus: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  messagesList: {
    flex: 1,
  },
  flatListContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 6,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  userShadowWrapper: {
    maxWidth: '80%',
    alignSelf: 'flex-end',
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bubbleContainerUser: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  bubbleContainerAI: {
    maxWidth: '80%',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  bubbleContentUser: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleContentAI: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageTextUser: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  messageTextAI: {
    color: '#EAEAEA',
    fontSize: 15,
    lineHeight: 22,
  },
  timestampTextUser: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 6,
    fontWeight: '500',
  },
  timestampTextAI: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 6,
    fontWeight: '500',
  },
  inputContainerArea: {
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 15, 15, 0.5)',
    overflow: 'hidden',
    padding: 15,
    paddingBottom: 15,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
