import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const DEFAULT_DATA  = require('./data/app_data.json');
const FILE_PATH_KEY = 'imported_data_path';
const DATA_FILE_URI = FileSystem.documentDirectory + 'app_data_imported.json';

type SortType   = 'name' | 'fileno' | 'company';
type StatusType = 'all' | 'live' | 'seized' | 'closed';

const MONTHS: Record<string, number> = {
  Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
  Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11
};

function parseDMY(dateStr: string): Date | null {
  try {
    const [d, m, y] = dateStr.split('-');
    const month = MONTHS[m];
    if (month === undefined) return null;
    return new Date(parseInt(y), month, parseInt(d));
  } catch { return null; }
}

function calcOutstanding(contract: any): number {
  const schedule = contract.payment_schedule || [];
  const today = new Date();
  today.setHours(23, 59, 59, 0);
  return schedule
    .filter((p: any) => {
      if (p.payment_received && p.payment_received > 0) return false;
      if (!p.due_date) return false;
      const due = parseDMY(p.due_date);
      if (!due) return false;
      return due <= today;
    })
    .reduce((sum: number, p: any) => sum + (p.emi_amount || 0), 0);
}

// ✅ Returns all non-empty phone numbers for a person
function getPhones(person: any): string[] {
  if (!person) return [];
  return [person.phone, person.phone2, person.phone3]
    .filter((p: any) => p && String(p).trim() !== '');
}

