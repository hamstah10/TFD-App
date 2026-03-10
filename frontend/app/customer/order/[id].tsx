import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getOrders, Order } from '../../../src/services/api';

const getStatusInfo = (status: string, statusLabel?: string) => {
  const statusMap: { [key: string]: { label: string; color: string; icon: keyof typeof Ionicons.glyphMap } } = {
    pending: { label: 'Ausstehend', color: '#ff9800', icon: 'time' },
    eingegangen: { label: 'Eingegangen', color: '#2196f3', icon: 'mail' },
    in_bearbeitung: { label: 'In Bearbeitung', color: '#9c27b0', icon: 'construct' },
    abgeschlossen: { label: 'Abgeschlossen', color: '#4caf50', icon: 'checkmark-circle' },
    abgelehnt: { label: 'Abgelehnt', color: '#f44336', icon: 'close-circle' },
  };
  
  const info = statusMap[status] || statusMap.pending;
  return {
    ...info,
    label: statusLabel || info.label
  };
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const { getAccessToken } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const orders = await getOrders(token);
        const found = orders.find(o => o.orderNumber === id);
        setOrder(found || null);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrder();
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f5a623" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#f5a623" />
        <Text style={styles.errorText}>
          {language === 'de' ? 'Auftrag nicht gefunden' : 'Order not found'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>
            {language === 'de' ? 'Zurück' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(order.status, order.statusLabel);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
          data-testid="order-back-btn"
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Ionicons name={statusInfo.icon as any} size={14} color="#ffffff" />
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f5a623"
            colors={['#f5a623']}
          />
        }
      >
        {/* Vehicle Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-sport" size={20} color="#f5a623" />
            <Text style={styles.sectionTitle}>
              {language === 'de' ? 'Fahrzeug' : 'Vehicle'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.vehicleName}>{order.vehicle || order.vehicleDisplay}</Text>
            <View style={styles.vehicleDetails}>
              {order.vehicleType && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Typ:</Text>
                  <Text style={styles.detailValue}>{order.vehicleType}</Text>
                </View>
              )}
              {order.manufacturer && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hersteller:</Text>
                  <Text style={styles.detailValue}>{order.manufacturer}</Text>
                </View>
              )}
              {order.model && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Modell:</Text>
                  <Text style={styles.detailValue}>{order.model}</Text>
                </View>
              )}
              {order.built && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Baujahr:</Text>
                  <Text style={styles.detailValue}>{order.built}</Text>
                </View>
              )}
              {order.engine && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Motor:</Text>
                  <Text style={styles.detailValue}>{order.engine}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tuning Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer" size={20} color="#f5a623" />
            <Text style={styles.sectionTitle}>
              {language === 'de' ? 'Tuning' : 'Tuning'}
            </Text>
          </View>
          <View style={styles.card}>
            {order.stage && (
              <View style={styles.stageBadge}>
                <Text style={styles.stageText}>{order.stage}</Text>
              </View>
            )}
            <View style={styles.tuningDetails}>
              {order.tuningTool && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tool:</Text>
                  <Text style={styles.detailValue}>{order.tuningTool}</Text>
                </View>
              )}
              {order.method && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Methode:</Text>
                  <Text style={styles.detailValue}>{order.method}</Text>
                </View>
              )}
              {order.slaveOrMaster && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Modus:</Text>
                  <Text style={styles.detailValue}>{order.slaveOrMaster}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* File Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document" size={20} color="#f5a623" />
            <Text style={styles.sectionTitle}>
              {language === 'de' ? 'Datei' : 'File'}
            </Text>
          </View>
          <View style={styles.card}>
            <View style={styles.fileInfo}>
              <Ionicons name="document-attach" size={32} color="#f5a623" />
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={2}>{order.fileName}</Text>
                {order.fileSize && (
                  <Text style={styles.fileSize}>{formatFileSize(order.fileSize)}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Order Meta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#f5a623" />
            <Text style={styles.sectionTitle}>
              {language === 'de' ? 'Details' : 'Details'}
            </Text>
          </View>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Erstellt:</Text>
              <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
            </View>
            {order.updatedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aktualisiert:</Text>
                <Text style={styles.detailValue}>{formatDate(order.updatedAt)}</Text>
              </View>
            )}
            {order.crmOrderId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CRM-ID:</Text>
                <Text style={styles.detailValue}>#{order.crmOrderId}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111931',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111931',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#111931',
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
    backgroundColor: '#f5a623',
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2d5a',
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
  orderNumber: {
    color: '#f5a623',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#162040',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2d5a',
  },
  vehicleName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  vehicleDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  stageBadge: {
    backgroundColor: '#f5a623',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  stageText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  tuningDetails: {
    gap: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    color: '#8b8b8b',
    fontSize: 12,
  },
});
