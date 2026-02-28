import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#171717' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="blog/[id]" 
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#121212' },
              headerTintColor: '#ffffff',
              title: 'Blog'
            }} 
          />
          <Stack.Screen 
            name="admin/blog-editor" 
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#121212' },
              headerTintColor: '#ffffff',
              title: 'Blog Editor'
            }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="customer" 
            options={{ headerShown: false }} 
          />
        </Stack>
      </LanguageProvider>
    </AuthProvider>
  );
}
