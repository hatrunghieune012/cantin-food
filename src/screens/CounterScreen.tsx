import { pendingOrder, submitOrder, acknowledgeOrder, PendingOrder } from '../orderJournal';
import { readLocal, saveLocal } from '../storage';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { request } from '../api';
import { dinhDangGia, layHinhAnhMonAn } from '../data/foods';
import { Action, Field, ui } from '../components/OperationsUI';
import OrdersPanel from '../components/OrdersPanel';
import FoodImage from '../components/FoodImage';
import Interactive from '../components/Interactive';
import { colors, pageLayout } from '../styles/theme';
interface Food { id: number; name: string; price: number; stock_quantity: number; image_key: string; category: string; is_active: number | boolean }

export default function CounterScreen({ token }: { token: string }) {
  const { width } = useWindowDimensions();
  const [catalogWidth, setCatalogWidth] = useState(0);
  const [saving, setSaving] = useState(false);
  const updating = useRef(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [foods, setFoods] = useState<Food[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);
  const sending = useRef(false);
  const [owner, setOwner] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [restored, setRestored] = useState(false);
  async function load() {
    setLoading(true);
    try { const data = await request('/api/foods', token); setFoods(data.foods); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải món.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      const { user } = await request('/api/me', token);
      const [saved, transaction] = await Promise.all([readLocal<Record<number, number>>(`counter-cart:${user.id}`), pendingOrder(user.id, 'counter')]);
      if (!active) return;
      setOwner(user.id); setCart(saved || {}); setPending(transaction); setRestored(true);
      await load();
    })().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không khôi phục được giao dịch.'); });
    return () => { active = false; };
  }, [token, recoveryAttempt]);
  async function updateCart(next: Record<number, number>) {
    if (!owner || pending || sending.current || updating.current) return;
    updating.current = true; setSaving(true);
    try { await saveLocal(`counter-cart:${owner}`, next); setCart(next); setConfirmed(false); setSuccess(''); }
    catch { setError('Không lưu được giỏ bán hàng. Chưa thể tiếp tục.'); }
    finally { updating.current = false; setSaving(false); }
  }
  function change(id: number, delta: number) {
    if (busy || pending || !restored || loading || updating.current) return;
    const food = foods.find(item => item.id === id);
    if (!food || (delta > 0 && (!food.is_active || (cart[id] || 0) >= food.stock_quantity))) return;
    void updateCart({ ...cart, [id]: Math.max(0, (cart[id] || 0) + delta) });
  }
  const items = foods.filter(food => cart[food.id] > 0);
  const total = items.reduce((sum, food) => sum + Number(food.price) * cart[food.id], 0);
  const missingIds = Object.keys(cart).map(Number).filter(id => cart[id] > 0 && !foods.some(food => food.id === id));
  const invalidCart = missingIds.length > 0 || items.some(food => !food.is_active || cart[food.id] > food.stock_quantity);
  const locked = busy || saving || loading;
  const matches = foods.filter(food => food.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  const columns = Math.max(1, Math.min(3, Math.floor((catalogWidth + 16) / 236)));
  const cardWidth = Math.max(0, (catalogWidth - (columns - 1) * 16) / columns);
  async function sell() {
    if (sending.current || updating.current || !owner || !restored || (!pending && (!confirmed || invalidCart || !items.length || loading))) return;
    sending.current = true; setBusy(true); setError('');
    try {
      const data = await submitOrder(owner, token, pending?.payload || {
        orderType: 'counter', paymentMethod: 'cash', expectedTotal: total,
        items: items.map(food => ({ foodId: food.id, quantity: cart[food.id] })),
      });
      await saveLocal(`counter-cart:${owner}`, {});
      setCart({}); setConfirmed(false);
      await acknowledgeOrder(owner, 'counter');
      setSuccess(`Đã hoàn thành đơn #${data.order.id} · Đã thu ${dinhDangGia(data.order.total_amount)}`);
      setHistoryVersion(v => v + 1); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tạo đơn.'); }
    finally {
      try { setPending(await pendingOrder(owner, 'counter')); }
      catch { setRestored(false); setError('Không đọc được giao dịch đã lưu. Hãy mở lại màn hình.'); }
      sending.current = false; setBusy(false);
    }
  }
  if (!restored || pending) return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>
    <Text style={ui.title}>{!restored ? 'Đang khôi phục giỏ bán hàng…' : 'Giao dịch cần kiểm tra'}</Text>
    {pending && <><Text>Tổng đã xác nhận: {dinhDangGia(pending.payload.expectedTotal)}. Kiểm tra cùng yêu cầu để tránh ghi nhận tiền hai lần.</Text>
      <Action disabled={busy} onPress={sell}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra / gửi lại cùng yêu cầu'}</Action></>}
    {error !== '' && <><Text style={ui.error}>{error}</Text>{!pending && <Action onPress={() => setRecoveryAttempt(value => value + 1)}>Thử khôi phục lại</Action>}</>}
  </ScrollView>;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.page, width >= 768 && { paddingHorizontal: 32 }]}>
    <View style={styles.heading}><View style={{ flex: 1, minWidth: 0 }}><Text style={ui.title}>Bán tại quầy</Text>
      <Text style={styles.hint}>Chọn món · Nhận tiền mặt · Hoàn thành đơn</Text></View>
      <Action disabled={locked} onPress={async () => { setConfirmed(false); await load(); }}>Làm mới giá / tồn kho</Action></View>
    {loading && <Text accessibilityLiveRegion="polite" style={ui.muted}>Đang tải món…</Text>}
    {error !== '' && <View accessibilityRole="alert" style={styles.error}><Text style={ui.error}>{error}</Text><Action disabled={locked} onPress={load}>Thử lại</Action></View>}
    {success !== '' && <Text accessibilityLiveRegion="polite" style={styles.success}>{success}</Text>}
    <View style={[styles.layout, width >= 1000 && { flexDirection: 'row', alignItems: 'flex-start' }]}>
      <View style={styles.catalog}>
        <Field label="Tìm món" value={search} onChangeText={setSearch} />
        <View style={styles.grid} onLayout={event => setCatalogWidth(event.nativeEvent.layout.width)}>
          {matches.map(food => <View key={food.id} style={[styles.foodCard, { width: cardWidth || '100%' }]}>
            <FoodImage source={layHinhAnhMonAn(food.image_key)} name={food.name} drink={food.category === 'Đồ uống'} style={styles.image} />
            <View style={styles.foodBody}>
              <Text style={ui.heading}>{food.name}</Text>
              <Text style={styles.price}>{dinhDangGia(Number(food.price))}</Text>
              <Text style={[styles.stock, (!food.is_active || food.stock_quantity <= 0) && { color: colors.red }]}>{!food.is_active || food.stock_quantity <= 0 ? 'Hết hàng' : `Còn hàng · Tồn kho: ${food.stock_quantity}`}</Text>
              <Quantity name={food.name} value={cart[food.id] || 0} disabled={locked} canAdd={!!food.is_active && (cart[food.id] || 0) < food.stock_quantity} onChange={delta => change(food.id, delta)} />
            </View>
          </View>)}
        </View>
        {!loading && !error && matches.length === 0 && <View style={ui.card}><Text style={ui.heading}>{foods.length ? 'Không tìm thấy món phù hợp' : 'Chưa có món đang bán'}</Text><Text style={ui.muted}>Thử từ khóa khác hoặc làm mới thực đơn.</Text></View>}
      </View>
      <View style={[styles.cart, width >= 1000 && { width: 360 }]}>
        <View style={styles.heading}><Text style={ui.heading}>Giỏ hàng tại quầy</Text><Action disabled={locked || !Object.values(cart).some(q => q > 0)} onPress={() => { void updateCart({}); }}>Xóa giỏ</Action></View>
        <Text style={ui.muted}>Khách không cần tài khoản. Chỉ xác nhận sau khi nhận đủ tiền mặt.</Text>
        {items.length === 0 && missingIds.length === 0 && <Text style={styles.empty}>Chưa chọn món. Thêm món từ thực đơn để bắt đầu.</Text>}
        {items.map(food => <View style={styles.cartItem} key={food.id}>
          <Text style={ui.heading}>{food.name}</Text>
          <Text style={ui.muted}>Đơn giá: {dinhDangGia(Number(food.price))}</Text>
          <View style={styles.heading}><Quantity name={food.name} value={cart[food.id]} disabled={locked} canAdd={!!food.is_active && cart[food.id] < food.stock_quantity} onChange={delta => change(food.id, delta)} />
            <Text style={styles.price}>{dinhDangGia(Number(food.price) * cart[food.id])}</Text></View>
          {cart[food.id] > food.stock_quantity && <Text style={ui.error}>Số lượng vượt tồn kho hiện tại ({food.stock_quantity}).</Text>}
        </View>)}
        {missingIds.map(id => <View key={id} style={styles.cartItem}><Text style={ui.error}>Món #{id} không còn trong thực đơn. Vui lòng xóa khỏi giỏ.</Text><Action disabled={locked} onPress={() => { void updateCart({ ...cart, [id]: 0 }); }}>Xóa món #{id}</Action></View>)}
        <View style={styles.total}><Text style={ui.heading}>Tổng cộng</Text><Text style={styles.totalPrice}>{dinhDangGia(total)}</Text></View>
        {invalidCart && <Text style={ui.error}>Kiểm tra lại các món không khả dụng hoặc vượt tồn kho trước khi thanh toán.</Text>}
        {confirmed ? <><Text style={ui.heading}>Đã nhận đủ {dinhDangGia(total)} tiền mặt?</Text>
          <Interactive disabled={locked || invalidCart || !items.length} onPress={sell} style={styles.pay}><Text style={styles.payText}>{busy ? 'Đang lưu…' : 'Đã nhận tiền — hoàn thành đơn'}</Text></Interactive>
          <Action disabled={locked} onPress={() => setConfirmed(false)}>Quay lại</Action></>
          : <Interactive disabled={locked || invalidCart || !items.length} onPress={() => setConfirmed(true)} style={styles.pay}><Text style={styles.payText}>Xác nhận thanh toán</Text></Interactive>}
      </View>
    </View>
    <OrdersPanel key={historyVersion} token={token} management counterOnly />
  </ScrollView>;
}
function Quantity({ name, value, disabled, canAdd, onChange }: { name: string; value: number; disabled: boolean; canAdd: boolean; onChange: (delta: number) => void }) {
  return <View style={styles.quantity}>
    <Interactive accessibilityLabel={`Giảm ${name}`} disabled={disabled || value <= 0} style={styles.quantityButton} onPress={() => onChange(-1)}><Text style={styles.quantityText}>−</Text></Interactive>
    <Text style={styles.quantityValue}>{value}</Text>
    <Interactive accessibilityLabel={`Tăng ${name}`} disabled={disabled || !canAdd} style={styles.quantityButton} onPress={() => onChange(1)}><Text style={styles.quantityText}>+</Text></Interactive>
  </View>;
}
const styles = StyleSheet.create({
  page: { ...pageLayout, gap: 24 }, heading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  hint: { color: colors.muted, marginTop: 8, lineHeight: 20 }, layout: { gap: 24 }, catalog: { flex: 1, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  foodCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  image: { width: '100%', aspectRatio: 16 / 10 }, foodBody: { flex: 1, padding: 16, gap: 12 },
  price: { color: colors.primaryDark, fontWeight: '800', fontSize: 16 }, stock: { color: '#15803D', fontSize: 12 },
  cart: { padding: 16, gap: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cartItem: { gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 8 }, quantityButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.soft },
  quantityText: { fontSize: 20, color: colors.primaryDark }, quantityValue: { minWidth: 24, textAlign: 'center', fontWeight: '700', color: colors.text },
  total: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingVertical: 8 }, totalPrice: { fontSize: 22, fontWeight: '800', color: colors.primary },
  pay: { minHeight: 52, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, payText: { color: colors.surface, fontWeight: '700', textAlign: 'center' },
  empty: { paddingVertical: 24, color: colors.muted, lineHeight: 22 }, error: { padding: 16, backgroundColor: colors.redSoft, borderRadius: 16 },
  success: { padding: 16, borderRadius: 16, color: '#15803D', backgroundColor: colors.greenSoft, lineHeight: 22 },
});
