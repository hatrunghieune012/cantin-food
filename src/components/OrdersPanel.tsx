import Interactive from './Interactive';
import { colors } from '../styles/theme';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiOrder, localTime, request, statusNames } from '../api';
import { dinhDangGia } from '../data/foods';
import { Action, Field, ui } from './OperationsUI';

export default function OrdersPanel({ token, management = false, counterOnly = false, onChanged, initialOrder, title, scope = 'all', staffView }: {
  staffView?: 'active' | 'cancelled';
  scope?: 'all' | 'current' | 'history'; token: string; management?: boolean; counterOnly?: boolean; onChanged?: () => Promise<void>; initialOrder?: ApiOrder; title?: string;
}) {
  const [orders, setOrders] = useState<ApiOrder[]>(initialOrder ? [initialOrder] : []);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{ order: ApiOrder; status: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reason, setReason] = useState('');
  const loadingRequest = useRef(false);
  async function load() {
    if (loadingRequest.current) return;
    loadingRequest.current = true;
    setLoading(true);
    try {
      const data = await request(management ? '/api/staff/orders' : '/api/orders', token);
      setOrders(data.orders); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải đơn.'); }
    finally { loadingRequest.current = false; setLoading(false); }
  }
  useEffect(() => { load(); const timer = setInterval(load, 20000); return () => clearInterval(timer); }, [token, management, scope, staffView]);
  async function confirm() {
    if (!action || staffView === 'cancelled') return;
    setBusy(true); setError('');
    try {
      await request(`/api/${management ? 'staff/' : ''}orders/${action.order.id}/status`, token, {
        method: 'PUT', body: JSON.stringify({
          status: action.status,
          reason: action.order.status === 'ready' ? 'no_show' : reason,
          paymentMethod: action.status === 'completed' ? 'cash' : undefined,
        }),
      });
      setAction(null); await load(); await onChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật đơn.'); }
    finally { setBusy(false); }
  }
  const activeStatuses = ['pending', 'preparing', 'ready', 'delivering'];
  const candidates = orders.filter(order => (!counterOnly || order.order_type === 'counter')
    && (scope === 'all' || (scope === 'history' ? order.is_terminal === true : order.is_terminal !== true))
    && (!staffView || (staffView === 'active' ? activeStatuses.includes(order.status)
      : order.status === 'cancelled' && order.cancellation_reason === 'student_cancelled' && order.handled_by == null)));
  const filters = ['all', 'pending', 'preparing', 'ready', ...(candidates.some(order => order.status === 'delivering') ? ['delivering'] : [])];
  const visible = candidates.filter(order => staffView !== 'active' || statusFilter === 'all' || order.status === statusFilter)
    .sort((a, b) => staffView === 'cancelled'
      ? (b.cancelled_at ? new Date(b.cancelled_at).getTime() : 0) - (a.cancelled_at ? new Date(a.cancelled_at).getTime() : 0)
        || new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id);
  return <View style={{ gap: 12 }}>
    <View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.title}>{title || (counterOnly ? 'Giao dịch tại quầy' : 'Đơn hàng')}</Text><Action onPress={load} disabled={loading}>Làm mới</Action></View>
    {staffView === 'active' && <View style={ui.row}>{filters.map(status => <Interactive key={status} accessibilityState={{ selected: statusFilter === status }} onPress={() => setStatusFilter(status)} style={[progress.filter, statusFilter === status && { backgroundColor: colors.soft, borderColor: colors.primary }]}><Text style={ui.muted}>{status === 'all' ? 'Tất cả' : statusNames[status]}</Text><Text style={ui.title}>{status === 'all' ? candidates.length : candidates.filter(order => order.status === status).length}</Text></Interactive>)}</View>}
    {staffView === 'cancelled' && <Text style={ui.muted}>Chỉ gồm đơn khách tự hủy. Đơn cũ chưa có thời gian hủy được xếp sau, theo ngày đặt.</Text>}
    {(!management || staffView) && <Text style={ui.muted}>Trạng thái cập nhật mỗi 20 giây khi mở màn hình này.</Text>}
    {loading && <Text accessibilityLiveRegion="polite" style={ui.muted}>Đang tải đơn…</Text>}
    {error !== '' && <View accessibilityRole="alert"><Text style={ui.error}>{error}</Text><Action onPress={load} disabled={loading}>Thử lại</Action></View>}
    {action && staffView !== 'cancelled' && <View style={ui.card}>
      <Text style={ui.heading}>Đơn #{action.order.id}: {statusNames[action.status]}</Text>
      {action.status === 'completed' && action.order.order_type === 'online' && <Text>Xác nhận đã nhận đủ {dinhDangGia(action.order.total_amount)} tiền mặt và giao món cho sinh viên.</Text>}
      {action.status === 'cancelled' && <Text>{action.order.status === 'pending' ? 'Hủy đơn và hoàn số lượng về kho.' : 'Món đã chuẩn bị sẽ không được hoàn vào kho.'}</Text>}
      {action.status === 'cancelled' && management && (action.order.status === 'ready'
        ? <Text>Ghi nhận khách không đến nhận (chỉ sau giờ hẹn ít nhất 30 phút).</Text>
        : <Field label="Lý do hủy" value={reason} onChangeText={setReason} />)}
      <View style={ui.row}><Action disabled={busy} onPress={confirm}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Action><Action disabled={busy} onPress={() => setAction(null)}>Quay lại</Action></View>
    </View>}
    {!loading && !error && visible.length === 0 && <View style={[ui.card, { padding: 24 }]}><Text style={ui.heading}>{staffView === 'cancelled' ? 'Chưa có đơn khách đã hủy' : staffView === 'active' ? 'Không có đơn cần xử lý trong bộ lọc này' : scope === 'history' ? 'Chưa có lịch sử đơn hàng' : scope === 'current' ? 'Không có đơn đang xử lý' : 'Chưa có đơn hàng'}</Text><Text style={ui.muted}>Các đơn đã đặt sẽ xuất hiện tại đây để bạn tiện theo dõi.</Text></View>}
    {visible.map(order => <View style={[ui.card, staffView && { gap: 8 }]} key={order.id}>
      <View style={[ui.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, minWidth: 0 }}><Text style={ui.heading}>Đơn #{order.id}</Text><Text style={ui.muted}>{order.customer_name}</Text></View>
        <Text style={[progress.badge, order.status === 'cancelled' && progress.cancelled, order.status === 'completed' && progress.completed]}>{statusNames[order.status] || order.status}</Text>
      </View>
      {!management && order.order_type === 'online' && <OrderProgress status={order.status} />}
      <Text>{order.order_type === 'counter' ? 'Bán tại quầy' : order.order_type === 'online' ? 'Đặt trước, nhận tại quầy' : 'Đơn giao hàng cũ'} · {localTime(order.created_at)}</Text>
      {order.cancelled_at && staffView === 'cancelled' && <Text style={ui.muted}>Đã hủy: {localTime(order.cancelled_at)}</Text>}
      {order.pickup_at && <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>Giờ nhận: {localTime(order.pickup_at)}</Text>}
      {order.order_type === 'legacy_delivery' && <Text>Địa chỉ giao cũ: {order.delivery_address}</Text>}
      {order.phone && <Text>Liên hệ: {order.phone}</Text>}
      {order.items.map(item => <Text key={item.id}>{item.food_name} × {item.quantity} · {dinhDangGia(item.price * item.quantity)}</Text>)}
      <Text style={[ui.heading, { color: colors.primary, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>Tổng: {dinhDangGia(order.total_amount)}</Text>
      <Text>Thanh toán: {order.payment_status === 'paid' ? 'Đã thu tiền mặt' : order.payment_status === 'unpaid' ? 'Chưa thanh toán' : 'Chưa có dữ liệu thanh toán (đơn cũ)'}</Text>
      {order.note && <Text>Ghi chú: {order.note}</Text>}
      {order.cancellation_reason && <Text>Lý do hủy: {order.cancellation_reason === 'no_show' ? 'Không đến nhận' : order.cancellation_reason === 'student_cancelled' ? 'Sinh viên hủy' : order.cancellation_reason}</Text>}
      <View style={ui.row}>{(staffView === 'cancelled' ? [] : management ? order.allowed_statuses : order.order_type === 'online' && order.status === 'pending' ? ['cancelled'] : []).map(status =>
        <Action key={status} disabled={busy} onPress={() => { setAction({ order, status }); setReason(''); }}>{status === 'cancelled' && order.status === 'ready' ? 'Không đến nhận' : statusNames[status]}</Action>)}</View>
    </View>)}
  </View>;
}

function OrderProgress({ status }: { status: string }) {
  const steps = ['pending', 'preparing', 'ready', 'completed'];
  const labels = ['Chờ xác nhận', 'Đang chuẩn bị', 'Sẵn sàng nhận', 'Đã nhận món'];
  const current = steps.indexOf(status);
  if (status === 'cancelled') return <Text style={progress.cancelled}>Đơn hàng đã hủy</Text>;
  if (current < 0) return null;
  return <View style={progress.row} accessibilityLabel={`Trạng thái đơn: ${labels[current]}`}>
    {steps.map((step, index) => <View key={step} style={progress.step}>
      <View style={progress.track}>
      {index > 0 && <View style={[progress.line, { left: 0 }, index <= current && progress.done]} />}
      {index < steps.length - 1 && <View style={[progress.line, { right: 0 }, index < current && progress.done]} />}
      <View style={[progress.dot, index <= current && progress.done]}><Text style={[progress.number, index <= current && progress.doneNumber]}>{index < current ? '✓' : index + 1}</Text></View>
      </View>
      <Text style={[progress.label, index === current && progress.current]}>{labels[index]}</Text>
    </View>)}
  </View>;
}

const progress = StyleSheet.create({
  filter: { flexGrow: 1, minWidth: 120, gap: 8, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
  row: { flexDirection: 'row', paddingVertical: 16 },
  step: { flex: 1, alignItems: 'center', gap: 7 },
  badge: { flexShrink: 1, color: colors.primaryDark, backgroundColor: colors.soft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontWeight: '700' },
  completed: { color: '#15803D', backgroundColor: colors.greenSoft },
  track: { width: '100%', height: 32, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', width: '50%', height: 2, backgroundColor: colors.border },
  dot: { zIndex: 1, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: colors.primary },
  number: { color: '#687280', fontWeight: '700' },
  doneNumber: { color: '#FFFFFF' },
  label: { paddingHorizontal: 4, lineHeight: 16, color: colors.muted, fontSize: 11, textAlign: 'center' },
  current: { color: colors.primaryDark, fontWeight: '800' },
  cancelled: { padding: 12, borderRadius: 8, color: colors.red, backgroundColor: '#FFF0EE' },
});
