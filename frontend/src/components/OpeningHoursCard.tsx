import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { getOpeningHours } from '../services/api';

interface OpeningHoursData {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export function OpeningHoursCard() {
  const { t, language } = useLanguage();
  const [hours, setHours] = useState<OpeningHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      const data = await getOpeningHours();
      setHours(data);
      checkIfOpen(data);
    } catch (error) {
      console.error('Failed to load opening hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfOpen = (hoursData: OpeningHoursData) => {
    const now = new Date();
    const day = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const dayMap: { [key: number]: keyof OpeningHoursData } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    const todayHours = hoursData[dayMap[day]];
    if (todayHours === 'geschlossen' || todayHours === 'closed') {
      setIsOpen(false);
      return;
    }
    
    const [openTime, closeTime] = todayHours.split('-').map(t => {
      const [h, m] = t.replace(' Uhr', '').split(':').map(Number);
      return h * 100 + m;
    });
    
    setIsOpen(currentTime >= openTime && currentTime <= closeTime);
  };

  const dayKeys: (keyof OpeningHoursData)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: t('monday'),
    tuesday: t('tuesday'),
    wednesday: t('wednesday'),
    thursday: t('thursday'),
    friday: t('friday'),
    saturday: t('saturday'),
    sunday: t('sunday')
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#bbcf4e" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={24} color="#bbcf4e" />
        <Text style={styles.title}>{t('openingHours')}</Text>
      </View>
      
      <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
        <Text style={styles.statusText}>
          {isOpen ? t('currentlyOpen') : t('currentlyClosed')}
        </Text>
      </View>
      
      {hours && (
        <View style={styles.hoursContainer}>
          {dayKeys.map((day) => (
            <View key={day} style={styles.hourRow}>
              <Text style={styles.dayText}>{dayLabels[day]}</Text>
              <Text style={styles.timeText}>
                {hours[day] === 'geschlossen' ? t('closed') : hours[day]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  openBadge: {
    backgroundColor: '#00c853',
  },
  closedBadge: {
    backgroundColor: '#bbcf4e',
  },
  statusText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  hoursContainer: {
    gap: 8,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
