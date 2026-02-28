import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface VehicleSuggestion {
  type_id?: string;
  manufacturer_id?: string;
  model_id?: string;
  built_id?: string;
  engine_id?: string;
}

interface ChatAssistantProps {
  onVehicleSuggestion: (suggestion: VehicleSuggestion) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function ChatAssistant({ onVehicleSuggestion, isVisible, onClose }: ChatAssistantProps) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (isVisible) {
      // Add welcome message if no messages
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: '0',
          text: language === 'de' 
            ? 'Hallo! Ich bin Ihr Chiptuning-Berater. Sagen Sie mir, welches Fahrzeug Sie haben (Marke, Modell, Baujahr, Motor), und ich helfe Ihnen bei der Auswahl der passenden Tuning-Stufe.'
            : 'Hello! I am your chip tuning advisor. Tell me which vehicle you have (make, model, year, engine), and I will help you choose the right tuning stage.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, {
        message: userMessage.text,
        session_id: sessionId,
        language: language,
      });

      const { response: botResponse, vehicle_suggestion, session_id } = response.data;
      
      setSessionId(session_id);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      // If we got a vehicle suggestion, apply it
      if (vehicle_suggestion) {
        onVehicleSuggestion(vehicle_suggestion);
        
        // Add a system message about the selection
        const selectionMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: language === 'de' 
            ? '✅ Ich habe Ihr Fahrzeug im Konfigurator ausgewählt. Sie können den Chat jetzt schließen um die Tuning-Optionen zu sehen.'
            : '✅ I have selected your vehicle in the configurator. You can close the chat now to see the tuning options.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, selectionMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: language === 'de' 
          ? 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.'
          : 'Sorry, there was an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await axios.delete(`${API_BASE}/api/chat/${sessionId}`);
      } catch (error) {
        console.error('Failed to clear chat:', error);
      }
    }
    setMessages([]);
    setSessionId(null);
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="chatbubbles" size={24} color="#bd1f22" />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {language === 'de' ? 'Tuning Berater' : 'Tuning Advisor'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {language === 'de' ? 'KI-Assistent' : 'AI Assistant'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
            <Ionicons name="refresh" size={20} color="#8b8b8b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.botBubble,
            ]}
          >
            {!message.isUser && (
              <View style={styles.botAvatar}>
                <Ionicons name="car-sport" size={16} color="#bd1f22" />
              </View>
            )}
            <View style={[
              styles.messageContent,
              message.isUser ? styles.userContent : styles.botContent,
            ]}>
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userText : styles.botText,
              ]}>
                {message.text}
              </Text>
            </View>
          </View>
        ))}
        
        {loading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <View style={styles.botAvatar}>
              <Ionicons name="car-sport" size={16} color="#bd1f22" />
            </View>
            <View style={[styles.messageContent, styles.botContent, styles.loadingContent]}>
              <ActivityIndicator color="#bd1f22" size="small" />
              <Text style={styles.loadingText}>
                {language === 'de' ? 'Denke nach...' : 'Thinking...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={language === 'de' ? 'Schreiben Sie eine Nachricht...' : 'Type a message...'}
            placeholderTextColor="#8b8b8b"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#bd1f22',
    borderRadius: 20,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#171717',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '100%',
  },
  userContent: {
    backgroundColor: '#bd1f22',
    borderBottomRightRadius: 4,
  },
  botContent: {
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#e0e0e0',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#bd1f22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4a4a4a',
  },
});
