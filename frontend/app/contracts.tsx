import React, { useState, useEffect } from 'react';
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
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ContractListItem {
  id: string;
  contract_number: string;
  customer_name: string;
  vehicle_name: string;
  status: string;
  outstanding_amount: number;
  emi_amount: number;
  contract_date: string;
}

export default function ContractsScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    autoLogin();
  }, []);

  const autoLogin = async () => {
    try {
      console.log('autoLogin started');
      // Try to get existing token
      const storage = Platform.OS === 'web' ? localStorage : null;
      let existingToken = storage ? storage.getItem('auth_token') : null;
      
      console.log('Existing token:', existingToken ? 'found' : 'not found');
      
      if (!existingToken) {
        // Auto-login with demo credentials
        console.log('Attempting auto-login...');
        const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
          username: 'admin',
          password: 'admin123'
        });
        existingToken = response.data.access_token;
        console.log('Auto-login successful, token:', existingToken.substring(0, 20) + '...');
        if (storage) {
          storage.setItem('auth_token', existingToken);
          storage.setItem('username', 'admin');
        }
      }
      
      setToken(existingToken);
      fetchContracts(existingToken);
    } catch (error) {
      console.error('Auto-login error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    filterAndSortContracts();
  }, [searchQuery, statusFilter, sortBy, contracts]);

  const fetchContracts = async (authToken?: string | null) => {
    try {
      const tkn = authToken || token;
      const response = await axios.get(
        `${BACKEND_URL}/api/contracts`,
        {
          headers: tkn ? { Authorization: `Bearer ${tkn}` } : {},
          params: {
            search: searchQuery || undefined,
            status_filter: statusFilter !== 'all' ? statusFilter : undefined,
            sort_by: sortBy,
          }
        }
      );
      setContracts(response.data);
      setFilteredContracts(response.data);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortContracts = () => {
    let filtered = [...contracts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.customer_name.toLowerCase().includes(query) ||
        c.contract_number.toLowerCase().includes(query) ||
        c.vehicle_name.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.contract_date).getTime() - new Date(a.contract_date).getTime());
    } else if (sortBy === 'customer') {
      filtered.sort((a, b) => a.customer_name.localeCompare(b.customer_name));
    } else if (sortBy === 'amount') {
      filtered.sort((a, b) => b.outstanding_amount - a.outstanding_amount);
    }

    setFilteredContracts(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
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
            const storage = Platform.OS === 'web' ? localStorage : null;
            if (storage) {
              storage.removeItem('auth_token');
              storage.removeItem('username');
            }
            router.replace('/');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'overdue': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    return {
      ...styles.statusBadge,
      backgroundColor: getStatusColor(status) + '20',
    };
  };

  const getStatusTextStyle = (status: string) => {
    return {
      ...styles.statusText,
      color: getStatusColor(status),
    };
  };

  const renderContract = ({ item }: { item: ContractListItem }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => router.push({ pathname: '/contract-detail', params: { contractId: item.id } })}
    >
      <View style={styles.tableCell1}>
        <Text style={styles.cellText}>{item.contract_number}</Text>
      </View>
      <View style={styles.tableCell2}>
        <Text style={styles.cellText}>{item.customer_name}</Text>
      </View>
      <View style={styles.tableCell3}>
        <Text style={styles.cellText}>{item.vehicle_name}</Text>
      </View>
      <View style={styles.tableCell4}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.tableCell5}>
        <Text style={styles.cellTextAmount}>₹{item.emi_amount.toLocaleString()}</Text>
      </View>
      <View style={styles.tableCell6}>
        <Text style={[styles.cellTextAmount, styles.outstandingText]}>₹{item.outstanding_amount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status Filter</Text>
            <View style={styles.filterButtons}>
              {['all', 'active', 'completed', 'overdue'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    statusFilter === status && styles.filterButtonActive
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      statusFilter === status && styles.filterButtonTextActive
                    ]}
                  >
                    {status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.filterButtons}>
              {[
                { key: 'date', label: 'Date' },
                { key: 'customer', label: 'Customer' },
                { key: 'amount', label: 'Amount' },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.key}
                  style={[
                    styles.filterButton,
                    sortBy === sort.key && styles.filterButtonActive
                  ]}
                  onPress={() => setSortBy(sort.key)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      sortBy === sort.key && styles.filterButtonTextActive
                    ]}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contracts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}
        </Text>
        {statusFilter !== 'all' && (
          <View style={styles.activeFilterBadge}>
            <Text style={styles.activeFilterText}>{statusFilter}</Text>
          </View>
        )}
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={styles.tableCell1}>
            <Text style={styles.headerText}>Contract No</Text>
          </View>
          <View style={styles.tableCell2}>
            <Text style={styles.headerText}>Customer</Text>
          </View>
          <View style={styles.tableCell3}>
            <Text style={styles.headerText}>Vehicle</Text>
          </View>
          <View style={styles.tableCell4}>
            <Text style={styles.headerText}>Status</Text>
          </View>
          <View style={styles.tableCell5}>
            <Text style={styles.headerText}>EMI</Text>
          </View>
          <View style={styles.tableCell6}>
            <Text style={styles.headerText}>Outstanding</Text>
          </View>
        </View>

        <FlatList
          data={filteredContracts}
          renderItem={renderContract}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No contracts found</Text>
            </View>
          }
        />
      </View>

      <FilterModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tableCell1: {
    width: '15%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tableCell2: {
    width: '20%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tableCell3: {
    width: '20%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tableCell4: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCell5: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  tableCell6: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  cellText: {
    fontSize: 11,
    color: '#333',
  },
  cellTextAmount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  outstandingText: {
    color: '#F44336',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
