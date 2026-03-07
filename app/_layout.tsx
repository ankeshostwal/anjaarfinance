import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"            options={{ headerShown: false }} />
      <Stack.Screen name="register"         options={{ headerShown: false }} />
      <Stack.Screen name="login"            options={{ headerShown: false }} />
      <Stack.Screen name="change-password"  options={{ title: 'Change Password', headerBackTitle: 'Back' }} />
      <Stack.Screen name="dashboard"        options={{ headerShown: false }} />
      <Stack.Screen name="contracts-list"   options={{ title: 'Agreements', headerBackTitle: 'Dashboard' }} />
      <Stack.Screen name="contract-detail"  options={{ title: 'Contract Detail', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
