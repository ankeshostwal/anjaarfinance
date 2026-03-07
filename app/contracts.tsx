import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTRACTS_KEY = 'contracts_data';

export default function ContractsScreen() {
  const router = useRouter();

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadContracts = async () => {
    try {
      const val = await AsyncStorage.getItem(CONTRACTS_KEY);
      if (val) {
        const parsed = JSON.parse(val);
        const list = Array.isArray(parsed)
          ? parsed
          : parsed?.contracts || [];
        setContracts(list);
      } else {
        setContracts([]); // fresh install = empty list
      }
    } catch (e) {
      setContracts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const filteredContracts = useMemo(() => {
    if (!searchQuery) return contracts;
    const q = searchQuery.toLowerCase();
    return contracts.filter(c =>
      c.customer_name?.toLowerCase().includes(q) ||
      c.vehicle_number?.toLowerCase().includes(q) ||
      c.file_number?.toLowerCase().includes(q)
    );
  }, [contracts, searchQuery]);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'seized': return styles.statusSeized;
      case 'closed': return styles.statusClosed;
      case 'live':
      default:       return styles.statusLive;
    }
  };

  const renderItem = ({ item, index }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: '/contract-detail',
          params: { contractId: item._id },
        });
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.serial}>{index + 1}.</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.customer_name}</Text>
          <Text style={styles.vehicle}>{item.vehicle_number}</Text>
        </View>
        <Text style={[styles.status, getStatusStyle(item.status)]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.small}>
        File: {item.file_number} | {item.company_name}
      </Text>
      <Text style={styles.amount}>
        ₹{(item.loan?.outstanding_amount || 0).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Contracts</Text>

      <TextInput
        style={styles.search}
        placeholder="Search customer, vehicle, file..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {contracts.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: '#999', fontSize: 16 }}>No contracts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContracts}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadContracts();
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F4F6F8', paddingHorizontal: 12, paddingTop: 8 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title:        { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  search:       { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 12, fontSize: 14, elevation: 2 },
  card:         { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 10, elevation: 3 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  serial:       { fontWeight: 'bold', marginRight: 8, color: '#666' },
  name:         { fontSize: 15, fontWeight: 'bold', color: '#222' },
  vehicle:      { fontSize: 13, color: '#1976D2', marginTop: 2 },
  status:       { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, textTransform: 'uppercase' },
  statusLive:   { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  statusSeized: { backgroundColor: '#FFF9C4', color: '#8D6E00' },
  statusClosed: { backgroundColor: '#EEEEEE', color: '#555' },
  small:        { fontSize: 12, color: '#666', marginTop: 4 },
  amount:       { fontSize: 16, fontWeight: 'bold', marginTop: 8, color: '#D32F2F' },
});
