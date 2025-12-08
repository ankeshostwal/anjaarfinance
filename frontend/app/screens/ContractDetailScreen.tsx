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
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface PaymentSchedule {
  installment_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_date?: string;
}

interface Contract {
  id: string;
  contract_number: string;
  contract_date: string;
  status: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    photo: string;
  };
  guarantor: {
    name: string;
    phone: string;
    address: string;
    relation: string;
    photo: string;
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

export default function ContractDetailScreen({ route, navigation }: any) {
  const { contractId } = route.params;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { token, logout } = useAuth();

  useEffect(() => {
    fetchContractDetail();
  }, []);

  const fetchContractDetail = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/contracts/${contractId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContract(response.data);
    } catch (error: any) {
      console.error('Error fetching contract:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        await logout();
        navigation.replace('Login');
      } else {
        Alert.alert('Error', 'Failed to load contract details');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'overdue': return '#F44336';
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
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
      <ScrollView style={styles.scrollView}>
        {/* Contract Header */}
        <View style={styles.section}>
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

        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <View style={styles.card}>
            <View style={styles.loanGrid}>
              <View style={styles.loanItem}>
                <Text style={styles.loanLabel}>Loan Amount</Text>
                <Text style={styles.loanValue}>₹{contract.loan.loan_amount.toLocaleString()}</Text>
              </View>
              <View style={styles.loanItem}>
                <Text style={styles.loanLabel}>Interest Rate</Text>
                <Text style={styles.loanValue}>{contract.loan.interest_rate}%</Text>
              </View>
              <View style={styles.loanItem}>
                <Text style={styles.loanLabel}>Tenure</Text>
                <Text style={styles.loanValue}>{contract.loan.tenure_months} months</Text>
              </View>
              <View style={styles.loanItem}>
                <Text style={styles.loanLabel}>EMI Amount</Text>
                <Text style={styles.loanValue}>₹{contract.loan.emi_amount.toLocaleString()}</Text>
              </View>
              <View style={styles.loanItem}>
                <Text style={styles.loanLabel}>Total Amount</Text>
                <Text style={styles.loanValue}>₹{contract.loan.total_amount.toLocaleString()}</Text>
              </View>
              <View style={styles.loanItem}>
                <Text style={styles.loanLabel}>Amount Paid</Text>
                <Text style={[styles.loanValue, { color: '#4CAF50' }]}>₹{contract.loan.amount_paid.toLocaleString()}</Text>
              </View>
              <View style={styles.loanItem}>
                <Text style={styles.loanLabel}>Outstanding</Text>
                <Text style={[styles.loanValue, { color: '#F44336' }]}>₹{contract.loan.outstanding_amount.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setSelectedImage(contract.customer.photo)}>
              <Image
                source={{ uri: contract.customer.photo }}
                style={styles.photo}
              />
            </TouchableOpacity>
            <View style={styles.detailRow}>
              <Ionicons name="person" size={20} color="#666" />
              <Text style={styles.detailText}>{contract.customer.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.detailText}>{contract.customer.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.detailText}>{contract.customer.address}</Text>
            </View>
          </View>
        </View>

        {/* Guarantor Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guarantor Details</Text>
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setSelectedImage(contract.guarantor.photo)}>
              <Image
                source={{ uri: contract.guarantor.photo }}
                style={styles.photo}
              />
            </TouchableOpacity>
            <View style={styles.detailRow}>
              <Ionicons name="person" size={20} color="#666" />
              <Text style={styles.detailText}>{contract.guarantor.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.detailText}>Relation: {contract.guarantor.relation}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.detailText}>{contract.guarantor.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.detailText}>{contract.guarantor.address}</Text>
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
                  {contract.vehicle.make} {contract.vehicle.model}
                </Text>
                <Text style={styles.vehicleYear}>{contract.vehicle.year}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="card" size={20} color="#666" />
              <Text style={styles.detailText}>{contract.vehicle.registration_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="barcode" size={20} color="#666" />
              <Text style={styles.detailText}>VIN: {contract.vehicle.vin}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="color-palette" size={20} color="#666" />
              <Text style={styles.detailText}>Color: {contract.vehicle.color}</Text>
            </View>
          </View>
        </View>

        {/* Payment Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Schedule</Text>
          <View style={styles.card}>
            {contract.payment_schedule.map((payment, index) => (
              <View key={index} style={styles.paymentRow}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentNumber}>#{payment.installment_number}</Text>
                  <View>
                    <Text style={styles.paymentDate}>{payment.due_date}</Text>
                    {payment.paid_date && (
                      <Text style={styles.paidDate}>Paid: {payment.paid_date}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>₹{payment.amount.toLocaleString()}</Text>
                  <View style={[styles.paymentStatus, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                    <Text style={[styles.paymentStatusText, { color: getStatusColor(payment.status) }]}>
                      {payment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

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
  scrollView: {
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
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contractNumber: {
    fontSize: 24,
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
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
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
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
    width: 40,
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  paidDate: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
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
