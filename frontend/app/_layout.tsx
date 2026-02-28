import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../src/contexts/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f23' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="blog/[id]" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: '#16213e' },
            headerTintColor: '#ffffff',
            title: 'Blog'
          }} 
        />
        <Stack.Screen 
          name="admin/blog-editor" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: '#16213e' },
            headerTintColor: '#ffffff',
            title: 'Blog Editor'
          }} 
        />
      </Stack>
    </LanguageProvider>
  );
}
