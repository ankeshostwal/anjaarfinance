import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, ActivityIndicator, Modal,
  TextInput, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const DEFAULT_DATA  = require('./data/app_data.json');
const FILE_PATH_KEY = 'imported_data_path';
const DATA_FILE_URI = FileSystem.documentDirectory + 'app_data_imported.json';
const SETTINGS_KEY  = 'od_settings';
const SESSION_KEY   = 'user_session';

// ── Same MONTHS table used in contracts-list.tsx ──
const MONTHS: Record<string, number> = {
  Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
  Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11,
};

// Parses DD-MMM-YYYY e.g. "31-Oct-2025"
function parseDMY(dateStr: string): Date | null {
  try {
    const [d, m, y] = String(dateStr).split('-');
    const month = MONTHS[m];
    if (month === undefined) return null;
    const dt = new Date(parseInt(y), month, parseInt(d));
    return isNaN(dt.getTime()) ? null : dt;
  } catch { return null; }
}

export default function DashboardScreen() {
  const router = useRouter();

  const [contracts, setContracts]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);

  // OD Settings
  const [graceDays, setGraceDays]   = useState('3');
  const [roiPercent, setRoiPercent] = useState('2');
  const [tempGrace, setTempGrace]   = useState('3');
  const [tempRoi, setTempRoi]       = useState('2');

  // Followup data — only from LIVE contracts
  const [followups, setFollowups] = useState<any[]>([]);

  // Followup filters
  const [fromDate, setFromDate]                   = useState('');
  const [toDate, setToDate]                       = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedAgents, setSelectedAgents]       = useState<Set<string>>(new Set());

  useEffect(() => { loadAll(); }, []);

  // ── Only include followups from LIVE (unsettled) contracts ──
  const buildFollowups = (contractList: any[]) => {
    const all: any[] = [];
    contractList
      .filter((c: any) => c.status?.toLowerCase() === 'live')
      .forEach((c: any) => {
        (c.followup || []).forEach((f: any) => {
          all.push({
            ...f,
            customerName: c.customer_name,
            contractNo:   c.contract_number,
            fileNumber:   c.file_number,
            companyName:  c.company_name,
            agentName:    c.agent_name,
            phone:        c.customer?.phone || '',
          });
        });
      });
    all.sort((a, b) => (b.cont_date || '').localeCompare(a.cont_date || ''));
    return all;
  };

  const loadAll = async () => {
    try {
      let allContracts: any[] = [];

      const savedPath = await AsyncStorage.getItem(FILE_PATH_KEY);
      if (savedPath) {
        const fileInfo = await FileSystem.getInfoAsync(DATA_FILE_URI);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(DATA_FILE_URI);
          const parsed  = JSON.parse(content);
          allContracts  = parsed.contracts || [];
        } else {
          allContracts = DEFAULT_DATA.contracts || [];
        }
      } else {
        allContracts = DEFAULT_DATA.contracts || [];
      }

      setContracts(allContracts);
      setFollowups(buildFollowups(allContracts));

      // Load OD settings
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        setGraceDays(s.graceDays   || '3');
        setRoiPercent(s.roiPercent || '2');
      }

    } catch (e) {
      const fallback = DEFAULT_DATA.contracts || [];
      setContracts(fallback);
      setFollowups(buildFollowups(fallback));
    } finally {
      setLoading(false);
    }
  };

  // ─── Date / Stats ───
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const stats = useMemo(() => {
    let live = 0, seized = 0, overdueCount = 0;
    contracts.forEach(c => {
      const st = c.status?.toLowerCase();
      if (st === 'live')   live++;
      if (st === 'seized') seized++;
      // ── Overdue: unpaid EMI with due_date <= today using correct parseDMY ──
      const schedule = c.payment_schedule || [];
      const hasOverdue = schedule.some((p: any) => {
        if ((p.payment_received ?? 0) > 0 || !p.due_date) return false;
        const due = parseDMY(p.due_date);
        return due !== null && due <= today;
      });
      if (hasOverdue) overdueCount++;
    });
    return { live, seized, overdueCount };
  }, [contracts]);

  // ─── Followup filters ───
  const followupCompanies = useMemo(() => {
    return [...new Set(followups.map(f => f.companyName).filter(Boolean))] as string[];
  }, [followups]);

  const followupAgents = useMemo(() => {
    return [...new Set(followups.map(f => f.agentName).filter(Boolean))] as string[];
  }, [followups]);

  const filteredFollowups = useMemo(() => {
    let list = followups;

    if (fromDate.length === 10) {
      const [d, m, y] = fromDate.split('-');
      const from = new Date(+y, +m - 1, +d);
      list = list.filter(f => {
        if (!f.cont_date) return true;
        const parts = f.cont_date.split('-');
        if (parts.length !== 3) return true;
        const fd = new Date(+parts[2], +parts[1] - 1, +parts[0]);
        return fd >= from;
      });
    }
    if (toDate.length === 10) {
      const [d, m, y] = toDate.split('-');
      const to = new Date(+y, +m - 1, +d);
      list = list.filter(f => {
        if (!f.cont_date) return true;
        const parts = f.cont_date.split('-');
        if (parts.length !== 3) return true;
        const fd = new Date(+parts[2], +parts[1] - 1, +parts[0]);
        return fd <= to;
      });
    }
    if (selectedCompanies.size > 0) list = list.filter(f => selectedCompanies.has(f.companyName));
    if (selectedAgents.size > 0)    list = list.filter(f => selectedAgents.has(f.agentName));
    return list;
  }, [followups, fromDate, toDate, selectedCompanies, selectedAgents]);

  const toggleCompany = (c: string) => setSelectedCompanies(prev => {
    const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n;
  });
  const toggleAgent = (a: string) => setSelectedAgents(prev => {
    const n = new Set(prev); n.has(a) ? n.delete(a) : n.add(a); return n;
  });

  const saveSettings = async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({
      graceDays: tempGrace, roiPercent: tempRoi,
    }));
    setGraceDays(tempGrace);
    setRoiPercent(tempRoi);
    setShowSettings(false);
    Alert.alert('Saved ✅', 'OD Interest settings updated!');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    router.replace('/login');
  };

  // ─── FlatList renderItem for followup ───
  // Using useCallback to avoid re-renders that cause freezing
  const renderFollowup = useCallback(({ item: f }: { item: any }) => (
    <View style={styles.followupCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.followupName}>{f.customerName || f.customer_name}</Text>
        <Text style={styles.followupMeta}>
          {f.fileNumber || f.file_number} | {f.companyName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <Text style={styles.followupDate}>📅 {f.cont_date}</Text>
          {f.agentName ? <Text style={styles.followupAgent}>👤 {f.agentName}</Text> : null}
        </View>
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
  ), []);

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

        {/* ── TITLE ROW ── */}
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 28 }}>🏦</Text>
            <View>
              <Text style={styles.appTitle}>AnjaarFinance</Text>
              <Text style={styles.dateText}>{todayStr}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* ── STATS CARDS ── */}
        <View style={styles.statsRow}>
          <StatCard label="Live"    value={stats.live}         color="#2E7D32" icon="✅" />
          <StatCard label="Seized"  value={stats.seized}       color="#C62828" icon="🔒" />
          <StatCard label="Overdue" value={stats.overdueCount} color="#E65100" icon="⚠️" />
        </View>

        {/* ── QUICK ACCESS ── */}
        <Text style={styles.sectionHeading}>Quick Access</Text>
        <View style={styles.menuGrid}>
          <MenuBtn
            icon="📋" label="Agreements"
            onPress={() => router.push('/contracts-list')}
            color="#1976D2"
          />
          <MenuBtn
            icon="📞" label="Followup"
            onPress={() => setShowFollowup(true)}
            color="#2E7D32"
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

        {/* ── TOTAL CONTRACTS ── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Contracts</Text>
          <Text style={styles.totalValue}>{contracts.length}</Text>
        </View>

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
              style={styles.modalInput} value={tempGrace}
              onChangeText={setTempGrace} keyboardType="numeric" placeholder="e.g. 3"
            />
            <Text style={styles.modalLabel}>Rate of Interest (% per month)</Text>
            <TextInput
              style={styles.modalInput} value={tempRoi}
              onChangeText={setTempRoi} keyboardType="decimal-pad" placeholder="e.g. 2"
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

      {/* ══ FOLLOWUP MODAL ══
          KEY FIX: Using FlatList instead of ScrollView.map()
          ScrollView renders ALL items at once → freezes with 11000+ entries
          FlatList renders only visible items → smooth scrolling always        */}
      <Modal visible={showFollowup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.followupSheet}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📞 Collection Followup</Text>
              <TouchableOpacity onPress={() => setShowFollowup(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Date Range */}
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                placeholder="From DD-MM-YYYY"
                placeholderTextColor="#BBB"
                value={fromDate}
                onChangeText={setFromDate}
                maxLength={10}
              />
              <TextInput
                style={styles.dateInput}
                placeholder="To DD-MM-YYYY"
                placeholderTextColor="#BBB"
                value={toDate}
                onChangeText={setToDate}
                maxLength={10}
              />
              <TouchableOpacity
                style={styles.clearDateBtn}
                onPress={() => { setFromDate(''); setToDate(''); }}
              >
                <Text style={{ color: '#C62828', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Company Chips */}
            <View style={styles.chipRow}>
              <Text style={styles.chipRowLabel}>🏢</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {followupCompanies.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, selectedCompanies.has(c) && styles.chipActive]}
                    onPress={() => toggleCompany(c)}
                  >
                    <Text style={[styles.chipText, selectedCompanies.has(c) && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Agent Chips */}
            <View style={styles.chipRow}>
              <Text style={styles.chipRowLabel}>👤</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {followupAgents.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, selectedAgents.has(a) && styles.chipAgentActive]}
                    onPress={() => toggleAgent(a)}
                  >
                    <Text style={[styles.chipText, selectedAgents.has(a) && styles.chipTextActive]}>
                      {a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Entry Count */}
            <Text style={styles.entryCount}>{filteredFollowups.length} entries</Text>

            {/* ✅ FlatList — NOT ScrollView — prevents freeze with large data */}
            <FlatList
              data={filteredFollowups}
              keyExtractor={(_, i) => i.toString()}
              renderItem={renderFollowup}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No followup entries found.</Text>
                  <Text style={styles.emptyHint}>Import latest data from SQL to see followups.</Text>
                </View>
              }
            />

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Sub-components ───
const StatCard = ({ label, value, color, icon }: any) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuBtn = ({ icon, label, onPress, color, badge }: any) => (
  <TouchableOpacity style={[styles.menuBtn, { borderTopColor: color }]} onPress={onPress}>
    {badge ? (
      <View style={styles.menuBadge}>
        <Text style={styles.menuBadgeText}>{badge}</Text>
      </View>
    ) : null}
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F4F6F8' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:          { padding: 14, paddingBottom: 30 },

  titleRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  appTitle:        { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  dateText:        { fontSize: 11, color: '#999', marginTop: 2 },
  logoutBtn:       { backgroundColor: '#FFEBEE', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  logoutText:      { fontSize: 12, fontWeight: '600', color: '#C62828' },

  statsRow:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard:        { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2, borderTopWidth: 3 },
  statIcon:        { fontSize: 20, marginBottom: 4 },
  statValue:       { fontSize: 22, fontWeight: '700' },
  statLabel:       { fontSize: 10, color: '#888', marginTop: 2 },

  sectionHeading:  { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 10 },
  menuGrid:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  menuBtn:         { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, borderTopWidth: 3 },
  menuIcon:        { fontSize: 24, marginBottom: 6 },
  menuLabel:       { fontSize: 11, fontWeight: '600', color: '#333' },
  menuBadge:       { position: 'absolute', top: 6, right: 6, backgroundColor: '#C62828', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  menuBadgeText:   { color: '#FFF', fontSize: 9, fontWeight: '700' },

  totalCard:       { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:      { fontSize: 13, color: '#666' },
  totalValue:      { fontSize: 22, fontWeight: '700', color: '#1976D2' },

  // Followup modal — separate style so it fills most of the screen safely
  followupSheet:   { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 16, flex: 1, maxHeight: '92%' },

  dateRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dateInput:       { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, color: '#333', backgroundColor: '#FAFAFA' },
  clearDateBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
  chipRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  chipRowLabel:    { fontSize: 16, marginRight: 6, width: 24 },
  chip:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0', marginRight: 6 },
  chipActive:      { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  chipAgentActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText:        { fontSize: 11, color: '#555' },
  chipTextActive:  { color: '#FFF', fontWeight: '600' },
  entryCount:      { fontSize: 11, color: '#999', textAlign: 'right', marginBottom: 4 },

  followupCard:    { borderBottomWidth: 0.5, borderColor: '#EEE', paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  followupName:    { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  followupMeta:    { fontSize: 11, color: '#888' },
  followupDate:    { fontSize: 11, color: '#1976D2', fontWeight: '600' },
  followupAgent:   { fontSize: 11, color: '#555' },
  followupRemarks: { fontSize: 11, color: '#666', marginTop: 2, fontStyle: 'italic' },
  callBtn:         { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  callBtnText:     { fontSize: 12, color: '#2E7D32', fontWeight: '600' },

  emptyText:       { textAlign: 'center', color: '#999', marginTop: 10, fontSize: 13 },
  emptyBox:        { alignItems: 'center', marginTop: 20 },
  emptyHint:       { textAlign: 'center', color: '#BBB', marginTop: 6, fontSize: 11 },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle:      { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  modalSubtitle:   { fontSize: 11, color: '#999', marginBottom: 16 },
  modalLabel:      { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  modalInput:      { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#333', marginBottom: 14, backgroundColor: '#FAFAFA' },
  modalHint:       { fontSize: 11, color: '#999', marginBottom: 16, fontStyle: 'italic' },
  modalButtons:    { flexDirection: 'row', gap: 10 },
  cancelBtn:       { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  cancelBtnText:   { fontSize: 13, color: '#666' },
  saveBtn:         { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1976D2', alignItems: 'center' },
  saveBtnText:     { fontSize: 13, color: '#FFF', fontWeight: '600' },
  closeBtn:        { fontSize: 18, color: '#666' },
});
