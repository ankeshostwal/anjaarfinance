import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REG_KEY_STORE = 'registration_data';
const SESSION_KEY   = 'user_session';

// ─────────────────────────────────────────────────────────────
// index.tsx is ALWAYS the first screen Expo Router opens.
// We use it purely as an auth gate — redirects to the right
// screen instantly. The contracts list is now in contracts.tsx
// which is reached via /contracts from dashboard.
// ─────────────────────────────────────────────────────────────
export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const reg = await AsyncStorage.getItem(REG_KEY_STORE);
        if (!reg) {
          router.replace('/register');
          return;
        }
        const session = await AsyncStorage.getItem(SESSION_KEY);
        if (session === 'active') {
          router.replace('/dashboard');
          return;
        }
        router.replace('/login');
      } catch (e) {
        router.replace('/login');
      }
    };
    check();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1976D2" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEF2F7' },
});
