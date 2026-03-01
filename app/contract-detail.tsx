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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_CONTRACTS } from './mockData';

/* ================================
   INTERFACES
================================ */

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
  customer: any;
  guarantor: any;
  vehicle: any;
  loan: any;
  payment_schedule: PaymentSchedule[];
  ledger?: LedgerEntry[];
  followup?: FollowupEntry[];
}

type TabType = 'people' | 'loan' | 'payments' | 'ledger' | 'followup';

const DATA_STORAGE_KEY = '@anjaar_contracts_data';

/* ================================
   COMPONENT
================================ */

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

  /* ================================
     FETCH CONTRACT (FIXED)
  ================================= */

  const fetchContractDetail = async () => {
    try {
      let contracts: any[] = [];

      // 🔥 Load from AsyncStorage first (same source as list screen)
      const storedData = await AsyncStorage.getItem(DATA_STORAGE_KEY);

      if (storedData) {
        contracts = JSON.parse(storedData);
        console.log('Loaded from AsyncStorage:', contracts.length);
      } else {
        contracts = MOCK_CONTRACTS;
        console.log('Loaded from MOCK data');
      }

      const foundContract = contracts.find(
        (c: any) => c._id === contractId
      );

      if (foundContract) {
        setContract(foundContract);
      } else {
        Alert.alert('Error', 'Contract not found');
        router.back();
      }

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to load contract');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     HELPERS
  ================================= */

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'live': return '#4CAF50';
      case 'seized': return '#F44336';
      default: return '#757575';
    }
  };

  const makePhoneCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  /* ================================
     LOADING / EMPTY STATES
  ================================= */

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

  /* ================================
     UI
  ================================= */

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* HEADER */}
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

      {/* TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
        <View style={styles.tabBar}>
          {['people','loan','payments','ledger','followup'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as TabType)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* CONTENT */}
      <ScrollView style={styles.tabContent}>

        {activeTab === 'people' && (
          <>
            <Text style={styles.sectionTitle}>Customer</Text>
            <View style={styles.card}>
              <Text>{contract.customer?.name}</Text>
              <TouchableOpacity onPress={() => makePhoneCall(contract.customer?.phone)}>
                <Text style={{ color: '#4CAF50' }}>{contract.customer?.phone}</Text>
              </TouchableOpacity>
              <Text>{contract.customer?.address}</Text>
            </View>

            <Text style={styles.sectionTitle}>Guarantor</Text>
            <View style={styles.card}>
              <Text>{contract.guarantor?.name}</Text>
              <TouchableOpacity onPress={() => makePhoneCall(contract.guarantor?.phone)}>
                <Text style={{ color: '#4CAF50' }}>{contract.guarantor?.phone}</Text>
              </TouchableOpacity>
              <Text>{contract.guarantor?.address}</Text>
            </View>
          </>
        )}

        {activeTab === 'loan' && (
          <View style={styles.card}>
            <Text>Loan Amount: ₹{contract.loan?.loan_amount?.toLocaleString()}</Text>
            <Text>EMI: ₹{contract.loan?.emi_amount?.toLocaleString()}</Text>
            <Text>Outstanding: ₹{contract.loan?.outstanding_amount?.toLocaleString()}</Text>
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.card}>
            {contract.payment_schedule?.map((p, i) => (
              <Text key={i}>
                #{p.sno} | EMI ₹{p.emi_amount} | Due {p.due_date}
              </Text>
            ))}
          </View>
        )}

        {activeTab === 'ledger' && (
          <View style={styles.card}>
            {contract.ledger?.length
              ? contract.ledger.map((l, i) => (
                  <Text key={i}>
                    {l.date} | {l.particulars}
                  </Text>
                ))
              : <Text>No ledger entries</Text>}
          </View>
        )}

        {activeTab === 'followup' && (
          <View style={styles.card}>
            {contract.followup?.length
              ? contract.followup.map((f, i) => (
                  <Text key={i}>
                    {f.contacted_on} | {f.reasons}
                  </Text>
                ))
              : <Text>No follow-up records</Text>}
          </View>
        )}

      </ScrollView>

    </SafeAreaView>
  );
}

/* ================================
   STYLES
================================ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { backgroundColor: '#fff', padding: 16 },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  contractNumber: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  companyName: { fontSize: 14, color: '#2196F3', marginTop: 4 },
  contractDate: { fontSize: 13, color: '#666' },
  tabBarScroll: { backgroundColor: '#fff' },
  tabBar: { flexDirection: 'row', padding: 8 },
  tab: { padding: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2196F3' },
  tabText: { fontSize: 12, color: '#666' },
  activeTabText: { color: '#2196F3', fontWeight: '600' },
  tabContent: { padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginTop: 8 }
});