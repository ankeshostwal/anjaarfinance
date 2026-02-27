import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_CONTRACTS } from './mockData';

const DATA_STORAGE_KEY = '@anjaar_contracts_data';
const DATA_TIMESTAMP_KEY = '@anjaar_data_timestamp';

interface ContractListItem {
  _id: string;
  contract_number: string;
  customer_name: string;
  vehicle_number: string;
  file_number: string;
  company_name: string;
  status: string;
  loan: {
    loan_amount: number;
    emi_amount: number;
    outstanding_amount: number;
  };
}

export default function ContractsScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    filterAndSortContracts();
  }, [contracts, searchQuery, statusFilter, companyFilter, sortBy]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      
      // Try to load from AsyncStorage first (imported data)
      const storedData = await AsyncStorage.getItem(DATA_STORAGE_KEY);
      const storedTimestamp = await AsyncStorage.getItem(DATA_TIMESTAMP_KEY);
      
      let contractsData: any[] = [];
      
      if (storedData) {
        contractsData = JSON.parse(storedData);
        setDataTimestamp(storedTimestamp);
        console.log('Loaded from imported data:', contractsData.length, 'contracts');
      } else {
        // Use bundled data
        contractsData = MOCK_CONTRACTS as any[];
        console.log('Loaded from bundled data:', contractsData.length, 'contracts');
      }
      
      setContracts(contractsData);
      
      // Extract unique companies
      const uniqueCompanies = [...new Set(contractsData.map((c: any) => c.company_name).filter(Boolean))];
      setCompanies(uniqueCompanies.sort());
      
    } catch (error) {
      console.error('Error loading contracts:', error);
      // Fallback to bundled data
      setContracts(MOCK_CONTRACTS as any[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const importFromFile = async () => {
    try {
      setImporting(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setImporting(false);
        return;
      }
      
      const file = result.assets[0];
      console.log('Selected file:', file.name);
      
      // Read the file
      const content = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(content);
      
      // Validate it's an array of contracts
      if (!Array.isArray(data)) {
        Alert.alert('Invalid File', 'The file does not contain valid contract data.');
        setImporting(false);
        return;
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
      const timestamp = new Date().toLocaleString();
      await AsyncStorage.setItem(DATA_TIMESTAMP_KEY, timestamp);
      
      setDataTimestamp(timestamp);
      setContracts(data);
      
      // Extract companies
      const uniqueCompanies = [...new Set(data.map((c: any) => c.company_name).filter(Boolean))];
      setCompanies(uniqueCompanies.sort());
      
      Alert.alert(
        'Import Successful!', 
        `Loaded ${data.length} contracts from ${file.name}`,
        [{ text: 'OK' }]
      );
      
      setShowImportModal(false);
      
    } catch (error: any) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error.message || 'Could not import the file.');
    } finally {
      setImporting(false);
    }
  };

  const resetToDefault = async () => {
    Alert.alert(
      'Reset Data',
      'This will remove imported data and use the default bundled data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(DATA_STORAGE_KEY);
            await AsyncStorage.removeItem(DATA_TIMESTAMP_KEY);
            setDataTimestamp(null);
            setContracts(MOCK_CONTRACTS as any[]);
            const uniqueCompanies = [...new Set((MOCK_CONTRACTS as any[]).map((c: any) => c.company_name).filter(Boolean))];
            setCompanies(uniqueCompanies.sort());
            setShowImportModal(false);
            Alert.alert('Reset Complete', 'Using default bundled data.');
          }
        }
      ]
    );
  };

  const filterAndSortContracts = useCallback(() => {
    let filtered = [...contracts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.customer_name?.toLowerCase().includes(query) ||
        c.vehicle_number?.toLowerCase().includes(query) ||
        c.file_number?.toLowerCase().includes(query) ||
        c.contract_number?.toLowerCase().includes(query) ||
        c.company_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(c => c.company_name === companyFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        case 'amount':
          return (b.loan?.outstanding_amount || 0) - (a.loan?.outstanding_amount || 0);
        case 'file':
          return (a.file_number || '').localeCompare(b.file_number || '');
        default:
          return (b.contract_number || '').localeCompare(a.contract_number || '');
      }
    });

    setFilteredContracts(filtered);
  }, [contracts, searchQuery, statusFilter, companyFilter, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    loadContracts();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live': return '#4CAF50';
      case 'seized': return '#F44336';
      default: return '#757575';
    }
  };

  const renderContract = ({ item, index }: { item: ContractListItem; index: number }) => (
    <TouchableOpacity
      style={styles.contractCard}
      onPress={() => router.push({ pathname: '/contract-detail', params: { contractId: item._id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.serialNo}>{index + 1}.</Text>
          <View>
            <Text style={styles.customerName} numberOfLines={1}>{item.customer_name || 'N/A'}</Text>
            <Text style={styles.vehicleNumber}>{item.vehicle_number}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="document-text-outline" size={14} color="#666" />
          <Text style={styles.detailText}>File: {item.file_number}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>{item.company_name || 'N/A'}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.outstandingLabel}>Outstanding:</Text>
        <Text style={[styles.outstandingAmount, { color: (item.loan?.outstanding_amount || 0) > 0 ? '#F44336' : '#4CAF50' }]}>
          ₹{(item.loan?.outstanding_amount || 0).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Import Modal
  const ImportModal = () => (
    <Modal visible={showImportModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.importModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import Data</Text>
            <TouchableOpacity onPress={() => setShowImportModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {dataTimestamp && (
            <View style={styles.currentDataInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.currentDataText}>
                Current data imported on: {dataTimestamp}
              </Text>
            </View>
          )}
          
          <Text style={styles.importInstructions}>
            Import your app_data.json file to update contracts without reinstalling the app.
          </Text>
          
          <TouchableOpacity 
            style={styles.importButton} 
            onPress={importFromFile}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="folder-open" size={24} color="#fff" />
                <Text style={styles.importButtonText}>Select JSON File</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.importHint}>
            Steps:{'\n'}
            1. Run SQL Converter on your PC{'\n'}
            2. Copy app_data.json to your phone{'\n'}
            3. Tap "Select JSON File" above{'\n'}
            4. Choose the app_data.json file
          </Text>
          
          {dataTimestamp && (
            <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
              <Ionicons name="refresh" size={20} color="#F44336" />
              <Text style={styles.resetButtonText}>Reset to Default Data</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal visible={showFilterModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterOptions}>
            {['all', 'live', 'seized'].map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterOption, statusFilter === status && styles.filterOptionActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterOptionText, statusFilter === status && styles.filterOptionTextActive]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Company</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterOption, companyFilter === 'all' && styles.filterOptionActive]}
              onPress={() => setCompanyFilter('all')}
            >
              <Text style={[styles.filterOptionText, companyFilter === 'all' && styles.filterOptionTextActive]}>All</Text>
            </TouchableOpacity>
            {companies.slice(0, 5).map(company => (
              <TouchableOpacity
                key={company}
                style={[styles.filterOption, companyFilter === company && styles.filterOptionActive]}
                onPress={() => setCompanyFilter(company)}
              >
                <Text style={[styles.filterOptionText, companyFilter === company && styles.filterOptionTextActive]} numberOfLines={1}>
                  {company}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.filterOptions}>
            {[
              { key: 'date', label: 'Latest' },
              { key: 'name', label: 'Name' },
              { key: 'amount', label: 'Amount' },
              { key: 'file', label: 'File No' },
            ].map(sort => (
              <TouchableOpacity
                key={sort.key}
                style={[styles.filterOption, sortBy === sort.key && styles.filterOptionActive]}
                onPress={() => setSortBy(sort.key)}
              >
                <Text style={[styles.filterOptionText, sortBy === sort.key && styles.filterOptionTextActive]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading contracts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with Import Button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Contracts</Text>
          <TouchableOpacity style={styles.importIconButton} onPress={() => setShowImportModal(true)}>
            <Ionicons name="cloud-upload" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          {filteredContracts.length} of {contracts.length} contracts
          {dataTimestamp && ' • Imported'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, vehicle, file..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options" size={22} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(statusFilter !== 'all' || companyFilter !== 'all') && (
        <View style={styles.activeFilters}>
          {statusFilter !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{statusFilter}</Text>
              <TouchableOpacity onPress={() => setStatusFilter('all')}>
                <Ionicons name="close" size={16} color="#2196F3" />
              </TouchableOpacity>
            </View>
          )}
          {companyFilter !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText} numberOfLines={1}>{companyFilter}</Text>
              <TouchableOpacity onPress={() => setCompanyFilter('all')}>
                <Ionicons name="close" size={16} color="#2196F3" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Contract List */}
      <FlatList
        data={filteredContracts}
        renderItem={renderContract}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No contracts found</Text>
          </View>
        }
      />

      <FilterModal />
      <ImportModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  importIconButton: { padding: 8 },
  searchContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 15, color: '#333' },
  filterButton: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, backgroundColor: '#fff', gap: 8 },
  activeFilterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, gap: 4 },
  activeFilterText: { fontSize: 12, color: '#2196F3', maxWidth: 100 },
  listContainer: { padding: 12 },
  contractCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  serialNo: { fontSize: 14, fontWeight: '600', color: '#666', marginRight: 8, width: 30 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },
  vehicleNumber: { fontSize: 13, color: '#2196F3', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600' },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  detailText: { fontSize: 12, color: '#666', flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  outstandingLabel: { fontSize: 12, color: '#666' },
  outstandingAmount: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 10, fontSize: 16, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  importModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterOptionActive: { backgroundColor: '#2196F3' },
  filterOptionText: { fontSize: 13, color: '#666' },
  filterOptionTextActive: { color: '#fff' },
  applyButton: { backgroundColor: '#2196F3', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  currentDataInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
  currentDataText: { fontSize: 13, color: '#333', flex: 1 },
  importInstructions: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  importButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2196F3', padding: 16, borderRadius: 10, gap: 10 },
  importButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  importHint: { fontSize: 13, color: '#666', marginTop: 20, lineHeight: 22, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, padding: 12, gap: 8 },
  resetButtonText: { color: '#F44336', fontSize: 14 },
});
