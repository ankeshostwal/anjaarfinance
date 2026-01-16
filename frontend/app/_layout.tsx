import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="contracts" options={{ title: 'Vehicle Finance Contracts' }} />
        <Stack.Screen name="contract-detail" options={{ title: 'Contract Details' }} />
      </Stack>
    </AuthProvider>
  );
}
