import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';

// Mock data for orders
const MOCK_ORDERS = [
  {
    id: 'ORD-2024-001',
    vehicle: 'Audi A4 2.0 TFSI',
    stage: 'Stage 1',
    status: 'in_progress',
    created_at: '2024-02-28',
    progress: 60,
  },
  {
    id: 'ORD-2024-002',
    vehicle: 'BMW 330i G20',
    stage: 'Stage 2',
    status: 'waiting',
    created_at: '2024-02-27',
    progress: 20,
  },
  {
    id: 'ORD-2024-003',
    vehicle: 'VW Golf GTI',
    stage: 'Eco Tuning',
    status: 'review',
    created_at: '2024-02-26',
    progress: 90,
  },
];

const getStatusInfo = (status: string, language: string) => {
  const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
    waiting: {
      label: language === 'de' ? 'Wartend' : 'Waiting',
      color: '#ff9800',
      icon: 'time-outline',
    },
    in_progress: {
      label: language === 'de' ? 'In Bearbeitung' : 'In Progress',
      color: '#2196f3',
      icon: 'construct-outline',
    },
    review: {
      label: language === 'de' ? 'Überprüfung' : 'Review',
      color: '#9c27b0',
      icon: 'eye-outline',
    },
    completed: {
      label: language === 'de' ? 'Abgeschlossen' : 'Completed',
      color: '#4caf50',
      icon: 'checkmark-circle-outline',
    },
  };
  return statusMap[status] || statusMap.waiting;
};

export default function CustomerDashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const activeOrders = MOCK_ORDERS.filter(order => order.status !== 'completed');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          {language === 'de' ? 'Willkommen zurück,' : 'Welcome back,'}
        </Text>
        <Text style={styles.welcomeName}>{user?.name}!</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={28} color="#bd1f22" />
          <Text style={styles.statNumber}>{activeOrders.length}</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Aktive Aufträge' : 'Active Orders'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cloud-upload" size={28} color="#2196f3" />
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Dateien' : 'Files'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles" size={28} color="#4caf50" />
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Offene Tickets' : 'Open Tickets'}
          </Text>
        </View>
      </View>

      {/* Active Orders Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Aktuelle Aufträge' : 'Current Orders'}
          </Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>
              {language === 'de' ? 'Alle anzeigen' : 'View All'}
            </Text>
          </TouchableOpacity>
        </View>

        {activeOrders.map((order) => {
          const statusInfo = getStatusInfo(order.status, language);
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderVehicle}>{order.vehicle}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Ionicons name={statusInfo.icon as any} size={14} color="#ffffff" />
                  <Text style={styles.statusText}>{statusInfo.label}</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="flash" size={16} color="#bd1f22" />
                  <Text style={styles.detailText}>{order.stage}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={16} color="#8b8b8b" />
                  <Text style={styles.detailText}>{order.created_at}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${order.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{order.progress}%</Text>
              </View>
            </View>
          );
        })}

        {activeOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={48} color="#4caf50" />
            <Text style={styles.emptyText}>
              {language === 'de' 
                ? 'Keine aktiven Aufträge' 
                : 'No active orders'}
            </Text>
          </View>
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
  welcomeSection: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  welcomeText: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  welcomeName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    color: '#8b8b8b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#bd1f22',
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    color: '#bd1f22',
    fontSize: 12,
    fontWeight: '600',
  },
  orderVehicle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#bd1f22',
    borderRadius: 3,
  },
  progressText: {
    color: '#8b8b8b',
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8b8b8b',
    fontSize: 16,
    marginTop: 12,
  },
  bottomSpacer: {
    height: 30,
  },
});
