import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

// ── CHANGE THESE TO YOUR PREFERRED LOGIN DETAILS ──
const APP_USERNAME = 'admin';
const APP_PASSWORD = 'anjar123';
// ──────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    if (username.trim() === APP_USERNAME && password === APP_PASSWORD) {
      router.replace('/');
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>

        {/* Logo / Title */}
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🏦</Text>
          <Text style={styles.appName}>Anjar Finance</Text>
          <Text style={styles.appSubtitle}>Vehicle Finance Contracts</Text>
        </View>

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          placeholderTextColor="#AAA"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Enter password"
            placeholderTextColor="#AAA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
            <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Login Button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#EEF2F7', justifyContent: 'center', padding: 24 },
  card:           { backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 4 },

  logoBox:        { alignItems: 'center', marginBottom: 28 },
  logoIcon:       { fontSize: 48, marginBottom: 8 },
  appName:        { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  appSubtitle:    { fontSize: 12, color: '#999', marginTop: 2 },

  label:          { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 13, color: '#333', marginBottom: 16, backgroundColor: '#FAFAFA',
  },
  passwordRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eyeBtn:         { paddingHorizontal: 10 },
  eyeIcon:        { fontSize: 18 },

  errorText:      { color: '#C62828', fontSize: 12, marginBottom: 12, textAlign: 'center' },

  loginBtn: {
    backgroundColor: '#1976D2', paddingVertical: 14,
    borderRadius: 10, alignItems: 'center', marginTop: 4,
  },
  loginBtnText:   { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
