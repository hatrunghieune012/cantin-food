import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Action, ui } from '../components/OperationsUI';
import OrdersPanel from '../components/OrdersPanel';
import CounterScreen from './CounterScreen';
import TablesScreen from './TablesScreen';

export default function StaffScreen({ token, name, onLogout }: { token: string; name: string; onLogout: () => void }) {
  const [tab, setTab] = useState('orders');
  return <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
    <View style={ui.page}><Text style={ui.title}>App Canteen · {name}</Text>
      <View style={ui.row}><Action onPress={() => setTab('orders')}>Đơn đặt trước</Action><Action onPress={() => setTab('counter')}>Bán tại quầy</Action><Action onPress={() => setTab('tables')}>Chỗ ngồi</Action><Action onPress={onLogout}>Đăng xuất</Action></View>
    </View>
    {tab === 'orders' && <ScrollView contentContainerStyle={ui.page}><OrdersPanel token={token} management /></ScrollView>}
    {tab === 'counter' && <CounterScreen token={token} />}
    {tab === 'tables' && <TablesScreen token={token} management />}
  </View>;
}
