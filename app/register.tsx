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

const SECRET_SALT   = "ANJAARFINANCE2026ANKESH";
const REG_KEY_STORE = "registration_data";

async function sha256(text: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    text
  );
  return digest.toUpperCase();
}

async function validateKey(inputKey: string): Promise<boolean> {
  const parts = inputKey.trim().toUpperCase().split('-');
  if (parts.length !== 5) return false;
  const signature = parts[4];
  const rawKey    = parts.slice(0, 4).join('-');
  const combined  = rawKey + SECRET_SALT;
  const fullHash  = await sha256(combined);
  const expected  = fullHash.substring(0, 8);
  return signature === expected;
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
  const [key, setKey]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // ✅ Check if already registered — if so, skip straight to login
    const checkReg = async () => {
      try {
        const reg = await AsyncStorage.getItem(REG_KEY_STORE);
        if (reg) {
          router.replace('/login');
        }
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
      const isValid = await validateKey(key.trim());
      if (!isValid) {
        Alert.alert('Invalid Key ❌', 'This registration key is not valid.\nPlease check and try again.');
        setLoading(false);
        return;
      }
      const regData = {
        key:          key.trim().toUpperCase(),
        deviceId:     deviceId,
        registeredOn: new Date().toISOString().split('T')[0],
      };
      await AsyncStorage.setItem(REG_KEY_STORE, JSON.stringify(regData));
      Alert.alert(
        'Activated! ✅',
        'App successfully registered.\nEnjoy using AnjaarFinance!',
        [{ text: 'Continue', onPress: () => router.replace('/login') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
        <TouchableOpacity style={styles.activateBtn} onPress={handleActivate} disabled={loading} activeOpacity={0.8}>
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
