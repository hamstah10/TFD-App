import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getTicketDetail, replyToTicket, TicketDetail, TicketMessage } from '../../../src/services/api';

const getStatusInfo = (status: string, language: string) => {
  const statusMap: { [key: string]: { label: string; color: string } } = {
    open: {
      label: language === 'de' ? 'Offen' : 'Open',
      color: '#ff9800',
    },
    in_progress: {
      label: language === 'de' ? 'In Bearbeitung' : 'In Progress',
      color: '#2196f3',
    },
    answered: {
      label: language === 'de' ? 'Beantwortet' : 'Answered',
      color: '#4caf50',
    },
    closed: {
      label: language === 'de' ? 'Geschlossen' : 'Closed',
      color: '#8b8b8b',
    },
  };
  return statusMap[status] || statusMap.open;
};

const getPriorityInfo = (priority: string, language: string) => {
  const priorityMap: { [key: string]: { label: string; color: string } } = {
    low: {
      label: language === 'de' ? 'Niedrig' : 'Low',
      color: '#8b8b8b',
    },
    normal: {
      label: language === 'de' ? 'Normal' : 'Normal',
      color: '#2196f3',
    },
    high: {
      label: language === 'de' ? 'Hoch' : 'High',
      color: '#ff9800',
    },
    urgent: {
      label: language === 'de' ? 'Dringend' : 'Urgent',
      color: '#bd1f22',
    },
  };
  return priorityMap[priority] || priorityMap.normal;
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { getAccessToken } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicketDetail();
    }
  }, [id]);

  const loadTicketDetail = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (token && id) {
        const detail = await getTicketDetail(token, id);
        setTicket(detail);
        // Scroll to bottom after loading
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load ticket detail:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' ? 'Ticket konnte nicht geladen werden.' : 'Failed to load ticket.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !id) return;

    setSendingReply(true);
    try {
      const token = await getAccessToken();
      if (token) {
        await replyToTicket(token, id, replyMessage);
        setReplyMessage('');
        // Reload ticket to show new message
        await loadTicketDetail();
        // Scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' ? 'Antwort konnte nicht gesendet werden.' : 'Failed to send reply.'
      );
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#bd1f22" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#bd1f22" />
        <Text style={styles.errorText}>
          {language === 'de' ? 'Ticket nicht gefunden' : 'Ticket not found'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>
            {language === 'de' ? 'Zurück' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(ticket.status, language);
  const priorityInfo = getPriorityInfo(ticket.priority, language);
  const isClosed = ticket.status === 'closed';

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
          data-testid="ticket-back-btn"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>
      </View>

      {/* Ticket Info */}
      <View style={styles.ticketInfo}>
        <Text style={styles.subject}>{ticket.subject}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="flag" size={14} color={priorityInfo.color} />
            <Text style={[styles.metaText, { color: priorityInfo.color }]}>
              {priorityInfo.label}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color="#8b8b8b" />
            <Text style={styles.metaText}>{formatDate(ticket.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {ticket.messages && ticket.messages.map((msg, index) => {
          const isCustomer = msg.sender === 'customer';
          return (
            <View 
              key={index} 
              style={[
                styles.messageBubble,
                isCustomer ? styles.customerMessage : styles.supportMessage
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>
                  {isCustomer 
                    ? (language === 'de' ? 'Sie' : 'You')
                    : (msg.senderName || 'Support')}
                </Text>
                <Text style={styles.messageTime}>{formatDate(msg.createdAt)}</Text>
              </View>
              <Text style={styles.messageText}>{msg.message}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Reply Input */}
      {!isClosed ? (
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.replyInput}
            value={replyMessage}
            onChangeText={setReplyMessage}
            placeholder={language === 'de' ? 'Antwort schreiben...' : 'Write a reply...'}
            placeholderTextColor="#8b8b8b"
            multiline
            maxLength={2000}
            data-testid="ticket-reply-input"
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!replyMessage.trim() || sendingReply) && styles.sendButtonDisabled
            ]}
            onPress={handleSendReply}
            disabled={!replyMessage.trim() || sendingReply}
            data-testid="ticket-send-reply-btn"
          >
            {sendingReply ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.closedBanner}>
          <Ionicons name="lock-closed" size={18} color="#8b8b8b" />
          <Text style={styles.closedText}>
            {language === 'de' 
              ? 'Dieses Ticket ist geschlossen' 
              : 'This ticket is closed'}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#bd1f22',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketNumber: {
    color: '#bd1f22',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  subject: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#8b8b8b',
    fontSize: 13,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    maxWidth: '90%',
  },
  customerMessage: {
    backgroundColor: '#1a3d5c',
    alignSelf: 'flex-end',
    marginLeft: '10%',
  },
  supportMessage: {
    backgroundColor: '#2a2a2a',
    alignSelf: 'flex-start',
    marginRight: '10%',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    color: '#bd1f22',
    fontSize: 12,
    fontWeight: '600',
  },
  messageTime: {
    color: '#8b8b8b',
    fontSize: 10,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    backgroundColor: '#121212',
    gap: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sendButton: {
    backgroundColor: '#bd1f22',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#5a5a5a',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  closedText: {
    color: '#8b8b8b',
    fontSize: 14,
  },
});
