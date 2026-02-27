import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { MOCK_CONTRACTS } from './mockData';

// Interfaces
interface PaymentSchedule {
  sno: number;
  emi_amount: number;
  due_date: string;
  payment_received: number;
  date_received: string | null;
  delay_days: number;
}

interface LedgerEntry {
  date: string | null;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

interface FollowupEntry {
  sno: number;
  contacted_on: string | null;
  followup_date: string | null;
  user: string;
  reasons: string;
}

interface Contract {
  _id: string;
  contract_number: string;
  contract_date: string;
  status: string;
  customer_name: string;
  vehicle_number: string;
  file_number: string;
  company_name: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    photo: string | null;
  };
  guarantor: {
    name: string;
    phone: string;
    address: string;
    relation: string;
    photo: string | null;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    registration_number: string;
    chassis_number?: string;
    engine_number?: string;
    vin?: string;
    color: string;
  };
  loan: {
    loan_amount: number;
    interest_rate: number;
    tenure_months: number;
    emi_amount: number;
    total_amount: number;
    amount_paid: number;
    outstanding_amount: number;
  };
  payment_schedule: PaymentSchedule[];
  ledger?: LedgerEntry[];
  followup?: FollowupEntry[];
}

type TabType = 'people' | 'loan' | 'payments' | 'ledger' | 'followup';

