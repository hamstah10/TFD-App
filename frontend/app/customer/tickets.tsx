import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { getTickets, createTicket, Ticket } from '../../src/services/api';

const getStatusInfo = (status: string, language: string) => {
  const statusMap: { [key: string]: { label: string; color: string } } = {
    open: {
      label: language === 'de' ? 'Offen' : 'Open',
      color: '#ff9800',
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
      color: '#bd1f22',
    },
  };
  return priorityMap[priority] || priorityMap.normal;
};

export default function TicketsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { getAccessToken } = useAuth();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const data = await getTickets(token);
        setTickets(data);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTicketDetail = (ticket: Ticket) => {
    router.push(`/customer/ticket/${ticket.ticketNumber}`);
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Bitte füllen Sie alle Felder aus.' 
          : 'Please fill in all fields.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      
      await createTicket(token, newSubject, newMessage);
      
      Alert.alert(
        language === 'de' ? 'Ticket erstellt' : 'Ticket Created',
        language === 'de' 
          ? 'Ihr Ticket wurde erfolgreich erstellt.' 
          : 'Your ticket has been created successfully.',
        [{ text: 'OK', onPress: () => {
          setShowNewTicket(false);
          setNewSubject('');
          setNewMessage('');
          loadTickets(); // Reload tickets
        }}]
      );
    } catch (error) {
      console.error('Failed to create ticket:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Ticket konnte nicht erstellt werden.' 
          : 'Failed to create ticket.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openTickets = tickets.filter(t => t.status !== 'closed');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'de' ? 'Support Tickets' : 'Support Tickets'}
        </Text>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={() => setShowNewTicket(!showNewTicket)}
        >
          <Ionicons 
            name={showNewTicket ? 'close' : 'add'} 
            size={20} 
            color="#ffffff" 
          />
          <Text style={styles.newButtonText}>
            {showNewTicket 
              ? (language === 'de' ? 'Abbrechen' : 'Cancel')
              : (language === 'de' ? 'Neues Ticket' : 'New Ticket')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* New Ticket Form */}
      {showNewTicket && (
        <View style={styles.newTicketForm}>
          <Text style={styles.formTitle}>
            {language === 'de' ? 'Neues Ticket erstellen' : 'Create New Ticket'}
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'de' ? 'Betreff' : 'Subject'} *
            </Text>
            <TextInput
              style={styles.input}
              value={newSubject}
              onChangeText={setNewSubject}
              placeholder={language === 'de' ? 'Betreff eingeben...' : 'Enter subject...'}
              placeholderTextColor="#8b8b8b"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {language === 'de' ? 'Nachricht' : 'Message'} *
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={language === 'de' ? 'Ihre Nachricht...' : 'Your message...'}
              placeholderTextColor="#8b8b8b"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleCreateTicket}>
            <Ionicons name="send" size={18} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {language === 'de' ? 'Ticket erstellen' : 'Create Ticket'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{loading ? '-' : openTickets.length}</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Offene Tickets' : 'Open Tickets'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {loading ? '-' : closedTickets.length}
          </Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Geschlossene' : 'Closed'}
          </Text>
        </View>
      </View>

      {/* Tickets List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'de' ? 'Alle Tickets' : 'All Tickets'}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#bd1f22" />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>
              {language === 'de' ? 'Keine Tickets vorhanden' : 'No tickets found'}
            </Text>
          </View>
        ) : (
          tickets.map((ticket) => {
            const statusInfo = getStatusInfo(ticket.status, language);
            const priorityInfo = getPriorityInfo(ticket.priority, language);
            const createdDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('de-DE') : '';
            const lastReplyDate = ticket.lastReply ? new Date(ticket.lastReply).toLocaleString('de-DE') : '';
            
            return (
              <TouchableOpacity 
                key={ticket.id} 
                style={styles.ticketCard}
                onPress={() => openTicketDetail(ticket)}
                data-testid={`ticket-card-${ticket.ticketNumber}`}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketIdContainer}>
                    <Text style={styles.ticketId}>{ticket.ticketNumber}</Text>
                    <View style={[styles.priorityDot, { backgroundColor: priorityInfo.color }]} />
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Text style={styles.statusText}>{statusInfo.label}</Text>
                  </View>
                </View>

                <Text style={styles.ticketSubject}>{ticket.subject}</Text>

                <View style={styles.ticketMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar" size={14} color="#8b8b8b" />
                    <Text style={styles.metaText}>{createdDate}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="chatbubble" size={14} color="#8b8b8b" />
                    <Text style={styles.metaText}>{ticket.messageCount} {language === 'de' ? 'Nachrichten' : 'messages'}</Text>
                  </View>
                </View>

                <View style={styles.ticketFooter}>
                  <Text style={styles.lastReply}>
                    {language === 'de' ? 'Letzte Antwort:' : 'Last reply:'} {lastReplyDate}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bd1f22',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  newButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  newTicketForm: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#bd1f22',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    color: '#8b8b8b',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketId: {
    color: '#bd1f22',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  ticketSubject: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  lastReply: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  bottomSpacer: {
    height: 30,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  emptyText: {
    color: '#8b8b8b',
    fontSize: 16,
    marginTop: 12,
  },
});
