import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';

type MenuTab = 'dashboard' | 'files' | 'tickets';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  
  const getActiveTab = (): MenuTab => {
    if (pathname.includes('/files')) return 'files';
    if (pathname.includes('/tickets')) return 'tickets';
    return 'dashboard';
  };

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)');
  };

  const navigateTo = (tab: MenuTab) => {
    switch (tab) {
      case 'dashboard':
        router.push('/customer/dashboard');
        break;
      case 'files':
        router.push('/customer/files');
        break;
      case 'tickets':
        router.push('/customer/tickets');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerRight}>
          <LanguageSwitch />
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info Bar */}
      <View style={styles.userBar}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={32} color="#bd1f22" />
          <View style={styles.userText}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userCompany}>{user?.company}</Text>
          </View>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'dashboard' && styles.navTabActive]}
          onPress={() => navigateTo('dashboard')}
        >
          <Ionicons 
            name="grid" 
            size={20} 
            color={getActiveTab() === 'dashboard' ? '#ffffff' : '#8b8b8b'} 
          />
          <Text style={[styles.navTabText, getActiveTab() === 'dashboard' && styles.navTabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'files' && styles.navTabActive]}
          onPress={() => navigateTo('files')}
        >
          <Ionicons 
            name="document" 
            size={20} 
            color={getActiveTab() === 'files' ? '#ffffff' : '#8b8b8b'} 
          />
          <Text style={[styles.navTabText, getActiveTab() === 'files' && styles.navTabTextActive]}>
            Files
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'tickets' && styles.navTabActive]}
          onPress={() => navigateTo('tickets')}
        >
          <Ionicons 
            name="chatbubbles" 
            size={20} 
            color={getActiveTab() === 'tickets' ? '#ffffff' : '#8b8b8b'} 
          />
          <Text style={[styles.navTabText, getActiveTab() === 'tickets' && styles.navTabTextActive]}>
            Tickets
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  logo: {
    width: 160,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#bd1f22',
    borderRadius: 8,
  },
  userBar: {
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    marginLeft: 12,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userCompany: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    backgroundColor: '#1a1a1a',
  },
  navTabActive: {
    backgroundColor: '#bd1f22',
  },
  navTabText: {
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '600',
  },
  navTabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
});
