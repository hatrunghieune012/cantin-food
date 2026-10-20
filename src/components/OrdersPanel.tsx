import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ApiOrder, localTime, request, statusNames } from '../api';
import { dinhDangGia } from '../data/foods';
import { Action, Field, ui } from './OperationsUI';

export default function OrdersPanel({ token, management = false, counterOnly = false, onChanged }: {
  token: string; management?: boolean; counterOnly?: boolean; onChanged?: () => Promise<void>;
}) {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{ order: ApiOrder; status: string } | null>(null);
  const [reason, setReason] = useState('');
  async function load() {
    try {
      const data = await request(management ? '/api/staff/orders' : '/api/orders', token);
      setOrders(data.orders); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải đơn.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); const timer = setInterval(load, 20000); return () => clearInterval(timer); }, [token, management]);
  async function confirm() {
    if (!action) return;
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
  const visible = orders.filter(order => !counterOnly || order.order_type === 'counter');
  return <View style={{ gap: 12 }}>
    <View style={ui.row}><Text style={ui.title}>{counterOnly ? 'Giao dịch tại quầy' : 'Đơn hàng'}</Text><Action onPress={load}>Làm mới</Action></View>
    {loading && <Text>Đang tải đơn…</Text>}
    {error !== '' && <Text style={ui.error}>{error}</Text>}
    {action && <View style={ui.card}>
      <Text style={ui.heading}>Đơn #{action.order.id}: {statusNames[action.status]}</Text>
      {action.status === 'completed' && action.order.order_type === 'online' && <Text>Xác nhận đã nhận đủ {dinhDangGia(action.order.total_amount)} tiền mặt và giao món cho sinh viên.</Text>}
      {action.status === 'cancelled' && <Text>{action.order.status === 'pending' ? 'Hủy đơn và hoàn số lượng về kho.' : 'Món đã chuẩn bị sẽ không được hoàn vào kho.'}</Text>}
      {action.status === 'cancelled' && management && (action.order.status === 'ready'
        ? <Text>Ghi nhận khách không đến nhận (chỉ sau giờ hẹn ít nhất 30 phút).</Text>
        : <Field label="Lý do hủy" value={reason} onChangeText={setReason} />)}
      <View style={ui.row}><Action disabled={busy} onPress={confirm}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Action><Action disabled={busy} onPress={() => setAction(null)}>Quay lại</Action></View>
    </View>}
    {!loading && !error && visible.length === 0 && <Text>Chưa có đơn hàng.</Text>}
    {visible.map(order => <View style={ui.card} key={order.id}>
      <Text style={ui.heading}>#{order.id} · {order.customer_name} · {statusNames[order.status] || order.status}</Text>
      <Text>{order.order_type === 'counter' ? 'Bán tại quầy' : order.order_type === 'online' ? 'Đặt trước, nhận tại quầy' : 'Đơn giao hàng cũ'} · {localTime(order.created_at)}</Text>
      {order.pickup_at && <Text>Giờ nhận: {localTime(order.pickup_at)}</Text>}
      {order.order_type === 'legacy_delivery' && <Text>Địa chỉ giao cũ: {order.delivery_address}</Text>}
      {order.phone && <Text>Liên hệ: {order.phone}</Text>}
      {order.items.map(item => <Text key={item.id}>{item.food_name} × {item.quantity} · {dinhDangGia(item.price * item.quantity)}</Text>)}
      <Text style={ui.heading}>Tổng: {dinhDangGia(order.total_amount)}</Text>
      <Text>Thanh toán: {order.payment_status === 'paid' ? 'Đã thu tiền mặt' : order.payment_status === 'unpaid' ? 'Chưa thanh toán' : 'Chưa có dữ liệu thanh toán (đơn cũ)'}</Text>
      {order.note && <Text>Ghi chú: {order.note}</Text>}
      {order.cancellation_reason && <Text>Lý do hủy: {order.cancellation_reason === 'no_show' ? 'Không đến nhận' : order.cancellation_reason === 'student_cancelled' ? 'Sinh viên hủy' : order.cancellation_reason}</Text>}
      <View style={ui.row}>{(management ? order.allowed_statuses : order.order_type === 'online' && order.status === 'pending' ? ['cancelled'] : []).map(status =>
        <Action key={status} disabled={busy} onPress={() => { setAction({ order, status }); setReason(''); }}>{status === 'cancelled' && order.status === 'ready' ? 'Không đến nhận' : statusNames[status]}</Action>)}</View>
    </View>)}
  </View>;
}
