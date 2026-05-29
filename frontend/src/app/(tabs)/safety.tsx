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

    // Simulate AI response after 1.5 seconds
    setTimeout(() => {
      let aiResponseText = '';
      const query = userMsgText.toLowerCase();

      if (query.includes('weather') || query.includes('rain') || query.includes('forecast')) {
        aiResponseText = "🌦️ **WEATHER UPDATE**\n\nThe Sabaragamuwa region is currently seeing high afternoon humidity (80%+) and is prone to sudden evening showers, especially around mountainous trails like Hawagala and Wangedigala.\n\n**Safety Tip:** Start your hikes early (by 6:00 AM) and aim to descend by 2:00 PM to avoid heavy afternoon mist and slippery trail descents.";
      } else if (query.includes('leech') || query.includes('leeches')) {
        aiResponseText = "🐛 **LEECH PROTECTION PROTOCOL**\n\nHumid jungle trails (like Hirikatuoya or forest reserve paths) are highly active with leeches.\n\n**Action Guide:**\n1. Tuck trousers into long socks.\n2. Apply salt water, soap, or citrus oil onto your shoes.\n3. Avoid stopping in dense, wet undergrowth.";
      } else if (query.includes('bambarakanda') || query.includes('waterfall') || query.includes('falls')) {
        aiResponseText = "⚠️ **BAMBARAKANDA FALLS ADVISORY**\n\nAs the tallest waterfall in Sri Lanka, the route to the crest can be slippery and hazardous.\n\n**Key Alerts:**\n- Stream crossings at the top can rise rapidly without warning during rain.\n- Maintain a safe distance from the edge (high winds can be sudden).\n- Do not attempt to swim in deep plunge pools.";
      } else if (query.includes('gear') || query.includes('pack') || query.includes('checklist')) {
        aiResponseText = "🎒 **TRAIL AI PACKING ESSENTIALS**\n\nFor hiking in Sabaragamuwa, ensure you pack:\n\n1. **Hydration:** At least 2.5L of water.\n2. **Navigation:** Offline maps (cellular coverage is highly spotty).\n3. **Safety:** Mini first-aid kit, whistle, rain poncho, and headlamp.\n4. **Apparel:** Sturdy grip footwear and anti-leech socks.";
      } else {
        aiResponseText = "🌲 **TRAIL AI ASSISTANT**\n\nI'm scanning safety parameters for Sabaragamuwa trails. Most routes are currently open under moderate humidity.\n\nAlways inform someone of your route before you head out, and remember to pack light but carry the essentials. What trail are you exploring today?";
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
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
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.topBarContent}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color={theme.accent} />
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
          contentContainerStyle={styles.flatListContent}
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
    height: 64,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    zIndex: 10,
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
