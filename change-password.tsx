import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'anjar123';
const CREDS_KEY = 'app_credentials';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [savedUsername, setSavedUsername] = useState(DEFAULT_USERNAME);
  const [savedPassword, setSavedPassword] = useState(DEFAULT_PASSWORD);

  useEffect(() => {
    AsyncStorage.getItem(CREDS_KEY).then(val => {
      if (val) {
        const creds = JSON.parse(val);
        setSavedUsername(creds.username || DEFAULT_USERNAME);
        setSavedPassword(creds.password || DEFAULT_PASSWORD);
        setNewUsername(creds.username || DEFAULT_USERNAME);
      } else {
        setNewUsername(DEFAULT_USERNAME);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    if (currentPassword !== savedPassword) {
      Alert.alert('Error', 'Current password is incorrect.');
      return;
    }
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    await AsyncStorage.setItem(CREDS_KEY, JSON.stringify({
      username: newUsername.trim(),
      password: newPassword,
    }));

    Alert.alert('Success ✅', 'Username and password updated!', [
      { text: 'OK', onPress: () => router.replace('/login') }
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>

          <Text style={styles.title}>🔐 Change Credentials</Text>
          <Text style={styles.subtitle}>Update your username and password</Text>

          {/* Current Password */}
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter current password"
              placeholderTextColor="#AAA"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
              <Text>{showCurrent ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* New Username */}
          <Text style={styles.label}>New Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new username"
            placeholderTextColor="#AAA"
            value={newUsername}
            onChangeText={setNewUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* New Password */}
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Min 6 characters"
              placeholderTextColor="#AAA"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
              <Text>{showNew ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Repeat new password"
              placeholderTextColor="#AAA"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
              <Text>{showConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#EEF2F7' },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card:         { backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 4 },
  title:        { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  subtitle:     { fontSize: 12, color: '#999', marginBottom: 24 },
  label:        { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  input:        { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#333', marginBottom: 16, backgroundColor: '#FAFAFA' },
  passwordRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eyeBtn:       { paddingHorizontal: 10 },
  divider:      { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  saveBtn:      { backgroundColor: '#1976D2', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveBtnText:  { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cancelLink:   { marginTop: 14, alignItems: 'center' },
  cancelText:   { fontSize: 12, color: '#888' },
});
