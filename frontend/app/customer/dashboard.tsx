import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { getOrders, getTickets, Order, Ticket } from '../../src/services/api';

interface DashboardOrder {
  id: string;
  orderNumber: string;
  vehicle: string;
  stage: string;
  status: string;
  createdAt: string;
  progress: number;
}

const getStatusInfo = (status: string, language: string) => {
  const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
    pending: {
      label: language === 'de' ? 'Ausstehend' : 'Pending',
      color: '#ff9800',
      icon: 'time-outline',
    },
    waiting: {
      label: language === 'de' ? 'Wartend' : 'Waiting',
      color: '#ff9800',
      icon: 'time-outline',
    },
    processing: {
      label: language === 'de' ? 'In Bearbeitung' : 'Processing',
      color: '#2196f3',
      icon: 'construct-outline',
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
  return statusMap[status] || statusMap.pending;
};

// Calculate progress based on status
const getProgressFromStatus = (status: string): number => {
  switch (status) {
    case 'pending': return 10;
    case 'waiting': return 20;
    case 'processing': return 50;
    case 'in_progress': return 60;
    case 'review': return 80;
    case 'completed': return 100;
    default: return 0;
  }
};

export default function CustomerDashboard() {
  const { language } = useLanguage();
  const { user, getAccessToken } = useAuth();
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [openTickets, setOpenTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        // Load orders and tickets in parallel
        const [apiOrders, apiTickets] = await Promise.all([
          getOrders(token),
          getTickets(token),
        ]);
        
        const mappedOrders: DashboardOrder[] = apiOrders.map((o: Order) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          vehicle: o.vehicle,
          stage: o.stage,
          status: o.status,
          createdAt: o.createdAt ? new Date(o.createdAt).toLocaleDateString('de-DE') : '',
          progress: getProgressFromStatus(o.status),
        }));
        setOrders(mappedOrders);
        
        // Count open tickets
        const openCount = apiTickets.filter((t: Ticket) => t.status !== 'closed').length;
        setOpenTickets(openCount);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(order => order.status !== 'completed');

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
          <Text style={styles.statNumber}>{loading ? '-' : activeOrders.length}</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Aktive Aufträge' : 'Active Orders'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cloud-upload" size={28} color="#2196f3" />
          <Text style={styles.statNumber}>{loading ? '-' : orders.length}</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Dateien' : 'Files'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles" size={28} color="#4caf50" />
          <Text style={styles.statNumber}>{loading ? '-' : openTickets}</Text>
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#bd1f22" />
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>
              {language === 'de' ? 'Keine aktiven Aufträge' : 'No active orders'}
            </Text>
          </View>
        ) : (
          activeOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status, language);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>{order.orderNumber}</Text>
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
                    <Text style={styles.detailText}>{order.createdAt}</Text>
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
          })
        )}

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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
