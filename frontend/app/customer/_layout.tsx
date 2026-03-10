import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Slot, useRouter, usePathname, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';
import Logo from '../../src/components/Logo';
import useIsOpen from '../../src/hooks/useIsOpen';

type MenuTab = 'dashboard' | 'files' | 'photos' | 'fahrzeugschein' | 'tickets';

export default function CustomerLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useIsOpen();
  
  const getActiveTab = (): MenuTab => {
    if (pathname.includes('/files')) return 'files';
    if (pathname.includes('/photos')) return 'photos';
    if (pathname.includes('/fahrzeugschein')) return 'fahrzeugschein';
    if (pathname.includes('/tickets')) return 'tickets';
    return 'dashboard';
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  // Redirect to login if not authenticated (after all hooks)
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const navigateTo = (tab: MenuTab) => {
    switch (tab) {
      case 'dashboard':
        router.push('/customer/dashboard');
        break;
      case 'files':
        router.push('/customer/files');
        break;
      case 'photos':
        router.push('/customer/photos');
        break;
      case 'fahrzeugschein':
        router.push('/customer/fahrzeugschein');
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
        <Logo width={160} height={50} isOpen={isOpen} />
        <View style={styles.headerRight}>
          <Ionicons name="time" size={24} color={isOpen ? '#4caf50' : '#f5a623'} />
          <LanguageSwitch />
        </View>
      </View>

      {/* User Info Bar */}
      <View style={styles.userBar}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={32} color="#f5a623" />
          <View style={styles.userText}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userCompany}>{user?.company}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'dashboard' && styles.navTabActive]}
          onPress={() => navigateTo('dashboard')}
        >
          <Ionicons 
            name="grid" 
            size={24} 
            color={getActiveTab() === 'dashboard' ? '#ffffff' : '#8b8b8b'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'files' && styles.navTabActive]}
          onPress={() => navigateTo('files')}
        >
          <Ionicons 
            name="document" 
            size={24} 
            color={getActiveTab() === 'files' ? '#ffffff' : '#8b8b8b'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'photos' && styles.navTabActive]}
          onPress={() => navigateTo('photos')}
        >
          <Ionicons 
            name="camera" 
            size={24} 
            color={getActiveTab() === 'photos' ? '#ffffff' : '#8b8b8b'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'fahrzeugschein' && styles.navTabActive]}
          onPress={() => navigateTo('fahrzeugschein')}
        >
          <Ionicons 
            name="car" 
            size={24} 
            color={getActiveTab() === 'fahrzeugschein' ? '#ffffff' : '#8b8b8b'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, getActiveTab() === 'tickets' && styles.navTabActive]}
          onPress={() => navigateTo('tickets')}
        >
          <Ionicons 
            name="chatbubbles" 
            size={24} 
            color={getActiveTab() === 'tickets' ? '#ffffff' : '#8b8b8b'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111931',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1526',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#162040',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#f5a623',
    borderRadius: 8,
  },
  userBar: {
    backgroundColor: '#0d1526',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#162040',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0d1526',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: '#162040',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  navTabActive: {
    backgroundColor: '#f5a623',
  },
});
