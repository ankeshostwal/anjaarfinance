import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD_KEY = '@app_password';

export default function SettingsScreen() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [storedPass, setStoredPass] = useState('1234');

  useEffect(() => {
    loadPassword();
  }, []);

  const loadPassword = async () => {
    const saved = await AsyncStorage.getItem(PASSWORD_KEY);
    if (saved) setStoredPass(saved);
  };

  const changePassword = async () => {
    if (oldPass !== storedPass) {
      Alert.alert('Old password incorrect');
      return;
    }

    if (newPass !== confirmPass) {
      Alert.alert('Passwords do not match');
      return;
    }

    await AsyncStorage.setItem(PASSWORD_KEY, newPass);
    Alert.alert('Password Changed Successfully');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>

      <TextInput style={styles.input} secureTextEntry placeholder="Old Password" value={oldPass} onChangeText={setOldPass}/>
      <TextInput style={styles.input} secureTextEntry placeholder="New Password" value={newPass} onChangeText={setNewPass}/>
      <TextInput style={styles.input} secureTextEntry placeholder="Confirm Password" value={confirmPass} onChangeText={setConfirmPass}/>

      <TouchableOpacity style={styles.button} onPress={changePassword}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:30 },
  title:{ fontSize:22, fontWeight:'bold', marginBottom:20 },
  input:{ borderWidth:1, padding:12, borderRadius:8, marginBottom:15 },
  button:{ backgroundColor:'#4CAF50', padding:14, borderRadius:8 },
  buttonText:{ color:'#fff', textAlign:'center', fontWeight:'bold' }
});