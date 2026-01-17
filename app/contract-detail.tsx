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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CONTRACTS } from './mockData';

// Updated interface to match mockData structure
interface PaymentSchedule {
  sno: number;
  emi_amount: number;
  due_date: string;
  payment_received: number;
  date_received: string | null;
  delay_days: number;
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
    vin: string;
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
}

type TabType = 'people' | 'loan' | 'payments';

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
      console.log('Loading contract detail from mock data, ID:', contractId);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const foundContract = MOCK_CONTRACTS.find(c => c._id === contractId);
      
      if (foundContract) {
        console.log('Contract found:', foundContract.contract_number);
        setContract(foundContract as any);
      } else {
        console.error('Contract not found in mock data');
        Alert.alert('Error', 'Contract not found');
        router.back();
      }
    } catch (error: any) {
      console.error('Error loading contract:', error);
      Alert.alert('Error', 'Failed to load contract details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live': return '#4CAF50';
      case 'seized': return '#F44336';
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'overdue': return '#F44336';
      default: return '#757575';
    }
  };

  const ImageModal = () => (
    <Modal
      visible={selectedImage !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedImage(null)}
    >
      <View style={styles.imageModalOverlay}>
        <TouchableOpacity
          style={styles.imageModalClose}
          onPress={() => setSelectedImage(null)}
        >
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        {selectedImage && (
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );

  // Tab Components
  const TabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'people' && styles.activeTab]}
        onPress={() => setActiveTab('people')}
      >
        <Ionicons 
          name="people" 
          size={20} 
          color={activeTab === 'people' ? '#2196F3' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'people' && styles.activeTabText]}>
          People
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'loan' && styles.activeTab]}
        onPress={() => setActiveTab('loan')}
      >
        <Ionicons 
          name="car" 
          size={20} 
          color={activeTab === 'loan' ? '#2196F3' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'loan' && styles.activeTabText]}>
          Loan & Vehicle
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
        onPress={() => setActiveTab('payments')}
      >
        <Ionicons 
          name="calendar" 
          size={20} 
          color={activeTab === 'payments' ? '#2196F3' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>
          Payments
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Tab 1: Customer & Guarantor Details
  const PeopleTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Customer Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.card}>
          {contract?.customer.photo ? (
            <TouchableOpacity onPress={() => setSelectedImage(contract.customer.photo)}>
              <Image
                source={{ uri: contract.customer.photo }}
                style={styles.photo}
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={48} color="#999" />
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.detailText}>{contract?.customer.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={20} color="#666" />
            <Text style={styles.detailText}>{contract?.customer.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.detailText}>{contract?.customer.address}</Text>
          </View>
        </View>
      </View>

      {/* Guarantor Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guarantor Details</Text>
        <View style={styles.card}>
          {contract?.guarantor.photo ? (
            <TouchableOpacity onPress={() => setSelectedImage(contract.guarantor.photo)}>
              <Image
                source={{ uri: contract.guarantor.photo }}
                style={styles.photo}
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={48} color="#999" />
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.detailText}>{contract?.guarantor.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.detailText}>Relation: {contract?.guarantor.relation}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={20} color="#666" />
            <Text style={styles.detailText}>{contract?.guarantor.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.detailText}>{contract?.guarantor.address}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Tab 2: Loan & Vehicle Details
  const LoanVehicleTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Loan Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loan Details</Text>
        <View style={styles.card}>
          <View style={styles.loanGrid}>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Loan Amount</Text>
              <Text style={styles.loanValue}>₹{contract?.loan.loan_amount.toLocaleString()}</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Interest Rate</Text>
              <Text style={styles.loanValue}>{contract?.loan.interest_rate}%</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Tenure</Text>
              <Text style={styles.loanValue}>{contract?.loan.tenure_months} months</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>EMI Amount</Text>
              <Text style={styles.loanValue}>₹{contract?.loan.emi_amount.toLocaleString()}</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Total Amount</Text>
              <Text style={styles.loanValue}>₹{contract?.loan.total_amount.toLocaleString()}</Text>
            </View>
            <View style={styles.loanItem}>
              <Text style={styles.loanLabel}>Amount Paid</Text>
              <Text style={[styles.loanValue, { color: '#4CAF50' }]}>₹{contract?.loan.amount_paid.toLocaleString()}</Text>
            </View>
            <View style={[styles.loanItem, { width: '100%' }]}>
              <Text style={styles.loanLabel}>Outstanding</Text>
              <Text style={[styles.loanValue, { color: '#F44336', fontSize: 20 }]}>₹{contract?.loan.outstanding_amount.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vehicle Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.card}>
          <View style={styles.vehicleHeader}>
            <Ionicons name="car" size={32} color="#2196F3" />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.vehicleName}>
                {contract?.vehicle.make} {contract?.vehicle.model}
              </Text>
              <Text style={styles.vehicleYear}>{contract?.vehicle.year}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="card" size={20} color="#666" />
            <Text style={styles.detailText}>{contract?.vehicle.registration_number}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="barcode" size={20} color="#666" />
            <Text style={styles.detailText}>VIN: {contract?.vehicle.vin}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="color-palette" size={20} color="#666" />
            <Text style={styles.detailText}>Color: {contract?.vehicle.color}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Tab 3: Payment Schedule
  const PaymentsTab = () => (
    <ScrollView style={styles.tabContent} horizontal={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        <View style={styles.card}>
          {/* Table Header */}
          <View style={styles.paymentTableHeader}>
            <View style={styles.paymentCell1}>
              <Text style={styles.paymentHeaderText}>S.No</Text>
            </View>
            <View style={styles.paymentCell2}>
              <Text style={styles.paymentHeaderText}>EMI Amount</Text>
            </View>
            <View style={styles.paymentCell3}>
              <Text style={styles.paymentHeaderText}>Due Date</Text>
            </View>
            <View style={styles.paymentCell4}>
              <Text style={styles.paymentHeaderText}>Payment Received</Text>
            </View>
            <View style={styles.paymentCell5}>
              <Text style={styles.paymentHeaderText}>Date Received</Text>
            </View>
            <View style={styles.paymentCell6}>
              <Text style={styles.paymentHeaderText}>Delay (Days)</Text>
            </View>
          </View>

          {/* Table Rows */}
          {contract?.payment_schedule.map((payment, index) => {
            return (
              <View key={index} style={styles.paymentTableRow}>
                <View style={styles.paymentCell1}>
                  <Text style={styles.paymentCellText}>{payment.sno}</Text>
                </View>
                <View style={styles.paymentCell2}>
                  <Text style={styles.paymentCellText}>₹{payment.emi_amount.toLocaleString()}</Text>
                </View>
                <View style={styles.paymentCell3}>
                  <Text style={styles.paymentCellText}>{payment.due_date}</Text>
                </View>
                <View style={styles.paymentCell4}>
                  <Text style={styles.paymentCellText}>
                    {payment.payment_received > 0 ? `₹${payment.payment_received.toLocaleString()}` : '-'}
                  </Text>
                </View>
                <View style={styles.paymentCell5}>
                  <Text style={styles.paymentCellText}>
                    {payment.date_received || '-'}
                  </Text>
                </View>
                <View style={styles.paymentCell6}>
                  <Text style={[
                    styles.paymentCellText,
                    payment.delay_days > 0 && styles.delayText
                  ]}>
                    {payment.delay_days > 0 ? payment.delay_days : '-'}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Total Row */}
          <View style={styles.paymentTotalRow}>
            <View style={styles.paymentCell1}>
              <Text style={styles.paymentTotalText}>Total</Text>
            </View>
            <View style={styles.paymentCell2}>
              <Text style={styles.paymentTotalText}>
                ₹{contract?.payment_schedule.reduce((sum, p) => sum + p.emi_amount, 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.paymentCell3}>
              <Text style={styles.paymentTotalText}>-</Text>
            </View>
            <View style={styles.paymentCell4}>
              <Text style={styles.paymentTotalText}>
                ₹{contract?.payment_schedule
                  .reduce((sum, p) => sum + p.payment_received, 0)
                  .toLocaleString()}
              </Text>
            </View>
            <View style={styles.paymentCell5}>
              <Text style={styles.paymentTotalText}>-</Text>
            </View>
            <View style={styles.paymentCell6}>
              <Text style={styles.paymentTotalText}>
                {contract?.payment_schedule.reduce((sum, p) => sum + p.delay_days, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total EMIs</Text>
            <Text style={styles.summaryValue}>{contract?.payment_schedule.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>EMIs Paid</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {contract?.payment_schedule.filter(p => p.payment_received > 0).length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>EMIs Pending</Text>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {contract?.payment_schedule.filter(p => p.payment_received === 0).length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Delays</Text>
            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
              {contract?.payment_schedule.reduce((sum, p) => sum + p.delay_days, 0)} days
            </Text>
          </View>
        </View>
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
      {/* Contract Header */}
      <View style={styles.headerSection}>
        <View style={styles.contractHeader}>
          <Text style={styles.contractNumber}>{contract.contract_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
              {contract.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.contractDate}>Date: {contract.contract_date}</Text>
      </View>

      {/* Tab Bar */}
      <TabBar />

      {/* Tab Content */}
      {activeTab === 'people' && <PeopleTab />}
      {activeTab === 'loan' && <LoanVehicleTab />}
      {activeTab === 'payments' && <PaymentsTab />}

      <ImageModal />
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
  headerSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contractNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contractDate: {
    fontSize: 14,
    color: '#666',
  },
  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  // Tab Content
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Loan Grid
  loanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loanItem: {
    width: '50%',
    marginBottom: 16,
  },
  loanLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  loanValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Photo Styles
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    alignSelf: 'center',
  },
  photoPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Detail Row
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  // Vehicle Header
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleYear: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Payment Table Styles
  paymentTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  paymentTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  paymentCell1: {
    width: '8%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCell2: {
    width: '18%',
    justifyContent: 'center',
  },
  paymentCell3: {
    width: '20%',
    justifyContent: 'center',
  },
  paymentCell4: {
    width: '18%',
    justifyContent: 'center',
  },
  paymentCell5: {
    width: '20%',
    justifyContent: 'center',
  },
  paymentCell6: {
    width: '16%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentCellText: {
    fontSize: 10,
    color: '#333',
  },
  paymentTotalText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  delayText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  // Summary Card
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Image Modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: '90%',
    height: '70%',
  },
});
