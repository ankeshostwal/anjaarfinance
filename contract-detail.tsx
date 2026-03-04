import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

type TabType = 'client' | 'loan' | 'schedule' | 'ledger' | 'followup';
const { width } = Dimensions.get('window');

export default function ContractDetailScreen() {
  const params = useLocalSearchParams();
  const contractParam = params.contract as string;
  const [contract, setContract] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  useEffect(() => {
    if (contractParam) {
      try { setContract(JSON.parse(contractParam)); }
      catch (e) { console.log('Parse error:', e); }
    }
  }, [contractParam]);

  const calculations = useMemo(() => {
    if (!contract) return null;
    const schedule = contract.payment_schedule || [];
    const totalDue      = schedule.reduce((s: number, p: any) => s + (p.emi_amount       || 0), 0);
    const totalReceived = schedule.reduce((s: number, p: any) => s + (p.payment_received || 0), 0);
    const totalDelay    = schedule.reduce((s: number, p: any) => s + (p.delay_days       || 0), 0);
    const emiPaid       = schedule.filter((p: any) => p.payment_received > 0).length;
    return { totalDue, totalReceived, totalDelay, emiPaid, emiRemaining: schedule.length - emiPaid };
  }, [contract]);

  if (!contract || !calculations) {
    return <View style={styles.center}><Text>Loading contract...</Text></View>;
  }

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'live':   return '#2E7D32';
      case 'seized': return '#C62828';
      case 'closed': return '#616161';
      default:       return '#616161';
    }
  };

  const schedule = contract.payment_schedule || [];

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.headerLine} numberOfLines={1} ellipsizeMode="tail">
            {contract.contract_number} — {contract.company_name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
              {contract.status?.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.vehicle}>🚗 {contract.vehicle_number}</Text>
      </View>

      {/* ── CONTENT ── */}
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.content}>

          {/* ════ CLIENT TAB ════ */}
          {activeTab === 'client' && (
            <View>

              {/* Borrower */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>👤 Borrower</Text>
                <InfoRow label="Name"    value={contract.customer?.name} />
                <InfoRow label="Father"  value={contract.customer?.father} />
                <InfoRow label="Mobile"  value={contract.customer?.phone} highlight />
                <InfoRow label="Address" value={contract.customer?.address} />
              </View>

              {/* Guarantor */}
              <View style={[styles.card, { marginTop: 8 }]}>
                <Text style={styles.sectionTitle}>🤝 Guarantor</Text>
                <InfoRow label="Name"    value={contract.guarantor?.name} />
                <InfoRow label="Father"  value={contract.guarantor?.father} />
                <InfoRow label="Mobile"  value={contract.guarantor?.phone} highlight />
                <InfoRow label="Address" value={contract.guarantor?.address} />
              </View>

              {/* Vehicle */}
              <View style={[styles.card, { marginTop: 8 }]}>
                <Text style={styles.sectionTitle}>🚗 Vehicle</Text>
                <InfoRow label="Reg No"   value={contract.vehicle?.registration_number} />
                <InfoRow label="Make"     value={contract.vehicle?.make} />
                <InfoRow label="Model"    value={contract.vehicle?.model} />
                <InfoRow label="Chassis"  value={contract.vehicle?.chassis_number} />
                <InfoRow label="Engine"   value={contract.vehicle?.engine_number} />
                <InfoRow label="Color"    value={contract.vehicle?.color} />
              </View>

            </View>
          )}

          {/* ════ LOAN TAB ════ */}
          {activeTab === 'loan' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>💰 Loan Details</Text>
              <InfoRow label="Loan Amount"    value={`₹${(contract.loan?.loan_amount || 0).toLocaleString('en-IN')}`} />
              <InfoRow label="Interest Rate"  value={`${contract.loan?.interest_rate || 0}%`} />
              <InfoRow label="Tenure"         value={`${contract.loan?.tenure_months || 0} months`} />
              <InfoRow label="EMI Amount"     value={`₹${(contract.loan?.emi_amount || 0).toLocaleString('en-IN')}`} />
              <InfoRow label="Total Payable"  value={`₹${(contract.loan?.total_amount || 0).toLocaleString('en-IN')}`} />

              <View style={styles.divider} />

              <InfoRow label="Amount Paid"    value={`₹${(contract.loan?.amount_paid || 0).toLocaleString('en-IN')}`} highlight />
              <InfoRow
                label="Outstanding"
                value={`₹${(contract.loan?.outstanding_amount || 0).toLocaleString('en-IN')}`}
                highlight
                danger={(contract.loan?.outstanding_amount || 0) > 0}
              />

              <View style={styles.divider} />

              <InfoRow label="EMI Paid"       value={`${calculations.emiPaid} of ${schedule.length}`} />
              <InfoRow label="EMI Remaining"  value={`${calculations.emiRemaining}`} />
            </View>
          )}

          {/* ════ SCHEDULE TAB ════ */}
          {activeTab === 'schedule' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📅 Payment Schedule</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Header */}
                  <View style={styles.tableHeader}>
                    <HeaderCell text="No"      width={36} />
                    <HeaderCell text="Due Amt" width={65} />
                    <HeaderCell text="Due Date" width={88} />
                    <HeaderCell text="Rec Amt" width={65} />
                    <HeaderCell text="Rec Date" width={88} />
                    <HeaderCell text="Delay"   width={48} />
                  </View>

                  {/* Rows */}
                  {schedule.map((p: any, i: number) => {
                    let rowBg = i % 2 === 0 ? '#FAFAFA' : '#FFF';
                    if (p.payment_received > 0 && p.delay_days === 0) rowBg = '#E8F5E9'; // paid on time → green
                    if (p.payment_received > 0 && p.delay_days > 0)  rowBg = '#FFF8E1'; // paid late → yellow
                    if (p.payment_received === 0 && p.delay_days > 0) rowBg = '#FFEBEE'; // overdue → red
                    return (
                      <View key={i} style={[styles.tableRow, { backgroundColor: rowBg }]}>
                        <Cell text={String(i + 1)}                     width={36}  center />
                        <Cell text={String(p.emi_amount      ?? '')}   width={65} />
                        <Cell text={String(p.due_date        ?? '')}   width={88}  center />
                        <Cell text={String(p.payment_received ?? '')}  width={65} />
                        <Cell text={String(p.date_received   ?? '')}   width={88}  center />
                        <Cell text={String(p.delay_days      ?? '0')}  width={48}  center />
                      </View>
                    );
                  })}

                  {/* Totals */}
                  <View style={[styles.tableRow, styles.totalRow]}>
                    <Cell text="Total"                              width={36}  bold center />
                    <Cell text={String(calculations.totalDue)}      width={65}  bold />
                    <Cell text=""                                    width={88} />
                    <Cell text={String(calculations.totalReceived)}  width={65}  bold />
                    <Cell text=""                                    width={88} />
                    <Cell text={String(calculations.totalDelay)}     width={48}  bold center />
                  </View>
                </View>
              </ScrollView>

              {/* Legend */}
              <View style={styles.legend}>
                <LegendDot color="#E8F5E9" label="Paid on time" />
                <LegendDot color="#FFF8E1" label="Paid late" />
                <LegendDot color="#FFEBEE" label="Overdue" />
              </View>
            </View>
          )}

          {/* ════ LEDGER TAB ════ */}
          {activeTab === 'ledger' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📒 Ledger</Text>
              <Text style={styles.emptyTabText}>
                {contract.ledger?.length > 0 ? '' : 'No ledger entries found.'}
              </Text>
            </View>
          )}

          {/* ════ FOLLOWUP TAB ════ */}
          {activeTab === 'followup' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📞 Follow Up</Text>
              <Text style={styles.emptyTabText}>
                {contract.followup?.length > 0 ? '' : 'No follow-up entries found.'}
              </Text>
            </View>
          )}

        </ScrollView>

        {/* ── BOTTOM TABS ── */}
        <View style={styles.bottomTabs}>
          {(['client', 'loan', 'schedule', 'ledger', 'followup'] as TabType[]).map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
              <Text style={[styles.bottomTabText, activeTab === tab && styles.bottomActiveText]}>
                {tab.toUpperCase()}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </SafeAreaView>
  );
}