export default function ContractsListScreen() {
  const router = useRouter();

  const [contracts, setContracts]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [importing, setImporting]   = useState(false);
  const [search, setSearch]         = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const [statusFilter, setStatusFilter]   = useState<StatusType>('live');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortBy, setSortBy]               = useState<SortType>('name');

  const [pendingStatus, setPendingStatus]   = useState<StatusType>('live');
  const [pendingCompany, setPendingCompany] = useState<string>('all');
  const [pendingSort, setPendingSort]       = useState<SortType>('name');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const savedPath = await AsyncStorage.getItem(FILE_PATH_KEY);
      if (savedPath) {
        const fileInfo = await FileSystem.getInfoAsync(DATA_FILE_URI);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(DATA_FILE_URI);
          const parsed  = JSON.parse(content);
          setContracts(parsed.contracts || []);
          setLoading(false);
          return;
        }
      }
      setContracts(DEFAULT_DATA.contracts || []);
    } catch (e) {
      setContracts(DEFAULT_DATA.contracts || []);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) { setImporting(false); return; }
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed  = JSON.parse(content);
      if (!parsed.contracts || !Array.isArray(parsed.contracts)) {
        Alert.alert('Invalid File', 'JSON must have a "contracts" array.');
        setImporting(false); return;
      }
      await FileSystem.copyAsync({ from: result.assets[0].uri, to: DATA_FILE_URI });
      await AsyncStorage.setItem(FILE_PATH_KEY, DATA_FILE_URI);
      setContracts(parsed.contracts);
      Alert.alert('Success ✅', `${parsed.contracts.length} contracts imported!`);
    } catch (e: any) {
      Alert.alert('Import Failed', e.message || 'Could not read file.');
    } finally {
      setImporting(false);
    }
  };

  const companies = useMemo(() => {
    const set = new Set(contracts.map((c: any) => c.company_name).filter(Boolean));
    return ['all', ...Array.from(set)] as string[];
  }, [contracts]);

  const filtered = useMemo(() => {
    let list = contracts;
    if (statusFilter !== 'all')
      list = list.filter(c => c.status?.toLowerCase() === statusFilter);
    if (companyFilter !== 'all')
      list = list.filter(c => c.company_name === companyFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.vehicle_number?.toLowerCase().includes(q) ||
        c.file_number?.toLowerCase().includes(q) ||
        c.contract_number?.toLowerCase().includes(q) ||
        // ✅ Search across all 3 phone numbers for both customer and guarantor
        c.customer?.phone?.includes(q)  ||
        c.customer?.phone2?.includes(q) ||
        c.customer?.phone3?.includes(q) ||
        c.guarantor?.phone?.includes(q) ||
        c.guarantor?.phone2?.includes(q)||
        c.guarantor?.phone3?.includes(q)
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'name':    sorted.sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || '')); break;
      case 'fileno':  sorted.sort((a, b) => (a.file_number   || '').localeCompare(b.file_number   || '')); break;
      case 'company': sorted.sort((a, b) => (a.company_name  || '').localeCompare(b.company_name  || '')); break;
    }
    return sorted;
  }, [contracts, statusFilter, companyFilter, sortBy, search]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live':   return '#2E7D32';
      case 'seized': return '#C62828';
      case 'closed': return '#616161';
      default:       return '#616161';
    }
  };

  const openFilter = () => {
    setPendingStatus(statusFilter);
    setPendingCompany(companyFilter);
    setPendingSort(sortBy);
    setShowFilter(true);
  };

  const applyFilters = () => {
    setStatusFilter(pendingStatus);
    setCompanyFilter(pendingCompany);
    setSortBy(pendingSort);
    setShowFilter(false);
  };

  const resetFilters = () => {
    setPendingStatus('all');
    setPendingCompany('all');
    setPendingSort('name');
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    companyFilter !== 'all',
    sortBy !== 'name',
  ].filter(Boolean).length;

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const outstanding    = calcOutstanding(item);
    const customerPhones = getPhones(item.customer);
    const guarantorPhones= getPhones(item.guarantor);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/contract-detail', params: { contract: JSON.stringify(item) } })}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <Text style={styles.serial}>{index + 1}.</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.vehicleText}>{item.vehicle_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📄 {item.file_number}</Text>
          <Text style={styles.metaText}>🏢 {item.company_name}</Text>
        </View>

        {/* ✅ Show all customer phone numbers */}
        {customerPhones.length > 0 && (
          <Text style={styles.phoneText}>👤 {customerPhones.join('  |  ')}</Text>
        )}

        {/* ✅ Show all guarantor phone numbers */}
        {guarantorPhones.length > 0 && (
          <Text style={styles.phoneText}>🤝 {guarantorPhones.join('  |  ')}</Text>
        )}

        <View style={styles.outstandingRow}>
          <Text style={styles.outstandingLabel}>Outstanding:</Text>
          <Text style={[styles.outstandingValue, { color: outstanding > 0 ? '#C62828' : '#2E7D32' }]}>
            ₹{outstanding.toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading contracts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.topHeader}>
        <View>
          <Text style={styles.title}>Contracts</Text>
          <Text style={styles.subtitle}>{filtered.length} of {contracts.length} contracts</Text>
        </View>
        <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={importing}>
          {importing
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Text style={styles.importBtnText}>⬆ Import</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Name, vehicle, file no, mobile..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: '#999', fontSize: 16, paddingHorizontal: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
          <Text style={styles.filterIcon}>⚙</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => item._id || String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No contracts found.</Text>}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={10}
        removeClippedSubviews={true}
      />

      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.chipRow}>
              {(['all', 'live', 'seized', 'closed'] as StatusType[]).map(s => (
                <TouchableOpacity key={s} style={[styles.chip, pendingStatus === s && styles.chipActive]} onPress={() => setPendingStatus(s)}>
                  <Text style={[styles.chipText, pendingStatus === s && styles.chipTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Company</Text>
            <View style={styles.chipRow}>
              {companies.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, pendingCompany === c && styles.chipActive]} onPress={() => setPendingCompany(c)}>
                  <Text style={[styles.chipText, pendingCompany === c && styles.chipTextActive]}>
                    {c === 'all' ? 'All' : c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.chipRow}>
              {([
                { key: 'name',    label: 'Name'    },
                { key: 'fileno',  label: 'File No' },
                { key: 'company', label: 'Company' },
              ] as { key: SortType; label: string }[]).map(opt => (
                <TouchableOpacity key={opt.key} style={[styles.chip, pendingSort === opt.key && styles.chipActive]} onPress={() => setPendingSort(opt.key)}>
                  <Text style={[styles.chipText, pendingSort === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F4F6F8' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E0E0E0' },
  title:            { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  subtitle:         { fontSize: 11, color: '#999', marginTop: 1 },
  importBtn:        { backgroundColor: '#1976D2', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  importBtnText:    { color: '#FFF', fontSize: 12, fontWeight: '600' },
  searchRow:        { flexDirection: 'row', alignItems: 'center', margin: 10, gap: 8 },
  searchBox:        { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, elevation: 2 },
  searchIcon:       { fontSize: 13, marginRight: 6 },
  searchInput:      { flex: 1, fontSize: 12, color: '#333' },
  filterBtn:        { backgroundColor: '#FFF', width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  filterIcon:       { fontSize: 18 },
  filterBadge:      { position: 'absolute', top: 4, right: 4, backgroundColor: '#1976D2', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText:  { color: '#FFF', fontSize: 9, fontWeight: '700' },
  list:             { paddingHorizontal: 10, paddingBottom: 20, paddingTop: 4 },
  emptyText:        { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 13 },
  card:             { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, elevation: 2 },
  cardRow:          { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  serial:           { fontSize: 12, color: '#999', marginRight: 6, marginTop: 1 },
  customerName:     { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  vehicleText:      { fontSize: 11, color: '#1976D2', marginTop: 1 },
  statusBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 6 },
  statusText:       { fontSize: 9, fontWeight: '700' },
  metaRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaText:         { fontSize: 10, color: '#777' },
  phoneText:        { fontSize: 11, color: '#444', marginBottom: 3 },
  outstandingRow:   { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderColor: '#EEE', paddingTop: 6, marginTop: 4 },
  outstandingLabel: { fontSize: 11, color: '#666' },
  outstandingValue: { fontSize: 13, fontWeight: '700' },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:       { fontSize: 16, fontWeight: '700' },
  modalClose:       { fontSize: 18, color: '#666' },
  filterLabel:      { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:             { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive:       { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  chipText:         { fontSize: 12, color: '#555' },
  chipTextActive:   { color: '#FFF', fontWeight: '600' },
  modalButtons:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  resetBtn:         { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  resetBtnText:     { fontSize: 13, color: '#666' },
  applyBtn:         { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1976D2', alignItems: 'center' },
  applyBtnText:     { fontSize: 13, color: '#FFF', fontWeight: '600' },
});