export default function ContractDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const contractId = params.contractId as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('people');

  useEffect(() => {
    if (contractId) {
      fetchContractDetail();
    }
  }, [contractId]);

  const fetchContractDetail = async () => {
    try {
      // Try to load from external file first
      let contracts = MOCK_CONTRACTS;
      
      try {
        const externalPath = `${FileSystem.documentDirectory}app_data.json`;
        const fileInfo = await FileSystem.getInfoAsync(externalPath);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(externalPath);
          contracts = JSON.parse(content);
          console.log('Loaded from external file');
        }
      } catch (e) {
        console.log('Using bundled data');
      }
      
      const foundContract = contracts.find((c: any) => c._id === contractId);
      
      if (foundContract) {
        setContract(foundContract as Contract);
      } else {
        Alert.alert('Error', 'Contract not found');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contract');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live': return '#4CAF50';
      case 'seized': return '#F44336';
      default: return '#757575';
    }
  };

  const makePhoneCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const ImageModal = () => (
    <Modal visible={selectedImage !== null} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
      <View style={styles.imageModalOverlay}>
        <TouchableOpacity style={styles.imageModalClose} onPress={() => setSelectedImage(null)}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
        )}
      </View>
    </Modal>
  );

  // Tab Bar Component
  const TabBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'people' && styles.activeTab]} onPress={() => setActiveTab('people')}>
          <Ionicons name="people" size={18} color={activeTab === 'people' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'people' && styles.activeTabText]}>People</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tab, activeTab === 'loan' && styles.activeTab]} onPress={() => setActiveTab('loan')}>
          <Ionicons name="car" size={18} color={activeTab === 'loan' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'loan' && styles.activeTabText]}>Loan & Vehicle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tab, activeTab === 'payments' && styles.activeTab]} onPress={() => setActiveTab('payments')}>
          <Ionicons name="calendar" size={18} color={activeTab === 'payments' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>EMI</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tab, activeTab === 'ledger' && styles.activeTab]} onPress={() => setActiveTab('ledger')}>
          <Ionicons name="book" size={18} color={activeTab === 'ledger' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'ledger' && styles.activeTabText]}>Ledger</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tab, activeTab === 'followup' && styles.activeTab]} onPress={() => setActiveTab('followup')}>
          <Ionicons name="call" size={18} color={activeTab === 'followup' ? '#2196F3' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'followup' && styles.activeTabText]}>Follow-up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Tab 1: People (Customer & Guarantor)
  const PeopleTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Customer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.card}>
          {contract?.customer.photo ? (
            <TouchableOpacity onPress={() => setSelectedImage(contract.customer.photo)}>
              <Image source={{ uri: contract.customer.photo }} style={styles.photo} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="person" size={18} color="#666" />
            <Text style={styles.detailText}>{contract?.customer.name || 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.detailRow} onPress={() => makePhoneCall(contract?.customer.phone || '')}>
            <Ionicons name="call" size={18} color="#4CAF50" />
            <Text style={[styles.detailText, { color: '#4CAF50' }]}>{contract?.customer.phone || 'N/A'}</Text>
          </TouchableOpacity>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#666" />
            <Text style={styles.detailText}>{contract?.customer.address || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Guarantor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guarantor Details</Text>
        <View style={styles.card}>
          {contract?.guarantor.photo ? (
            <TouchableOpacity onPress={() => setSelectedImage(contract.guarantor.photo)}>
              <Image source={{ uri: contract.guarantor.photo }} style={styles.photo} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="person" size={18} color="#666" />
            <Text style={styles.detailText}>{contract?.guarantor.name || 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.detailRow} onPress={() => makePhoneCall(contract?.guarantor.phone || '')}>
            <Ionicons name="call" size={18} color="#4CAF50" />
            <Text style={[styles.detailText, { color: '#4CAF50' }]}>{contract?.guarantor.phone || 'N/A'}</Text>
          </TouchableOpacity>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={18} color="#666" />
            <Text style={styles.detailText}>{contract?.guarantor.address || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Tab 2: Loan & Vehicle
  const LoanVehicleTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Loan Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Details</Text>
        <View style={styles.card}>
          <View style={styles.loanGrid}>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Loan Amount</Text>
              <Text style={styles.loanValue}>₹{contract?.loan.loan_amount?.toLocaleString() || 0}</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Interest Rate</Text>
              <Text style={styles.loanValue}>{contract?.loan.interest_rate || 0}%</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Tenure</Text>
              <Text style={styles.loanValue}>{contract?.loan.tenure_months || 0} months</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>EMI Amount</Text>
              <Text style={styles.loanValue}>₹{contract?.loan.emi_amount?.toLocaleString() || 0}</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Total Amount</Text>
              <Text style={styles.loanValue}>₹{contract?.loan.total_amount?.toLocaleString() || 0}</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Amount Paid</Text>
              <Text style={[styles.loanValue, { color: '#4CAF50' }]}>₹{contract?.loan.amount_paid?.toLocaleString() || 0}</Text>
            </View>
            <View style={[styles.loanItem, { width: '100%' }]}>
              <Text style={styles.loanLabel}>Outstanding</Text>
              <Text style={[styles.loanValue, { color: '#F44336', fontSize: 18 }]}>₹{contract?.loan.outstanding_amount?.toLocaleString() || 0}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vehicle Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.card}>
          <View style={styles.vehicleHeader}>
            <Ionicons name="car" size={28} color="#2196F3" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.vehicleName}>{contract?.vehicle.make} {contract?.vehicle.model}</Text>
              <Text style={styles.vehicleReg}>{contract?.vehicle.registration_number}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="card" size={18} color="#666" />
            <Text style={styles.detailLabel}>Registration:</Text>
            <Text style={styles.detailValue}>{contract?.vehicle.registration_number || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="construct" size={18} color="#666" />
            <Text style={styles.detailLabel}>Chassis No:</Text>
            <Text style={styles.detailValue}>{contract?.vehicle.chassis_number || contract?.vehicle.vin || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cog" size={18} color="#666" />
            <Text style={styles.detailLabel}>Engine No:</Text>
            <Text style={styles.detailValue}>{contract?.vehicle.engine_number || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="color-palette" size={18} color="#666" />
            <Text style={styles.detailLabel}>Color:</Text>
            <Text style={styles.detailValue}>{contract?.vehicle.color || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Tab 3: Payment Schedule
  const PaymentsTab = () => (
    <ScrollView style={styles.tabContent} horizontal={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMI Schedule ({contract?.payment_schedule?.length || 0} installments)</Text>
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Due Date</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>EMI</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Received</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Delay</Text>
          </View>
          {contract?.payment_schedule?.map((payment, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>{payment.sno}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{payment.due_date || '-'}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{payment.emi_amount?.toLocaleString()}</Text>
              <Text style={[styles.tableCell, { flex: 1, color: payment.payment_received > 0 ? '#4CAF50' : '#999' }]}>
                {payment.payment_received > 0 ? `₹${payment.payment_received.toLocaleString()}` : '-'}
              </Text>
              <Text style={[styles.tableCell, { flex: 0.5, color: payment.delay_days > 0 ? '#F44336' : '#999' }]}>
                {payment.delay_days > 0 ? payment.delay_days : '-'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // Tab 4: Finance Ledger
  const LedgerTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Finance Ledger ({contract?.ledger?.length || 0} entries)</Text>
        {contract?.ledger && contract.ledger.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Particulars</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Debit</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Credit</Text>
            </View>
            {contract.ledger.map((entry, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 1 }]}>{entry.date || '-'}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={2}>{entry.particulars || '-'}</Text>
                <Text style={[styles.tableCell, { flex: 1, color: entry.debit > 0 ? '#F44336' : '#999' }]}>
                  {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: entry.credit > 0 ? '#4CAF50' : '#999' }]}>
                  {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No ledger entries found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // Tab 5: Collection Follow-up
  const FollowupTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collection Follow-up ({contract?.followup?.length || 0} records)</Text>
        {contract?.followup && contract.followup.length > 0 ? (
          contract.followup.map((entry, index) => (
            <View key={index} style={styles.followupCard}>
              <View style={styles.followupHeader}>
                <View style={styles.followupBadge}>
                  <Text style={styles.followupBadgeText}>#{entry.sno}</Text>
                </View>
                <Text style={styles.followupDate}>{entry.contacted_on || 'N/A'}</Text>
              </View>
              <View style={styles.followupRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.followupLabel}>Next Follow-up:</Text>
                <Text style={styles.followupValue}>{entry.followup_date || 'N/A'}</Text>
              </View>
              <View style={styles.followupRow}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.followupLabel}>User:</Text>
                <Text style={styles.followupValue}>{entry.user || 'N/A'}</Text>
              </View>
              <View style={styles.followupReasons}>
                <Text style={styles.followupReasonsLabel}>Reasons/Remarks:</Text>
                <Text style={styles.followupReasonsText}>{entry.reasons || 'No remarks'}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="call-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No follow-up records found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={styles.centerContainer}>
        <Text>Contract not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.contractHeader}>
          <Text style={styles.contractNumber}>{contract.contract_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
              {contract.status?.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.companyName}>{contract.company_name}</Text>
        <Text style={styles.contractDate}>Vehicle: {contract.vehicle_number}</Text>
      </View>

      <TabBar />

      {activeTab === 'people' && <PeopleTab />}
      {activeTab === 'loan' && <LoanVehicleTab />}
      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'ledger' && <LedgerTab />}
      {activeTab === 'followup' && <FollowupTab />}

      <ImageModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contractNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  companyName: { fontSize: 14, color: '#2196F3', marginTop: 4 },
  contractDate: { fontSize: 13, color: '#666', marginTop: 2 },
  tabBarScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 4 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2196F3' },
  tabText: { fontSize: 12, color: '#666' },
  activeTabText: { color: '#2196F3', fontWeight: '600' },
  tabContent: { flex: 1 },
  section: { padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', marginTop: 10, fontSize: 14 },
  photo: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 12 },
  photoPlaceholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  detailText: { fontSize: 14, color: '#333', flex: 1 },
  detailLabel: { fontSize: 13, color: '#666', marginLeft: 4, width: 90 },
  detailValue: { fontSize: 13, color: '#333', flex: 1 },
  loanGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  loanItem: { width: '50%', marginBottom: 14 },
  loanLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  loanValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  vehicleName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  vehicleReg: { fontSize: 13, color: '#666', marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#2196F3', padding: 8, borderRadius: 6 },
  tableHeaderCell: { color: '#fff', fontSize: 11, fontWeight: '600' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 11, color: '#333' },
  followupCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  followupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  followupBadge: { backgroundColor: '#2196F3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  followupBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  followupDate: { fontSize: 13, color: '#666' },
  followupRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  followupLabel: { fontSize: 12, color: '#666', width: 100 },
  followupValue: { fontSize: 12, color: '#333', flex: 1 },
  followupReasons: { marginTop: 8, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 6 },
  followupReasonsLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  followupReasonsText: { fontSize: 12, color: '#333' },
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: '90%', height: '70%' },
});
