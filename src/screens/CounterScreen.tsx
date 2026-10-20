import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { request, requestKey } from '../api';
import { dinhDangGia } from '../data/foods';
import { Action, Field, ui } from '../components/OperationsUI';
import OrdersPanel from '../components/OrdersPanel';
interface Food { id: number; name: string; price: number; stock_quantity: number }

export default function CounterScreen({ token }: { token: string }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);
  const key = useRef(requestKey());
  async function load() {
    try { const data = await request('/api/foods', token); setFoods(data.foods); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải món.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token]);
  function change(id: number, delta: number) {
    if (busy) return;
    setCart(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
    key.current = requestKey(); setConfirmed(false); setSuccess('');
  }
  const items = foods.filter(food => cart[food.id] > 0);
  const total = items.reduce((sum, food) => sum + Number(food.price) * cart[food.id], 0);
  async function sell() {
    setBusy(true); setError('');
    try {
      const data = await request('/api/orders', token, { method: 'POST', body: JSON.stringify({
        orderType: 'counter', paymentMethod: 'cash', requestKey: key.current, expectedTotal: total,
        items: items.map(food => ({ foodId: food.id, quantity: cart[food.id] })),
      }) });
      setSuccess(`Đã hoàn thành đơn #${data.order.id} · Đã thu ${dinhDangGia(data.order.total_amount)}`);
      setCart({}); setConfirmed(false); key.current = requestKey(); setHistoryVersion(v => v + 1); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tạo đơn.'); }
    finally { setBusy(false); }
  }
  return <ScrollView contentContainerStyle={ui.page}>
    <Text style={ui.title}>Bán hàng tại quầy</Text>
    <Text style={ui.muted}>Khách không cần tài khoản. Xác nhận sau khi nhận đủ tiền mặt.</Text>
    <View style={ui.row}><Action disabled={busy} onPress={async () => { setConfirmed(false); key.current = requestKey(); await load(); }}>Làm mới giá / tồn kho</Action>
      <Action disabled={busy} onPress={() => { setCart({}); setConfirmed(false); key.current = requestKey(); }}>Xóa giỏ</Action></View>
    {loading && <Text>Đang tải món…</Text>}
    {error !== '' && <Text style={ui.error}>{error}</Text>}
    {success !== '' && <Text style={ui.heading}>{success}</Text>}
    <Field label="Tìm món" value={search} onChangeText={setSearch} />
    {!loading && foods.length === 0 && <Text>Chưa có món đang bán.</Text>}
    {foods.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).map(food => <View style={ui.card} key={food.id}>
      <Text style={ui.heading}>{food.name} · {dinhDangGia(Number(food.price))}</Text><Text>Tồn kho: {food.stock_quantity}</Text>
      <View style={ui.row}><Action disabled={busy || !cart[food.id]} onPress={() => change(food.id, -1)}>−</Action><Text>{cart[food.id] || 0}</Text><Action disabled={busy || (cart[food.id] || 0) >= food.stock_quantity} onPress={() => change(food.id, 1)}>+</Action></View>
    </View>)}
    <View style={ui.card}>
      <Text style={ui.heading}>Giỏ bán hàng</Text>
      {items.length === 0 && <Text>Chưa chọn món.</Text>}
      {items.map(food => <Text key={food.id}>{food.name} × {cart[food.id]}</Text>)}
      <Text style={ui.heading}>Tổng: {dinhDangGia(total)}</Text>
      {confirmed ? <><Text>Đã nhận đủ {dinhDangGia(total)} tiền mặt?</Text><Action disabled={busy} onPress={sell}>{busy ? 'Đang lưu…' : 'Đã nhận tiền — hoàn thành đơn'}</Action><Action disabled={busy} onPress={() => setConfirmed(false)}>Quay lại</Action></>
        : <Action disabled={busy || !items.length} onPress={() => setConfirmed(true)}>Xác nhận thanh toán</Action>}
    </View>
    <OrdersPanel key={historyVersion} token={token} management counterOnly />
  </ScrollView>;
}
