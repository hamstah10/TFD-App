import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { View, Platform, StyleSheet } from 'react-native';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';
import Logo from '../../src/components/Logo';
import useIsOpen from '../../src/hooks/useIsOpen';

function CustomHeader() {
  const isOpen = useIsOpen();
  
  return (
    <View style={styles.headerContainer}>
      <Logo width={180} height={55} isOpen={isOpen} />
      <View style={styles.headerRight}>
        <View style={[styles.clockIcon, isOpen ? styles.clockOpen : styles.clockClosed]}>
          <Ionicons name="time" size={20} color="#ffffff" />
        </View>
        <LanguageSwitch />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#bd1f22',
        tabBarInactiveTintColor: '#8b8b8b',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: '#121212',
          height: 80,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        header: () => <CustomHeader />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="configurator"
        options={{
          title: t('configurator'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: t('blog'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: t('contact'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('admin'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockOpen: {
    backgroundColor: '#4caf50',
  },
  clockClosed: {
    backgroundColor: '#bd1f22',
  },
});
