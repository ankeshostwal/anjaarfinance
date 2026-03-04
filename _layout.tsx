import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Contracts', headerShown: false }} />
      <Stack.Screen name="contract-detail" options={{ title: 'Contract Detail', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
