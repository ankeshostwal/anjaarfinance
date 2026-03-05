import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const DEFAULT_DATA   = require('./data/app_data.json');
const FILE_PATH_KEY  = 'imported_data_path';
const DATA_FILE_URI  = FileSystem.documentDirectory + 'app_data_imported.json';
const SETTINGS_KEY   = 'od_settings';
const FOLLOWUP_KEY   = 'followup_entries';

export default function DashboardScreen() {
  const router = useRouter();

  const [contracts, setContracts]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);

  // OD Settings
  const [graceDays, setGraceDays]     = useState('3');
  const [roiPercent, setRoiPercent]   = useState('2');
  const [tempGrace, setTempGrace]     = useState('3');
  const [tempRoi, setTempRoi]         = useState('2');

  // Followup
  const [followups, setFollowups]         = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showAddFollowup, setShowAddFollowup]   = useState(false);
  const [promiseDate, setPromiseDate]           = useState('');
  const [searchFollowup, setSearchFollowup]     = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      // Load contracts
      const savedPath = await AsyncStorage.getItem(FILE_PATH_KEY);
      if (savedPath) {
        const fileInfo = await FileSystem.getInfoAsync(DATA_FILE_URI);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(DATA_FILE_URI);
          const parsed = JSON.parse(content);
          setContracts(parsed.contracts || []);
        } else {
          setContracts(DEFAULT_DATA.contracts || []);
        }
      } else {
        setContracts(DEFAULT_DATA.contracts || []);
      }

      // Load OD settings
      const settings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settings) {
        const s = JSON.parse(settings);
        setGraceDays(s.graceDays || '3');
        setRoiPercent(s.roiPercent || '2');
      }

      // Load followups from contract data (SQL imported)
      // Flatten all followup entries from all contracts
      const allContracts = parsed?.contracts || DEFAULT_DATA.contracts || [];
      const allFollowups: any[] = [];
      allContracts.forEach((c: any) => {
        (c.followup || []).forEach((f: any) => {
          allFollowups.push({
            ...f,
            customerName: c.customer_name,
            contractNo:   c.contract_number,
            phone:        c.customer?.phone || '',
            file_number:  c.file_number,
          });
        });
      });
      // Sort by cont_date descending
      allFollowups.sort((a, b) => (b.cont_date || '').localeCompare(a.cont_date || ''));
      setFollowups(allFollowups);

    } catch (e) {
      setContracts(DEFAULT_DATA.contracts || []);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // Stats
  const stats = useMemo(() => {
    let live = 0, seized = 0, overdueToday = 0, totalOutstanding = 0;

    contracts.forEach(c => {
      const status = c.status?.toLowerCase();
      if (status === 'live')   live++;
      if (status === 'seized') seized++;

      // Overdue: has unpaid EMI with due date <= today
      const schedule = c.payment_schedule || [];
      let hasOverdue = false;
      schedule.forEach((p: any) => {
        if (p.payment_received > 0) return;
        if (!p.due_date) return;
        try {
          const parts = p.due_date.split('-');
          const due = new Date(`${parts[1]} ${parts[0]} ${parts[2]}`);
          if (due <= today) {
            hasOverdue = true;
            totalOutstanding += p.emi_amount || 0;
          }
        } catch {}
      });
      if (hasOverdue) overdueToday++;
    });

    return { live, seized, overdueToday, totalOutstanding };
  }, [contracts]);

  // Followups due today
  const todayFollowups = useMemo(() => {
    const todayISO = today.toISOString().split('T')[0];
    return followups.filter(f => f.promiseDate === todayISO);
  }, [followups, today]);

  // Save OD settings
  const saveSettings = async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({
      graceDays: tempGrace,
      roiPercent: tempRoi,
    }));
    setGraceDays(tempGrace);
    setRoiPercent(tempRoi);
    setShowSettings(false);
    Alert.alert('Saved ✅', 'OD Interest settings updated!');
  };

  // Add followup
  const addFollowup = async () => {
    if (!selectedContract || !promiseDate) {
      Alert.alert('Error', 'Please select contract and promise date.');
      return;
    }
    const entry = {
      id:           Date.now().toString(),
      contractId:   selectedContract._id,
      contractNo:   selectedContract.contract_number,
      customerName: selectedContract.customer_name,
      phone:        selectedContract.customer?.phone || '',
      promiseDate,
      addedOn:      new Date().toISOString().split('T')[0],
    };
    const updated = [...followups, entry];
    setFollowups(updated);
    await AsyncStorage.setItem(FOLLOWUP_KEY, JSON.stringify(updated));
    setShowAddFollowup(false);
    setSelectedContract(null);
    setPromiseDate('');
    Alert.alert('Added ✅', 'Followup entry saved!');
  };

  const removeFollowup = async (id: string) => {
    const updated = followups.filter(f => f.id !== id);
    setFollowups(updated);
    await AsyncStorage.setItem(FOLLOWUP_KEY, JSON.stringify(updated));
  };

  const filteredContracts = useMemo(() => {
    if (!searchFollowup.trim()) return contracts.slice(0, 30);
    const q = searchFollowup.toLowerCase();
    return contracts.filter(c =>
      c.customer_name?.toLowerCase().includes(q) ||
      c.file_number?.toLowerCase().includes(q) ||
      c.vehicle_number?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [contracts, searchFollowup]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── APP TITLE ── */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.appTitle}>🏦 Anjar Finance</Text>
            <Text style={styles.dateText}>{todayStr}</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => {
            setTempGrace(graceDays);
            setTempRoi(roiPercent);
            setShowSettings(true);
          }}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* ── STATS CARDS ── */}
        <View style={styles.statsRow}>
          <StatCard label="Live" value={stats.live}         color="#2E7D32" icon="✅" />
          <StatCard label="Seized" value={stats.seized}     color="#C62828" icon="🔒" />
          <StatCard label="Overdue" value={stats.overdueToday} color="#E65100" icon="⚠️" />
        </View>

        {/* Outstanding */}
        <View style={styles.outstandingCard}>
          <Text style={styles.outstandingLabel}>Total Overdue Outstanding</Text>
          <Text style={styles.outstandingValue}>
            ₹{stats.totalOutstanding.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* ── MENU BUTTONS ── */}
        <Text style={styles.sectionHeading}>Quick Access</Text>

        <View style={styles.menuGrid}>
          <MenuBtn
            icon="📋" label="Agreements"
            onPress={() => router.push('/')}
            color="#1976D2"
          />
          <MenuBtn
            icon="📞" label="Followup"
            onPress={() => setShowFollowup(true)}
            color="#2E7D32"
            badge={todayFollowups.length > 0 ? todayFollowups.length : undefined}
          />
          <MenuBtn
            icon="📊" label="OD Settings"
            onPress={() => {
              setTempGrace(graceDays);
              setTempRoi(roiPercent);
              setShowSettings(true);
            }}
            color="#E65100"
          />
        </View>

        {/* ── TODAY'S FOLLOWUPS ── */}
        {todayFollowups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>📞 Today's Followup ({todayFollowups.length})</Text>
            {todayFollowups.map(f => (
              <View key={f.id} style={styles.followupCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.followupName}>{f.customerName}</Text>
                  <Text style={styles.followupMeta}>File: {f.contractNo}</Text>
                </View>
                <View style={styles.followupActions}>
                  {f.phone ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${f.phone}`)}
                    >
                      <Text style={styles.callBtnText}>📞 Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => removeFollowup(f.id)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ══ OD SETTINGS MODAL ══ */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>⚙ OD Interest Settings</Text>
            <Text style={styles.modalSubtitle}>
              These settings apply to the Interest tab in each contract.
            </Text>

            <Text style={styles.modalLabel}>Grace Period (days)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempGrace}
              onChangeText={setTempGrace}
              keyboardType="numeric"
              placeholder="e.g. 3"
            />

            <Text style={styles.modalLabel}>Rate of Interest (% per month)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempRoi}
              onChangeText={setTempRoi}
              keyboardType="decimal-pad"
              placeholder="e.g. 2"
            />

            <Text style={styles.modalHint}>
              Formula: EMI × ROI% × months delayed (after grace period)
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSettings(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══ FOLLOWUP MODAL ══ */}
      <Modal visible={showFollowup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📞 Collection Followup</Text>
              <TouchableOpacity onPress={() => setShowFollowup(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* View only — data from SQL */}
            <ScrollView style={{ marginTop: 10 }}>
              {followups.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No followup entries found.</Text>
                  <Text style={styles.emptyHint}>Import latest data from SQL to see followups.</Text>
                </View>
              ) : (
                followups.map((f: any, i: number) => (
                  <View key={i} style={styles.followupCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.followupName}>{f.customerName || f.customer_name}</Text>
                      <Text style={styles.followupMeta}>File: {f.contractNo || f.file_number}</Text>
                      <Text style={styles.followupDate}>📅 Promise: {f.promiseDate || f.cont_date}</Text>
                      {f.remarks ? <Text style={styles.followupRemarks}>{f.remarks}</Text> : null}
                    </View>
                    {f.phone ? (
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => Linking.openURL(`tel:${f.phone}`)}
                      >
                        <Text style={styles.callBtnText}>📞 Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add followup removed — view only from SQL data */}

    </SafeAreaView>
  );
}

const StatCard = ({ label, value, color, icon }: any) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuBtn = ({ icon, label, onPress, color, badge }: any) => (
  <TouchableOpacity style={[styles.menuBtn, { borderTopColor: color }]} onPress={onPress}>
    {badge ? <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{badge}</Text></View> : null}
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#F4F6F8' },
  center:                 { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:                 { padding: 14, paddingBottom: 30 },

  titleRow:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  appTitle:               { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  dateText:               { fontSize: 11, color: '#999', marginTop: 2 },
  settingsBtn:            { width: 40, height: 40, backgroundColor: '#FFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  settingsIcon:           { fontSize: 20 },

  statsRow:               { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statCard:               { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2, borderTopWidth: 3 },
  statIcon:               { fontSize: 20, marginBottom: 4 },
  statValue:              { fontSize: 22, fontWeight: '700' },
  statLabel:              { fontSize: 10, color: '#888', marginTop: 2 },

  outstandingCard:        { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 16, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  outstandingLabel:       { fontSize: 12, color: '#666' },
  outstandingValue:       { fontSize: 18, fontWeight: '700', color: '#C62828' },

  sectionHeading:         { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 10 },
  section:                { marginTop: 16 },

  menuGrid:               { flexDirection: 'row', gap: 8, marginBottom: 16 },
  menuBtn:                { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, borderTopWidth: 3 },
  menuIcon:               { fontSize: 24, marginBottom: 6 },
  menuLabel:              { fontSize: 11, fontWeight: '600', color: '#333' },
  menuBadge:              { position: 'absolute', top: 6, right: 6, backgroundColor: '#C62828', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  menuBadgeText:          { color: '#FFF', fontSize: 9, fontWeight: '700' },

  followupCard:           { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, flexDirection: 'row', alignItems: 'center' },
  followupName:           { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  followupMeta:           { fontSize: 11, color: '#888' },
  followupDate:           { fontSize: 11, color: '#1976D2', marginTop: 2 },
  followupActions:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callBtn:                { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  callBtnText:            { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  removeBtn:              { fontSize: 16, color: '#CCC', paddingHorizontal: 4 },

  emptyText:              { textAlign: 'center', color: '#999', marginTop: 10, fontSize: 13 },
  emptyBox:               { alignItems: 'center', marginTop: 20 },
  emptyHint:              { textAlign: 'center', color: '#BBB', marginTop: 6, fontSize: 11 },
  followupRemarks:        { fontSize: 11, color: '#888', marginTop: 3, fontStyle: 'italic' },

  addFollowupBtn:         { backgroundColor: '#1976D2', borderRadius: 10, padding: 12, alignItems: 'center' },
  addFollowupBtnText:     { color: '#FFF', fontWeight: '600', fontSize: 13 },

  contractPickItem:       { padding: 10, borderBottomWidth: 0.5, borderColor: '#EEE', borderRadius: 6 },
  contractPickItemActive: { backgroundColor: '#1976D2', borderRadius: 6 },
  contractPickText:       { fontSize: 12, color: '#333' },

  modalOverlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:             { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle:             { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  modalSubtitle:          { fontSize: 11, color: '#999', marginBottom: 16 },
  modalLabel:             { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  modalInput:             { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#333', marginBottom: 14, backgroundColor: '#FAFAFA' },
  modalHint:              { fontSize: 11, color: '#999', marginBottom: 16, fontStyle: 'italic' },
  modalButtons:           { flexDirection: 'row', gap: 10 },
  cancelBtn:              { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  cancelBtnText:          { fontSize: 13, color: '#666' },
  saveBtn:                { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1976D2', alignItems: 'center' },
  saveBtnText:            { fontSize: 13, color: '#FFF', fontWeight: '600' },
  closeBtn:               { fontSize: 18, color: '#666' },
});
