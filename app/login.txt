import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_CREDENTIALS } from './mockData';

const CREDENTIALS_KEY = '@anjaar_credentials';
const LOGGED_IN_KEY = '@anjaar_logged_in';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loggedIn = await AsyncStorage.getItem(LOGGED_IN_KEY);
      if (loggedIn === 'true') {
        router.replace('/contracts');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      // Get saved credentials or use default
      let validCredentials = MOCK_CREDENTIALS;
      const stored = await AsyncStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        validCredentials = JSON.parse(stored);
      }

      // Validate credentials
      if (username === validCredentials.username && password === validCredentials.password) {
        await AsyncStorage.setItem(LOGGED_IN_KEY, 'true');
        router.replace('/contracts');
      } else {
        Alert.alert('Error', 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="business" size={50} color="#2196F3" />
          </View>
          <Text style={styles.appName}>Anjaar Finance</Text>
          <Text style={styles.appTagline}>Contract Management System</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.signInText}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.defaultCredentials}>
            Default: admin / admin123
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  appTagline: { fontSize: 14, color: '#666', marginTop: 4 },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  signInText: { fontSize: 14, color: '#666', marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  defaultCredentials: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 16,
  },
});