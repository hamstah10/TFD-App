import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';

// Mock data for tickets
const MOCK_TICKETS = [
  {
    id: 'TKT-001',
    subject: 'Frage zu Stage 2 Tuning',
    status: 'open',
    priority: 'normal',
    created_at: '2024-02-28',
    last_reply: '2024-02-28 14:30',
    messages: 3,
  },
  {
    id: 'TKT-002',
    subject: 'Datei-Upload Problem',
    status: 'answered',
    priority: 'high',
    created_at: '2024-02-27',
    last_reply: '2024-02-27 16:45',
    messages: 5,
  },
  {
    id: 'TKT-003',
    subject: 'Rechnung anfordern',
    status: 'closed',
    priority: 'low',
    created_at: '2024-02-20',
    last_reply: '2024-02-21 10:00',
    messages: 2,
  },
];

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
      color: '#f44336',
    },
  };
  return priorityMap[priority] || priorityMap.normal;
};

export default function TicketsScreen() {
  const { language } = useLanguage();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Bitte füllen Sie alle Felder aus.' 
          : 'Please fill in all fields.'
      );
      return;
    }

    Alert.alert(
      language === 'de' ? 'Ticket erstellt' : 'Ticket Created',
      language === 'de' 
        ? 'Ihr Ticket wurde erfolgreich erstellt.' 
        : 'Your ticket has been created successfully.',
      [{ text: 'OK', onPress: () => {
        setShowNewTicket(false);
        setNewSubject('');
        setNewMessage('');
      }}]
    );
  };

  const openTickets = MOCK_TICKETS.filter(t => t.status !== 'closed');

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
          <Text style={styles.statNumber}>{openTickets.length}</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Offene Tickets' : 'Open Tickets'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {MOCK_TICKETS.filter(t => t.status === 'closed').length}
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

        {MOCK_TICKETS.map((ticket) => {
          const statusInfo = getStatusInfo(ticket.status, language);
          const priorityInfo = getPriorityInfo(ticket.priority, language);
          
          return (
            <TouchableOpacity key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={styles.ticketIdContainer}>
                  <Text style={styles.ticketId}>{ticket.id}</Text>
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
                  <Text style={styles.metaText}>{ticket.created_at}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="chatbubble" size={14} color="#8b8b8b" />
                  <Text style={styles.metaText}>{ticket.messages} {language === 'de' ? 'Nachrichten' : 'messages'}</Text>
                </View>
              </View>

              <View style={styles.ticketFooter}>
                <Text style={styles.lastReply}>
                  {language === 'de' ? 'Letzte Antwort:' : 'Last reply:'} {ticket.last_reply}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingVertical: 20,
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
});