/* ── HELPER COMPONENTS ── */

const InfoRow = ({ label, value, highlight, danger }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[
      styles.infoValue,
      highlight && { fontWeight: '600', color: '#1A1A2E' },
      danger    && { color: '#C62828' },
    ]}>
      {value || '—'}
    </Text>
  </View>
);

const HeaderCell = ({ text, width }: any) => (
  <Text style={[styles.headerCell, { width }]} numberOfLines={1}>{text}</Text>
);

const Cell = ({ text, width, center, bold }: any) => (
  <Text
    style={[styles.cell, { width }, center && { textAlign: 'center' }, bold && { fontWeight: '600' }]}
    numberOfLines={1}
  >
    {String(text ?? '')}
  </Text>
);

const LegendDot = ({ color, label }: any) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color, borderWidth: 0.5, borderColor: '#DDD' }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

/* ── STYLES ── */
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F4F6F8' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerCard:       { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 10, marginTop: 6, marginBottom: 4, borderRadius: 12, elevation: 2 },
  headerRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLine:       { fontSize: 12, fontWeight: '600', flex: 1, color: '#1A1A2E' },
  statusBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 6 },
  statusText:       { fontSize: 9, fontWeight: '700' },
  vehicle:          { marginTop: 3, fontSize: 11, color: '#1976D2', fontWeight: '500' },

  content:          { paddingHorizontal: 8, marginTop: 4 },
  card:             { backgroundColor: '#FFF', padding: 12, borderRadius: 12, elevation: 2 },
  sectionTitle:     { fontSize: 12, fontWeight: '700', marginBottom: 10, color: '#1A1A2E' },

  infoRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderColor: '#F0F0F0' },
  infoLabel:        { fontSize: 11, color: '#888', flex: 1 },
  infoValue:        { fontSize: 11, color: '#333', flex: 2, textAlign: 'right' },

  divider:          { height: 1, backgroundColor: '#EEE', marginVertical: 8 },

  tableHeader:      { flexDirection: 'row', backgroundColor: '#1976D2', paddingVertical: 4 },
  tableRow:         { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  totalRow:         { backgroundColor: '#E3F2FD' },
  headerCell:       { fontSize: 10, fontWeight: '600', color: '#FFF', textAlign: 'center' },
  cell:             { fontSize: 10, paddingHorizontal: 2, textAlign: 'right' },

  legend:           { flexDirection: 'row', marginTop: 10, gap: 12, flexWrap: 'wrap' },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:        { width: 12, height: 12, borderRadius: 3 },
  legendText:       { fontSize: 9, color: '#888' },

  emptyTabText:     { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20 },

  bottomTabs:       { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#DDD' },
  tabBtn:           { alignItems: 'center', paddingHorizontal: 4 },
  bottomTabText:    { fontSize: 10, color: '#999' },
  bottomActiveText: { color: '#1976D2', fontWeight: '700' },
  tabIndicator:     { height: 2, width: '100%', backgroundColor: '#1976D2', marginTop: 2, borderRadius: 2 },
});
