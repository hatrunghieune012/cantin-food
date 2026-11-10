import { useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Action } from '../components/OperationsUI';
import OrdersPanel from '../components/OrdersPanel';
import CounterScreen from './CounterScreen';
import Interactive from '../components/Interactive';
import { colors, pageLayout } from '../styles/theme';

export default function StaffScreen({ token, name, onLogout }: { token: string; name: string; onLogout: () => void }) {
  const [tab, setTab] = useState('orders');
  const { width } = useWindowDimensions();
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab === 'orders') return false;
      setTab('orders'); return true;
    });
    return () => subscription.remove();
  }, [tab]);
  return <View style={styles.screen}>
    <View style={styles.header}><View style={[styles.headerInner, width >= 768 && { paddingHorizontal: 32 }]}>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.brand}>APP <Text style={{ color: colors.primary }}>CANTEEN</Text></Text>
        <Text style={styles.subtitle}>Nhân viên · {name}</Text></View>
      <Action onPress={onLogout}>Đăng xuất</Action>
    </View></View>
    <View style={[styles.navigation, width >= 768 && { paddingHorizontal: 32 }]} accessibilityRole="tablist">
      {[['orders', 'Đơn cần xử lý'], ['counter', 'Bán tại quầy'], ['cancelled', 'Đơn đã hủy']].map(([key, label]) =>
        <Interactive key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.active]}>
          <Text style={[styles.tabText, tab === key && { color: colors.primaryDark }]}>{label}</Text>
        </Interactive>)}
    </View>
    {tab === 'orders' && <ScrollView contentContainerStyle={[styles.content, width >= 768 && { paddingHorizontal: 32 }]}><OrdersPanel key="active" token={token} management staffView="active" title="Đơn cần xử lý" /></ScrollView>}
    {tab === 'counter' && <CounterScreen token={token} />}
    {tab === 'cancelled' && <ScrollView contentContainerStyle={[styles.content, width >= 768 && { paddingHorizontal: 32 }]}><OrdersPanel key="cancelled" token={token} management staffView="cancelled" title="Đơn khách đã hủy" /></ScrollView>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerInner: { ...pageLayout, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  brand: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 4, color: colors.muted, lineHeight: 20 },
  navigation: { ...pageLayout, flexDirection: 'row', gap: 8, paddingBottom: 8 },
  tab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 12, backgroundColor: colors.surface },
  active: { backgroundColor: colors.soft }, tabText: { fontWeight: '700', color: colors.muted, textAlign: 'center', lineHeight: 20 },
  content: { ...pageLayout, gap: 16 },
});
