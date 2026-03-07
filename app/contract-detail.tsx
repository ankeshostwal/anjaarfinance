import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';

type TabType = 'client' | 'loan' | 'schedule' | 'ledger' | 'interest' | 'followup';
const { width } = Dimensions.get('window');

// ── PHOTOS: placed in DocumentDirectory/photos/ folder ──
const PHOTO_BASE = FileSystem.documentDirectory + 'photos/';

export default function ContractDetailScreen() {
  const params = useLocalSearchParams();
  const contractParam = params.contract as string;
  const [contract, setContract] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  // Late interest settings
  const [graceDays, setGraceDays]   = useState('3');
  const [roiPercent, setRoiPercent] = useState('2');
  const [showSettings, setShowSettings] = useState(false);
  const [tempGrace, setTempGrace]   = useState('3');
  const [tempRoi, setTempRoi]       = useState('2');

  // Photo URIs
  const [borrowerPhoto, setBorrowerPhoto] = useState<string | null>(null);
  const [guarantorPhoto, setGuarantorPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (contractParam) {
      try { setContract(JSON.parse(contractParam)); }
      catch (e) { console.log('Parse error:', e); }
    }
  }, [contractParam]);

  // Load photos — A{FlCode}.jpg same for borrower and guarantor
  useEffect(() => {
    if (!contract) return;
    const flCode = safe_str(contract.fl_code || '');
    if (!flCode) return;

    const photoUri = PHOTO_BASE + 'A' + flCode + '.jpg';
    FileSystem.getInfoAsync(photoUri).then(info => {
      if (info.exists) {
        setBorrowerPhoto(photoUri);
        setGuarantorPhoto(photoUri);  // same photo for both
      }
    });
  }, [contract]);

  const safe_str = (val: any) => (val == null ? '' : String(val).trim());

  const calculations = useMemo(() => {
    if (!contract) return null;
    const schedule = contract.payment_schedule || [];
    const totalDue      = schedule.reduce((s: number, p: any) => s + (p.emi_amount       || 0), 0);
    const totalReceived = schedule.reduce((s: number, p: any) => s + (p.payment_received || 0), 0);
    const totalDelay    = schedule.reduce((s: number, p: any) => s + (p.delay_days       || 0), 0);
    const emiPaid       = schedule.filter((p: any) => p.payment_received > 0).length;
    return { totalDue, totalReceived, totalDelay, emiPaid, emiRemaining: schedule.length - emiPaid };
  }, [contract]);

  // ── Late Interest Calculation ──
  const interestRows = useMemo(() => {
    if (!contract) return [];
    const schedule = contract.payment_schedule || [];
    const grace = parseInt(graceDays) || 0;
    const roi   = parseFloat(roiPercent) || 0;
    let totalInterest = 0;

    const rows = schedule.map((p: any) => {
      const delay   = p.delay_days || 0;
      const netDelay = Math.max(0, delay - grace);
      const months  = netDelay > 0 ? Math.ceil(netDelay / 30) : 0;
      const interest = months > 0 ? (p.emi_amount * roi / 100) * months : 0;
      totalInterest += interest;
      return {
        sno:        p.sno,
        emi:        p.emi_amount,
        delay,
        netDelay,
        months,
        interest:   Math.round(interest),
      };
    });

    return { rows, totalInterest: Math.round(totalInterest) };
  }, [contract, graceDays, roiPercent]);

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

  const openSettings = () => {
    setTempGrace(graceDays);
    setTempRoi(roiPercent);
    setShowSettings(true);
  };

  const applySettings = () => {
    setGraceDays(tempGrace);
    setRoiPercent(tempRoi);
    setShowSettings(false);
  };

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

      <View style={{ flex: 1 }}>
        <ScrollView style={styles.content}>

          {/* ════ CLIENT TAB ════ */}
          {activeTab === 'client' && (
            <View>
              {/* Borrower */}
              <View style={styles.card}>
                <View style={styles.photoRow}>
                  <View style={styles.photoBox}>
                    {borrowerPhoto
                      ? <Image source={{ uri: borrowerPhoto }} style={styles.photo} />
                      : <View style={styles.photoPlaceholder}><Text style={styles.photoIcon}>👤</Text><Text style={styles.photoHint}>No Photo</Text></View>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>👤 Borrower</Text>
                    <InfoRow label="Name"    value={contract.customer?.name} />
                    <InfoRow label="Father"  value={contract.customer?.father} />
                    <InfoRow label="Mobile 1" value={contract.customer?.phone}  highlight />
                    {contract.customer?.phone2 ? <InfoRow label="Mobile 2" value={contract.customer?.phone2} highlight /> : null}
                    {contract.customer?.phone3 ? <InfoRow label="Mobile 3" value={contract.customer?.phone3} highlight /> : null}
                  </View>
                </View>
                <InfoRow label="Address" value={contract.customer?.address} />
              </View>

              {/* Guarantor */}
              <View style={[styles.card, { marginTop: 8 }]}>
                <View style={styles.photoRow}>
                  <View style={styles.photoBox}>
                    {guarantorPhoto
                      ? <Image source={{ uri: guarantorPhoto }} style={styles.photo} />
                      : <View style={styles.photoPlaceholder}><Text style={styles.photoIcon}>👤</Text><Text style={styles.photoHint}>No Photo</Text></View>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>🤝 Guarantor</Text>
                    <InfoRow label="Name"    value={contract.guarantor?.name} />
                    <InfoRow label="Father"  value={contract.guarantor?.father} />
                    <InfoRow label="Mobile 1" value={contract.guarantor?.phone}  highlight />
                    {contract.guarantor?.phone2 ? <InfoRow label="Mobile 2" value={contract.guarantor?.phone2} highlight /> : null}
                    {contract.guarantor?.phone3 ? <InfoRow label="Mobile 3" value={contract.guarantor?.phone3} highlight /> : null}
                  </View>
                </View>
                <InfoRow label="Address" value={contract.guarantor?.address} />
              </View>

              {/* Vehicle */}
              <View style={[styles.card, { marginTop: 8 }]}>
                <Text style={styles.sectionTitle}>🚗 Vehicle</Text>
                <InfoRow label="Reg No"  value={contract.vehicle?.registration_number} />
                <InfoRow label="Make"    value={contract.vehicle?.make} />
                <InfoRow label="Model"   value={contract.vehicle?.model} />
                <InfoRow label="Chassis" value={contract.vehicle?.chassis_number} />
                <InfoRow label="Engine"  value={contract.vehicle?.engine_number} />
                <InfoRow label="Color"   value={contract.vehicle?.color} />
              </View>
            </View>
          )}

          {/* ════ LOAN TAB ════ */}
          {activeTab === 'loan' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>💰 Loan Details</Text>
              <InfoRow label="Loan Amount"   value={`₹${(contract.loan?.loan_amount || 0).toLocaleString('en-IN')}`} />
              <InfoRow label="Interest Rate" value={`${contract.loan?.interest_rate || 0}%`} />
              <InfoRow label="Tenure"        value={`${contract.loan?.tenure_months || 0} months`} />
              <InfoRow label="EMI Amount"    value={`₹${(contract.loan?.emi_amount || 0).toLocaleString('en-IN')}`} />
              <InfoRow label="Total Payable" value={`₹${(contract.loan?.total_amount || 0).toLocaleString('en-IN')}`} />
              <View style={styles.divider} />
              <InfoRow label="Amount Paid"   value={`₹${(contract.loan?.amount_paid || 0).toLocaleString('en-IN')}`} highlight />
              <InfoRow label="Outstanding"   value={`₹${(contract.loan?.outstanding_amount || 0).toLocaleString('en-IN')}`} highlight danger={(contract.loan?.outstanding_amount || 0) > 0} />
              <View style={styles.divider} />
              <InfoRow label="EMI Paid"      value={`${calculations.emiPaid} of ${schedule.length}`} />
              <InfoRow label="EMI Remaining" value={`${calculations.emiRemaining}`} />
            </View>
          )}

          {/* ════ SCHEDULE TAB ════ */}
          {activeTab === 'schedule' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📅 Payment Schedule</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableHeader}>
                    <HeaderCell text="No"       width={36} />
                    <HeaderCell text="Due Amt"  width={65} />
                    <HeaderCell text="Due Date" width={88} />
                    <HeaderCell text="Rec Amt"  width={65} />
                    <HeaderCell text="Rec Date" width={88} />
                    <HeaderCell text="Delay"    width={48} />
                    <HeaderCell text="Led Bal"  width={70} />
                  </View>
                  {(() => {
                    let cumDue = 0; let cumRec = 0;
                    return schedule.map((p: any, i: number) => {
                      cumDue += p.emi_amount || 0;
                      cumRec += p.payment_received || 0;
                      const ledBal = cumDue - cumRec;
                      let rowBg = i % 2 === 0 ? '#FAFAFA' : '#FFF';
                      if (p.payment_received > 0 && p.delay_days === 0) rowBg = '#E8F5E9';
                      if (p.payment_received > 0 && p.delay_days > 0)   rowBg = '#FFF8E1';
                      if (p.payment_received === 0 && p.delay_days > 0)  rowBg = '#FFEBEE';
                      return (
                        <View key={i} style={[styles.tableRow, { backgroundColor: rowBg }]}>
                          <Cell text={String(i + 1)}                    width={36}  center />
                          <Cell text={String(p.emi_amount      ?? '')}  width={65} />
                          <Cell text={String(p.due_date        ?? '')}  width={88}  center />
                          <Cell text={String(p.payment_received ?? '')} width={65} />
                          <Cell text={String(p.date_received   ?? '')}  width={88}  center />
                          <Cell text={String(p.delay_days      ?? '0')} width={48}  center />
                          <Cell text={String(ledBal)}                   width={70}  center bold={ledBal > 0} />
                        </View>
                      );
                    });
                  })()}
                  <View style={[styles.tableRow, styles.totalRow]}>
                    <Cell text="Total"                                                          width={36}  bold center />
                    <Cell text={String(calculations.totalDue)}                                  width={65}  bold />
                    <Cell text=""                                                                width={88} />
                    <Cell text={String(calculations.totalReceived)}                             width={65}  bold />
                    <Cell text=""                                                                width={88} />
                    <Cell text={String(calculations.totalDelay)}                                width={48}  bold center />
                    <Cell text={String(calculations.totalDue - calculations.totalReceived)}     width={70}  bold center />
                  </View>
                </View>
              </ScrollView>
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
              <Text style={styles.sectionTitle}>📒 Finance Ledger</Text>
              {!contract.ledger || contract.ledger.length === 0 ? (
                <Text style={styles.emptyTabText}>No ledger entries found.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={styles.tableHeader}>
                      <HeaderCell text="Date"      width={88} />
                      <HeaderCell text="Type"      width={44} />
                      <HeaderCell text="Voucher"   width={64} />
                      <HeaderCell text="Debit"     width={68} />
                      <HeaderCell text="Credit"    width={68} />
                      <HeaderCell text="Balance"   width={72} />
                      <HeaderCell text="Narration" width={130} />
                    </View>
                    {contract.ledger.map((l: any, i: number) => (
                      <View key={i} style={[styles.tableRow, {
                        backgroundColor: l.debit > 0 ? '#FFF8E1' : l.credit > 0 ? '#E8F5E9' : i % 2 === 0 ? '#FAFAFA' : '#FFF'
                      }]}>
                        <Cell text={String(l.voucher_date    ?? '')} width={88}  center />
                        <Cell text={String(l.voucher_type    ?? '')} width={44}  center />
                        <Cell text={String(l.voucher_no      ?? '')} width={64}  center />
                        <Cell text={l.debit  > 0 ? String(l.debit)  : '—'}      width={68} />
                        <Cell text={l.credit > 0 ? String(l.credit) : '—'}      width={68} />
                        <Cell text={String(l.running_balance ?? '')}             width={72}  bold />
                        <Cell text={String(l.narration       ?? '')}             width={130} />
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* ════ INTEREST TAB ════ */}
          {activeTab === 'interest' && (
            <View>
              {/* Settings Bar */}
              <View style={styles.interestSettingsBar}>
                <View style={styles.settingChip}>
                  <Text style={styles.settingLabel}>Grace</Text>
                  <Text style={styles.settingValue}>{graceDays} days</Text>
                </View>
                <View style={styles.settingChip}>
                  <Text style={styles.settingLabel}>ROI</Text>
                  <Text style={styles.settingValue}>{roiPercent}% / month</Text>
                </View>
                <TouchableOpacity style={styles.settingEditBtn} onPress={openSettings}>
                  <Text style={styles.settingEditText}>⚙ Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>📊 Late Payment Interest</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={styles.tableHeader}>
                      <HeaderCell text="No"       width={36} />
                      <HeaderCell text="EMI"      width={65} />
                      <HeaderCell text="Delay"    width={48} />
                      <HeaderCell text="Net Days" width={60} />
                      <HeaderCell text="Months"   width={52} />
                      <HeaderCell text="Interest" width={70} />
                    </View>
                    {(interestRows as any).rows?.map((r: any, i: number) => (
                      <View key={i} style={[styles.tableRow, { backgroundColor: r.interest > 0 ? '#FFF8E1' : i % 2 === 0 ? '#FAFAFA' : '#FFF' }]}>
                        <Cell text={String(r.sno)}      width={36}  center />
                        <Cell text={String(r.emi)}      width={65} />
                        <Cell text={String(r.delay)}    width={48}  center />
                        <Cell text={String(r.netDelay)} width={60}  center />
                        <Cell text={String(r.months)}   width={52}  center />
                        <Cell text={r.interest > 0 ? `₹${r.interest}` : '—'} width={70} center bold={r.interest > 0} />
                      </View>
                    ))}
                    <View style={[styles.tableRow, styles.totalRow]}>
                      <Cell text="Total" width={36}  bold center />
                      <Cell text=""      width={65} />
                      <Cell text=""      width={48} />
                      <Cell text=""      width={60} />
                      <Cell text=""      width={52} />
                      <Cell text={`₹${(interestRows as any).totalInterest}`} width={70} bold center />
                    </View>
                  </View>
                </ScrollView>

                {/* Summary */}
                <View style={styles.interestSummary}>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Outstanding</Text>
                    <Text style={[styles.summaryValue, { color: '#C62828' }]}>
                      ₹{(contract.loan?.outstanding_amount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Late Interest</Text>
                    <Text style={[styles.summaryValue, { color: '#E65100' }]}>
                      ₹{(interestRows as any).totalInterest?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Total Due</Text>
                    <Text style={[styles.summaryValue, { color: '#1A1A2E' }]}>
                      ₹{((contract.loan?.outstanding_amount || 0) + ((interestRows as any).totalInterest || 0)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ════ FOLLOWUP TAB ════ */}
          {activeTab === 'followup' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📞 Collection Follow Up</Text>
              {!contract.followup || contract.followup.length === 0 ? (
                <Text style={styles.emptyTabText}>No follow-up entries found. Import latest data to see entries.</Text>
              ) : (
                contract.followup.map((f: any, i: number) => (
                  <View key={i} style={[styles.card, { marginBottom: 6, backgroundColor: '#F9F9FF', elevation: 1 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1976D2' }}>
                        #{f.serial}  📅 {f.run_date}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#E65100', fontWeight: '600' }}>
                        Next: {f.cont_date}
                      </Text>
                    </View>
                    {f.remarks ? (
                      <Text style={{ fontSize: 11, color: '#444', lineHeight: 16 }}>{f.remarks}</Text>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#BBB' }}>No remarks</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

        </ScrollView>

        {/* ── BOTTOM TABS ── */}
        <View style={styles.bottomTabs}>
          {(['client', 'loan', 'schedule', 'ledger', 'interest', 'followup'] as TabType[]).map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
              <Text style={[styles.bottomTabText, activeTab === tab && styles.bottomActiveText]}>
                {tab === 'schedule' ? 'SCHED' : tab === 'interest' ? 'OD INT' : tab === 'followup' ? 'FOLLOW' : tab.toUpperCase()}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── INTEREST SETTINGS MODAL ── */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>⚙ Interest Settings</Text>

            <Text style={styles.modalLabel}>Grace Period (days)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempGrace}
              onChangeText={setTempGrace}
              keyboardType="numeric"
              placeholder="e.g. 3"
            />

            <Text style={styles.modalLabel}>Rate of Interest (% per month)</Text>
            <TextInput
              style={styles.modalInput}
              value={tempRoi}
              onChangeText={setTempRoi}
              keyboardType="decimal-pad"
              placeholder="e.g. 2"
            />

            <Text style={styles.modalHint}>
              Formula: (EMI × ROI% × months after grace) per instalment
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.resetBtn} onPress={() => setShowSettings(false)}>
                <Text style={styles.resetBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applySettings}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ── HELPERS ── */
const InfoRow = ({ label, value, highlight, danger }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && { fontWeight: '600', color: '#1A1A2E' }, danger && { color: '#C62828' }]}>
      {value || '—'}
    </Text>
  </View>
);

const HeaderCell = ({ text, width }: any) => (
  <Text style={[styles.headerCell, { width }]} numberOfLines={1}>{text}</Text>
);

const Cell = ({ text, width, center, bold }: any) => (
  <Text style={[styles.cell, { width }, center && { textAlign: 'center' }, bold && { fontWeight: '600' }]} numberOfLines={1}>
    {String(text ?? '')}
  </Text>
);

const LegendDot = ({ color, label }: any) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color, borderWidth: 0.5, borderColor: '#DDD' }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#F4F6F8' },
  center:               { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard:           { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 10, marginTop: 6, marginBottom: 4, borderRadius: 12, elevation: 2 },
  headerRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLine:           { fontSize: 12, fontWeight: '600', flex: 1, color: '#1A1A2E' },
  statusBadge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 6 },
  statusText:           { fontSize: 9, fontWeight: '700' },
  vehicle:              { marginTop: 3, fontSize: 11, color: '#1976D2', fontWeight: '500' },
  content:              { paddingHorizontal: 8, marginTop: 4 },
  card:                 { backgroundColor: '#FFF', padding: 12, borderRadius: 12, elevation: 2, marginBottom: 4 },
  sectionTitle:         { fontSize: 12, fontWeight: '700', marginBottom: 10, color: '#1A1A2E' },
  photoRow:             { flexDirection: 'row', gap: 10, marginBottom: 8 },
  photoBox:             { width: 80, height: 90 },
  photo:                { width: 80, height: 90, borderRadius: 8, resizeMode: 'cover' },
  photoPlaceholder:     { width: 80, height: 90, borderRadius: 8, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  photoIcon:            { fontSize: 24 },
  photoHint:            { fontSize: 9, color: '#999', marginTop: 2 },
  infoRow:              { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderColor: '#F0F0F0' },
  infoLabel:            { fontSize: 11, color: '#888', flex: 1 },
  infoValue:            { fontSize: 11, color: '#333', flex: 2, textAlign: 'right' },
  divider:              { height: 1, backgroundColor: '#EEE', marginVertical: 8 },
  tableHeader:          { flexDirection: 'row', backgroundColor: '#1976D2', paddingVertical: 4 },
  tableRow:             { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  totalRow:             { backgroundColor: '#E3F2FD' },
  headerCell:           { fontSize: 10, fontWeight: '600', color: '#FFF', textAlign: 'center' },
  cell:                 { fontSize: 10, paddingHorizontal: 2, textAlign: 'right' },
  legend:               { flexDirection: 'row', marginTop: 10, gap: 12, flexWrap: 'wrap' },
  legendItem:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:            { width: 12, height: 12, borderRadius: 3 },
  legendText:           { fontSize: 9, color: '#888' },
  emptyTabText:         { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20 },
  interestSettingsBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 6, elevation: 2, gap: 8 },
  settingChip:          { backgroundColor: '#EEF2F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  settingLabel:         { fontSize: 9, color: '#888' },
  settingValue:         { fontSize: 11, fontWeight: '700', color: '#1A1A2E' },
  settingEditBtn:       { marginLeft: 'auto' as any, backgroundColor: '#1976D2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  settingEditText:      { fontSize: 11, color: '#FFF', fontWeight: '600' },
  interestSummary:      { flexDirection: 'row', marginTop: 12, gap: 6 },
  summaryBox:           { flex: 1, backgroundColor: '#F4F6F8', borderRadius: 8, padding: 8, alignItems: 'center' },
  summaryLabel:         { fontSize: 9, color: '#888', marginBottom: 2 },
  summaryValue:         { fontSize: 12, fontWeight: '700' },
  bottomTabs:           { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#DDD' },
  tabBtn:               { alignItems: 'center', paddingHorizontal: 4 },
  bottomTabText:        { fontSize: 10, color: '#999' },
  bottomActiveText:     { color: '#1976D2', fontWeight: '700' },
  tabIndicator:         { height: 2, width: '100%', backgroundColor: '#1976D2', marginTop: 2, borderRadius: 2 },
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:           { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:           { fontSize: 16, fontWeight: '700', marginBottom: 16, color: '#1A1A2E' },
  modalLabel:           { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
  modalInput:           { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#333', marginBottom: 14, backgroundColor: '#FAFAFA' },
  modalHint:            { fontSize: 11, color: '#999', marginBottom: 16, fontStyle: 'italic' },
  modalButtons:         { flexDirection: 'row', gap: 10 },
  resetBtn:             { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  resetBtnText:         { fontSize: 13, color: '#666' },
  applyBtn:             { flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1976D2', alignItems: 'center' },
  applyBtnText:         { fontSize: 13, color: '#FFF', fontWeight: '600' },
});
