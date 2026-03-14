import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const REG_KEY_STORE = 'registration_data';

// ── Check Firebase: is this key still active? ──
async function isKeyStillActive(key: string): Promise<boolean> {
  try {
    const keysRef  = collection(db, 'keys');
    const q        = query(keysRef, where('key', '==', key.trim().toUpperCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    return snapshot.docs[0].data().active === true;
  } catch (e) {
    // If Firebase unreachable (no internet), allow access
    // This prevents lockout when user has no internet
    return true;
  }
}

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        // Step 1: Check if registered at all
        const regRaw = await AsyncStorage.getItem(REG_KEY_STORE);
        if (!regRaw) {
          router.replace('/register');
          return;
        }

        // Step 2: Parse registration
        const reg = JSON.parse(regRaw);
        if (!reg?.key) {
          router.replace('/register');
          return;
        }

        // Step 3: Check Firebase — is key still active?
        const stillActive = await isKeyStillActive(reg.key);
        if (!stillActive) {
          // Key was revoked — clear local registration and send to register
          await AsyncStorage.removeItem(REG_KEY_STORE);
          router.replace('/register');
          return;
        }

        // Step 4: All good — go to login
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
      <Text style={styles.checking}>Verifying access...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEF2F7' },
  checking:  { marginTop: 12, fontSize: 12, color: '#999' },
});
