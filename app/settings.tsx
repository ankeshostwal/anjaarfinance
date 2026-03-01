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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDENTIALS_KEY = '@anjaar_credentials';

interface Credentials {
  username: string;
  password: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<Credentials>({ username: 'admin', password: 'admin123' });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const stored = await AsyncStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        const creds = JSON.parse(stored);
        setSavedCredentials(creds);
        setNewUsername(creds.username);
      } else {
        setNewUsername('admin');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleSave = async () => {
    // Validate current password
    if (currentPassword !== savedCredentials.password) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }

    // Validate new username
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    // Validate new password if provided
    if (newPassword) {
      if (newPassword.length < 4) {
        Alert.alert('Error', 'New password must be at least 4 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }
    }

    try {
      const newCredentials: Credentials = {
        username: newUsername.trim(),
        password: newPassword || savedCredentials.password,
      };

      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(newCredentials));
      setSavedCredentials(newCredentials);

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Success',
        'Credentials updated successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@anjaar_logged_in');
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleResetCredentials = () => {
    Alert.alert(
      'Reset Credentials',
      'This will reset login credentials to default (admin/admin123). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(CREDENTIALS_KEY);
            setSavedCredentials({ username: 'admin', password: 'admin123' });
            setNewUsername('admin');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            Alert.alert('Success', 'Credentials reset to default');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          {/* Change Credentials Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Login Credentials</Text>
            <View style={styles.card}>
              {/* Current Password */}
              <Text style={styles.inputLabel}>Current Password *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* New Username */}
              <Text style={styles.inputLabel}>New Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new username"
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              {/* New Password */}
              <Text style={styles.inputLabel}>New Password (leave blank to keep current)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-open-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Confirm New Password */}
              {newPassword.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Credentials Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Credentials</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username:</Text>
                <Text style={styles.infoValue}>{savedCredentials.username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Password:</Text>
                <Text style={styles.infoValue}>••••••••</Text>
              </View>
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.actionButton} onPress={handleResetCredentials}>
                <Ionicons name="refresh" size={20} color="#FF9800" />
                <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>Reset to Default Credentials</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#F44336" />
                <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Info</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>App Name:</Text>
                <Text style={styles.infoValue}>Anjaar Finance</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Version:</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1 },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10, textTransform: 'uppercase' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputLabel: { fontSize: 13, color: '#666', marginBottom: 6, marginTop: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  actionButtonText: { fontSize: 15, fontWeight: '500' },
  logoutButton: { borderBottomWidth: 0 },
});