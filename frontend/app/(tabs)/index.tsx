import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';
import { OpeningHoursCard } from '../../src/components/OpeningHoursCard';
import { getCompanyInfo } from '../../src/services/api';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const data = await getCompanyInfo();
      setCompanyInfo(data);
    } catch (error) {
      console.error('Failed to load company info:', error);
    }
  };

  const handleCall = () => {
    if (companyInfo?.phone) {
      Linking.openURL(`tel:${companyInfo.phone}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <LanguageSwitch />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.tagline}>{t('tagline')}</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/configurator')}
          >
            <Ionicons name="car-sport" size={24} color="#ffffff" />
            <Text style={styles.ctaButtonText}>{t('selectVehicle')}</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="flash" size={32} color="#bd1f22" />
            <Text style={styles.featureTitle}>Stage 1-3</Text>
            <Text style={styles.featureText}>ECU Tuning</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="shield-checkmark" size={32} color="#bd1f22" />
            <Text style={styles.featureTitle}>Garantie</Text>
            <Text style={styles.featureText}>Warranty</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="leaf" size={32} color="#bd1f22" />
            <Text style={styles.featureTitle}>Eco</Text>
            <Text style={styles.featureText}>Tuning</Text>
          </View>
        </View>

        {/* Opening Hours */}
        <OpeningHoursCard />

        {/* Contact Card */}
        {companyInfo && (
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Ionicons name="location" size={24} color="#bd1f22" />
              <Text style={styles.contactTitle}>{t('address')}</Text>
            </View>
            <Text style={styles.addressText}>{companyInfo.address.street}</Text>
            <Text style={styles.addressText}>
              {companyInfo.address.zip} {companyInfo.address.city}
            </Text>
            <TouchableOpacity style={styles.phoneButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#ffffff" />
              <Text style={styles.phoneText}>{companyInfo.phone}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    width: 200,
    height: 50,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  tagline: {
    color: '#a0a0a0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bd1f22',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  featureText: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  contactCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  addressText: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 4,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bd1f22',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  phoneText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
});
