import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { db } from './firebaseConfig';
import {
  collection, query, where, getDocs, updateDoc, doc,
} from 'firebase/firestore';

const SECRET_SALT   = "ANJAARFINANCE2026ANKESH";
const REG_KEY_STORE = "registration_data";

// ── SHA256 local validation (same as before) ──
async function sha256(text: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256, text
  );
  return digest.toUpperCase();
}

async function validateKeyLocally(inputKey: string): Promise<boolean> {
  const parts = inputKey.trim().toUpperCase().split('-');
  if (parts.length !== 5) return false;
  const signature = parts[4];
  const rawKey    = parts.slice(0, 4).join('-');
  const combined  = rawKey + SECRET_SALT;
  const fullHash  = await sha256(combined);
  const expected  = fullHash.substring(0, 8);
  return signature === expected;
}

// ── Firebase validation: key must exist + be active ──
async function validateKeyOnFirebase(inputKey: string, currentDeviceId: string): Promise<{
  valid: boolean;
  active: boolean;
  deviceLocked: boolean;
  docId: string | null;
  owner: string;
}> {
  try {
    const keysRef  = collection(db, 'keys');
    const q        = query(keysRef, where('key', '==', inputKey.trim().toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { valid: false, active: false, deviceLocked: false, docId: null, owner: '' };
    }

    const docSnap = snapshot.docs[0];
    const data    = docSnap.data();

    // ── Device lock check ──
    // If key already has a device registered AND it's different from current device
    // then this key is being used on an unauthorized device
    const registeredDevice = data.device || '';
    const deviceLocked = registeredDevice !== '' &&
                         registeredDevice !== currentDeviceId;

    return {
      valid:        true,
      active:       data.active === true,
      deviceLocked: deviceLocked,
      docId:        docSnap.id,
      owner:        data.owner || '',
    };
  } catch (e) {
    return { valid: false, active: false, deviceLocked: false, docId: null, owner: '' };
  }
}

async function getDeviceId(): Promise<string> {
  try {
    const id = await Application.getAndroidId() ||
               Application.applicationId ||
               'unknown-device';
    return String(id);
  } catch {
    return 'unknown-device';
  }
}

export default function RegisterScreen() {
  const router = useRouter();
  const [key, setKey]         = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // Already registered → go to login
    const checkReg = async () => {
      try {
        const reg = await AsyncStorage.getItem(REG_KEY_STORE);
        if (reg) router.replace('/login');
      } catch {}
    };
    checkReg();
    getDeviceId().then(setDeviceId);
  }, []);

  const formatKeyInput = (text: string) => {
    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const parts = [];
    if (clean.length > 0)  parts.push(clean.substring(0, 5));
    if (clean.length > 5)  parts.push(clean.substring(5, 10));
    if (clean.length > 10) parts.push(clean.substring(10, 15));
    if (clean.length > 15) parts.push(clean.substring(15, 20));
    if (clean.length > 20) parts.push(clean.substring(20, 28));
    setKey(parts.join('-'));
  };

  const handleActivate = async () => {
    if (!key.trim()) {
      Alert.alert('Error', 'Please enter your registration key.');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Local SHA256 check (fast, offline)
      const localValid = await validateKeyLocally(key.trim());
      if (!localValid) {
        Alert.alert('Invalid Key ❌', 'This registration key is not valid.\nPlease check and try again.');
        setLoading(false);
        return;
      }

      // Step 2: Firebase check (online — is key active + device check)
      const firebaseResult = await validateKeyOnFirebase(key.trim(), deviceId);

      if (!firebaseResult.valid) {
        Alert.alert(
          'Key Not Found ❌',
          'This key is not registered in our system.\nPlease contact your administrator.'
        );
        setLoading(false);
        return;
      }

      if (!firebaseResult.active) {
        Alert.alert(
          'Access Revoked 🚫',
          'This registration key has been deactivated.\nPlease contact your administrator.'
        );
        setLoading(false);
        return;
      }

      if (firebaseResult.deviceLocked) {
        Alert.alert(
          'Device Not Authorised ❌',
          'This key is already registered on another device.\nEach key works on one device only.\nPlease contact your administrator for a new key.'
        );
        setLoading(false);
        return;
      }

      // Step 3: Save device ID to Firebase so admin can track
      if (firebaseResult.docId) {
        try {
          await updateDoc(doc(db, 'keys', firebaseResult.docId), {
            device:       deviceId,
            lastUsed:     new Date().toISOString(),
            activatedOn:  new Date().toISOString().split('T')[0],
          });
        } catch {}
      }

      // Step 4: Save registration locally
      const regData = {
        key:          key.trim().toUpperCase(),
        deviceId,
        owner:        firebaseResult.owner,
        registeredOn: new Date().toISOString().split('T')[0],
      };
      await AsyncStorage.setItem(REG_KEY_STORE, JSON.stringify(regData));

      Alert.alert(
        'Activated! ✅',
        `App successfully registered${firebaseResult.owner ? ` for ${firebaseResult.owner}` : ''}.\nEnjoy using AnjaarFinance!`,
        [{ text: 'Continue', onPress: () => router.replace('/login') }]
      );

    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🏦</Text>
          <Text style={styles.appName}>AnjaarFinance</Text>
          <Text style={styles.subtitle}>App Registration</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            This app requires a one-time registration key.{'\n'}
            Contact your administrator to get a key.
          </Text>
        </View>
        <Text style={styles.label}>Registration Key</Text>
        <TextInput
          style={styles.keyInput}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXXXXX"
          placeholderTextColor="#BBB"
          value={key}
          onChangeText={formatKeyInput}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={33}
        />
        <TouchableOpacity
          style={styles.activateBtn}
          onPress={handleActivate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.activateBtnText}>Activate App</Text>
          }
        </TouchableOpacity>
        <Text style={styles.footerText}>
          Each key works on one device only.{'\n'}
          Reinstalling requires a new key.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#EEF2F7', justifyContent: 'center', padding: 24 },
  card:            { backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 4 },
  logoBox:         { alignItems: 'center', marginBottom: 20 },
  logoIcon:        { fontSize: 48, marginBottom: 8 },
  appName:         { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  subtitle:        { fontSize: 13, color: '#999', marginTop: 2 },
  infoBox:         { backgroundColor: '#EEF2F7', borderRadius: 10, padding: 12, marginBottom: 20 },
  infoText:        { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 18 },
  label:           { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 8 },
  keyInput:        { borderWidth: 1.5, borderColor: '#1976D2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A2E', marginBottom: 20, backgroundColor: '#FAFAFA', letterSpacing: 1, textAlign: 'center', fontWeight: '600' },
  activateBtn:     { backgroundColor: '#1976D2', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  activateBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  footerText:      { fontSize: 10, color: '#BBB', textAlign: 'center', lineHeight: 16 },
});
