import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { getOrders, getTickets, getScans, Order, Ticket } from '../../src/services/api';

interface DashboardScan {
  id: string;
  vehicleData: {
    manufacturer?: string;
    model?: string;
    vin?: string;
    firstRegistration?: string;
    power?: string;
    engineCode?: string;
    fuelType?: string;
    // Old API fields
    d1?: string;
    d3?: string;
    ez_string?: string;
    p1?: string;
    p2_p4?: string;
    p3?: string;
  };
  selectedStage?: string | { id: string; name: string; [key: string]: any };
  createdAt: string;
}

interface DashboardOrder {
  id: string;
  orderNumber: string;
  vehicle: string;
  stage: string;
  status: string;
  statusLabel?: string;
  createdAt: string;
  progress: number;
}

const getStatusInfo = (status: string, language: string, statusLabel?: string) => {
  const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
    // English statuses
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
    // German/CRM statuses
    eingegangen: {
      label: 'Eingegangen',
      color: '#ff9800',
      icon: 'time-outline',
    },
    in_bearbeitung: {
      label: 'In Bearbeitung',
      color: '#2196f3',
      icon: 'construct-outline',
    },
    abgeschlossen: {
      label: 'Abgeschlossen',
      color: '#4caf50',
      icon: 'checkmark-circle-outline',
    },
    fertig: {
      label: 'Fertig',
      color: '#4caf50',
      icon: 'checkmark-circle-outline',
    },
    abgelehnt: {
      label: 'Abgelehnt',
      color: '#bbcf4e',
      icon: 'close-circle-outline',
    },
    storniert: {
      label: 'Storniert',
      color: '#bbcf4e',
      icon: 'close-circle-outline',
    },
  };
  
  // If we have a statusLabel from CRM and status not in map, use it
  if (statusLabel && !statusMap[status]) {
    return {
      label: statusLabel,
      color: '#607d8b',
      icon: 'information-circle-outline',
    };
  }
  
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
  const router = useRouter();
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [scans, setScans] = useState<DashboardScan[]>([]);
  const [openTickets, setOpenTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        // Load orders, tickets and scans in parallel
        const [apiOrders, apiTickets, apiScans] = await Promise.all([
          getOrders(token),
          getTickets(token),
          getScans(token),
        ]);
        
        const mappedOrders: DashboardOrder[] = apiOrders.map((o: Order) => ({
          id: o.id || o.orderNumber,
          orderNumber: o.orderNumber,
          vehicle: o.vehicle,
          stage: o.stage,
          status: o.status,
          statusLabel: o.statusLabel,
          createdAt: o.createdAt ? new Date(o.createdAt).toLocaleDateString('de-DE') : '',
          progress: getProgressFromStatus(o.status),
        }));
        setOrders(mappedOrders);
        
        // Map scans
        const mappedScans: DashboardScan[] = (apiScans || []).map((s: any) => ({
          id: s.id,
          vehicleData: s.vehicleData || {},
          selectedStage: s.selectedStage,
          createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('de-DE') : '',
        }));
        setScans(mappedScans);
        
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

  const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'abgeschlossen');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={28} color="#bbcf4e" />
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
          <TouchableOpacity onPress={() => router.push('/customer/files')}>
            <Text style={styles.viewAllText}>
              {language === 'de' ? 'Alle anzeigen' : 'View All'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#bbcf4e" />
          </View>
        ) : activeOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>
              {language === 'de' ? 'Keine aktiven Aufträge' : 'No active orders'}
            </Text>
          </View>
        ) : (
          activeOrders.map((order, index) => {
            const statusInfo = getStatusInfo(order.status, language);
            return (
              <TouchableOpacity 
                key={order.id || order.orderNumber || `order-${index}`} 
                style={styles.orderCard}
                onPress={() => router.push(`/customer/order/${order.orderNumber}`)}
                activeOpacity={0.8}
                data-testid={`dashboard-order-${order.orderNumber}`}
              >
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
                    <Ionicons name="flash" size={16} color="#bbcf4e" />
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
                
                <View style={styles.orderArrowIndicator}>
                  <Ionicons name="chevron-forward" size={18} color="#8b8b8b" />
                </View>
              </TouchableOpacity>
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

      {/* Scanned Vehicle Documents Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Gescannte Fahrzeugscheine' : 'Scanned Vehicle Documents'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/customer/fahrzeugschein')}>
            <Text style={styles.viewAllText}>
              {language === 'de' ? 'Scanner öffnen' : 'Open Scanner'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#bbcf4e" />
          </View>
        ) : scans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>
              {language === 'de' ? 'Noch keine Fahrzeugscheine gescannt' : 'No vehicle documents scanned yet'}
            </Text>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => router.push('/customer/fahrzeugschein')}
            >
              <Ionicons name="scan" size={18} color="#ffffff" />
              <Text style={styles.scanButtonText}>
                {language === 'de' ? 'Jetzt scannen' : 'Scan now'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          scans.slice(0, 3).map((scan, index) => (
            <View key={scan.id || `scan-${index}`} style={styles.scanCard}>
              <View style={styles.scanHeader}>
                <View style={styles.scanIconContainer}>
                  <Ionicons name="car" size={24} color="#bbcf4e" />
                </View>
                <View style={styles.scanMainInfo}>
                  <Text style={styles.scanVehicle}>
                    {scan.vehicleData.manufacturer || scan.vehicleData.d1 || 'Unbekannt'} {scan.vehicleData.model || scan.vehicleData.d3 || ''}
                  </Text>
                  <Text style={styles.scanDate}>{scan.createdAt}</Text>
                </View>
              </View>
              
              <View style={styles.scanDetails}>
                {scan.vehicleData.vin && (
                  <View style={styles.scanDetailRow}>
                    <Text style={styles.scanDetailLabel}>FIN:</Text>
                    <Text style={styles.scanDetailValue}>{scan.vehicleData.vin}</Text>
                  </View>
                )}
                {(scan.vehicleData.firstRegistration || scan.vehicleData.ez_string) && (
                  <View style={styles.scanDetailRow}>
                    <Text style={styles.scanDetailLabel}>Erstzulassung:</Text>
                    <Text style={styles.scanDetailValue}>{scan.vehicleData.firstRegistration || scan.vehicleData.ez_string}</Text>
                  </View>
                )}
                {(scan.vehicleData.power || scan.vehicleData.p2_p4) && (
                  <View style={styles.scanDetailRow}>
                    <Text style={styles.scanDetailLabel}>Leistung:</Text>
                    <Text style={styles.scanDetailValue}>{scan.vehicleData.power || `${scan.vehicleData.p2_p4} kW`}</Text>
                  </View>
                )}
                {(scan.vehicleData.engineCode || scan.vehicleData.p1) && (
                  <View style={styles.scanDetailRow}>
                    <Text style={styles.scanDetailLabel}>{scan.vehicleData.engineCode ? 'Motorcode:' : 'Hubraum:'}</Text>
                    <Text style={styles.scanDetailValue}>{scan.vehicleData.engineCode || `${scan.vehicleData.p1} cm³`}</Text>
                  </View>
                )}
                {(scan.vehicleData.fuelType || scan.vehicleData.p3) && (
                  <View style={styles.scanDetailRow}>
                    <Text style={styles.scanDetailLabel}>Kraftstoff:</Text>
                    <Text style={styles.scanDetailValue}>{scan.vehicleData.fuelType || scan.vehicleData.p3}</Text>
                  </View>
                )}
              </View>
              
              {scan.selectedStage && (
                <View style={styles.scanStage}>
                  <Ionicons name="flash" size={16} color="#4caf50" />
                  <Text style={styles.scanStageText}>
                    {typeof scan.selectedStage === 'object' ? scan.selectedStage.name : scan.selectedStage}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111931',
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
    backgroundColor: '#0d1526',
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
    color: '#bbcf4e',
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#0d1526',
    borderRadius: 8,
    padding: 16,
    paddingRight: 36,
    marginBottom: 12,
    position: 'relative',
  },
  orderArrowIndicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -9 }],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    color: '#bbcf4e',
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
    backgroundColor: '#162040',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#bbcf4e',
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
    textAlign: 'center',
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bbcf4e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scanCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(189, 31, 34, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scanMainInfo: {
    flex: 1,
  },
  scanVehicle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanDate: {
    color: '#8b8b8b',
    fontSize: 12,
    marginTop: 2,
  },
  scanDetails: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scanDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  scanDetailLabel: {
    color: '#8b8b8b',
    fontSize: 13,
  },
  scanDetailValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  scanStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  scanStageText: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: '500',
  },
});
