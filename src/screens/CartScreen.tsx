import { pendingOrder, submitOrder, acknowledgeOrder, PendingOrder } from '../orderJournal';
import { saveLocal } from '../storage';
import Interactive from '../components/Interactive';
import FoodImage from '../components/FoodImage';
import Icon from '../components/Icon';
import { colors, pageLayout } from '../styles/theme';
import { ApiOrder, localTime, request } from '../api';
import OrdersPanel from '../components/OrdersPanel';
import { Action } from '../components/OperationsUI';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { DonHang, MonTrongGioHang, NguoiDung } from '../types';

interface ThuocTinhGioHang {
  gioHang: MonTrongGioHang[];
  setGioHang: (gioHangMoi: MonTrongGioHang[]) => void;
  nguoiDungHienTai: NguoiDung | null;
  themDonHang: (donHangMoi: DonHang) => void;
  khiDatHangThanhCong: () => Promise<void>;
  khiVeTrangChu: () => void;
}

export default function ManHinhGioHang({ gioHang, setGioHang, nguoiDungHienTai, themDonHang, khiDatHangThanhCong, khiVeTrangChu }: ThuocTinhGioHang) {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [orderTab, setOrderTab] = useState<'current' | 'history'>('current');
  const tabs = <View style={styles.tabs} accessibilityRole="tablist">{(['current', 'history'] as const).map(tab =>
    <Interactive key={tab} accessibilityRole="tab" accessibilityState={{ selected: orderTab === tab }} onPress={() => setOrderTab(tab)} style={[styles.tab, orderTab === tab && styles.tabSelected]}>
      <Text style={[styles.tabText, orderTab === tab && { color: colors.primaryDark }]}>{tab === 'current' ? 'Đơn hàng hiện tại' : 'Lịch sử đơn hàng'}</Text>
    </Interactive>)}</View>;
  const [notice, setNotice] = useState('');
  const [hienXacNhan, setHienXacNhan] = useState(false);
  const [pickupAt, setPickupAt] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [placedOrder, setPlacedOrder] = useState<ApiOrder | null>(null);
  const sending = useRef(false);
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [recovering, setRecovering] = useState(true);
  const [ghiChu, setGhiChu] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangDatHang, setDangDatHang] = useState(false);

  async function loadSlots() {
    if (!nguoiDungHienTai) return;
    setSlotLoading(true);
    try { const data = await request('/api/pickup-slots', nguoiDungHienTai.token); setSlots(data.slots); setThongBao(''); }
    catch (e) { setThongBao(e instanceof Error ? e.message : 'Không tải được giờ nhận.'); }
    finally { setSlotLoading(false); }
  }
  useEffect(() => { if (hienXacNhan) loadSlots(); }, [hienXacNhan]);
  useEffect(() => {
    let active = true;
    if (!nguoiDungHienTai) return;
    pendingOrder(nguoiDungHienTai.id, 'online').then(value => { if (active) { setPending(value); setRecovering(false); } })
      .catch(() => setThongBao('Không đọc được giao dịch đã lưu. Hãy mở lại màn hình.'));
    return () => { active = false; };
  }, [nguoiDungHienTai?.id]);
  async function refreshPrices() {
    if (!nguoiDungHienTai || sending.current) return;
    try {
      const data = await request('/api/foods', nguoiDungHienTai.token);
      setGioHang(gioHang.map(item => {
        const food = data.foods.find((f: any) => f.id === item.ma);
        return food ? { ...item, gia: Number(food.price), soLuongTon: food.stock_quantity, conMon: food.stock_quantity > 0 }
          : { ...item, conMon: false, soLuongTon: 0 };
      }));
      setHienXacNhan(false); setThongBao('Đã làm mới giá/tồn kho. Vui lòng kiểm tra và xác nhận lại.');
    } catch (error) { setThongBao(error instanceof Error ? error.message : 'Không tải được giá.'); }
  }

  function thayDoiSoLuong(ma: number, mucThayDoi: number) {
    if (dangDatHang) return;
    setGioHang(gioHang.map((mon) => mon.ma === ma ? { ...mon, soLuong: Math.min(mon.soLuongTon, mon.soLuong + mucThayDoi) } : mon).filter((mon) => mon.soLuong > 0));
  }

  function xoaMon(ma: number) {
    if (dangDatHang) return;
    const removed = gioHang.find(mon => mon.ma === ma);
    setGioHang(gioHang.filter((mon) => mon.ma !== ma));
    setNotice(`Đã xóa ${removed?.ten || 'món ăn'} khỏi giỏ hàng.`);
  }

  function clearCart() { setGioHang([]); setNotice('Đã xóa tất cả món trong giỏ.'); }

  function xoaTatCa() {
    if (dangDatHang) return;
    if (Platform.OS === 'web') { if (window.confirm('Xóa toàn bộ giỏ hàng?')) clearCart(); return; }
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa toàn bộ giỏ hàng không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: clearCart },
    ]);
  }

  const tongTien = gioHang.reduce((tong, mon) => tong + mon.gia * mon.soLuong, 0);

  async function xacNhanDatHang() {
    if (sending.current || recovering || !nguoiDungHienTai) return;
    if (!pending && !pickupAt) { setThongBao('Vui lòng chọn giờ nhận món.'); return; }
    if (!pending && gioHang.some(item => !item.conMon || item.soLuong > item.soLuongTon)) {
      setThongBao('Có món hết hàng hoặc vượt tồn kho. Hãy cập nhật giỏ.'); return;
    }
    sending.current = true;
    try {
      setDangDatHang(true); setThongBao('');
      const data = await submitOrder(nguoiDungHienTai.id, nguoiDungHienTai.token, pending?.payload || {
        orderType: 'online', pickupAt, expectedTotal: tongTien, note: ghiChu.trim(),
        items: gioHang.map(mon => ({ foodId: mon.ma, quantity: mon.soLuong })),
      });
      await saveLocal(`cart:${nguoiDungHienTai.id}`, []);
      setGioHang([]);
      await acknowledgeOrder(nguoiDungHienTai.id, 'online');
      const donHangMoi: DonHang = {
        ma: data.order.id,
        cacMon: data.order.items.map((item: { food_id: number; food_name: string; price: number; quantity: number }) => ({
          ma: item.food_id,
          ten: item.food_name,
          gia: Number(item.price),
          soLuong: item.quantity,
        })),
        tongTien: Number(data.order.total_amount),
        phone: data.order.phone || '',
        diaChiGiaoHang: data.order.delivery_address || '',
        ghiChu: data.order.note || '',
        trangThai: data.order.status,
        ngayTao: new Date(data.order.created_at).toLocaleString('vi-VN'),
      };

      themDonHang(donHangMoi);
      setNotice('');
      setPlacedOrder(data.order);
      setSuccess(`Đã đặt đơn #${data.order.id}. Nhận tại quầy lúc ${localTime(data.order.pickup_at!)}. Thanh toán tiền mặt khi nhận món.`);
      setHienXacNhan(false);
      setPickupAt('');
      setGhiChu('');
      setGioHang([]);
      await khiDatHangThanhCong();
    } catch (error) {
      setThongBao(error instanceof Error ? error.message : 'Không thể xử lý đơn.');
    } finally {
      try { setPending(await pendingOrder(nguoiDungHienTai.id, 'online')); }
      catch { setRecovering(true); setThongBao('Không đọc được giao dịch đã lưu. Hãy mở lại ứng dụng.'); }
      sending.current = false; setDangDatHang(false);
    }
  }

  if (orderTab === 'history') return <ScrollView contentContainerStyle={[styles.container, width >= 768 && { padding: 32 }]}>
    {tabs}
    {nguoiDungHienTai && <OrdersPanel token={nguoiDungHienTai.token} scope="history" title="Lịch sử đơn hàng" />}
  </ScrollView>;

  if (recovering || pending) return <ScrollView contentContainerStyle={[styles.container, width >= 768 && { padding: 32 }]}>
    {tabs}
    <Text style={styles.title}>{recovering ? 'Đang khôi phục giao dịch…' : 'Kiểm tra đơn đã gửi'}</Text>
    <Text>Giữ nguyên yêu cầu đã lưu để tránh tạo đơn trùng. Chỉ tiếp tục đặt đơn mới sau khi xác định kết quả.</Text>
    {pending && <><Text>Tổng đã xác nhận: {dinhDangGia(pending.payload.expectedTotal)}</Text>
      <Action disabled={dangDatHang} onPress={xacNhanDatHang}>{dangDatHang ? 'Đang kiểm tra…' : 'Kiểm tra / gửi lại cùng yêu cầu'}</Action></>}
    {thongBao !== '' && <Text style={styles.message}>{thongBao}</Text>}
  </ScrollView>;

  if (gioHang.length === 0) {
    return (
      <ScrollView contentContainerStyle={[styles.container, width >= 768 && { padding: 32 }]} keyboardShouldPersistTaps="handled">
      {tabs}
        {notice !== '' && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
        {placedOrder ? <View style={styles.successBox} accessibilityLiveRegion="polite">
          <Text style={styles.successTitle}>✓ Đặt món thành công</Text>
          <Text style={styles.successText}>{success}</Text>
        </View> : <View style={styles.empty}>
          <View style={styles.emptyIllustration}><Icon name="cart" color={colors.primary} /></View>
          <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
          <Text style={styles.emptyText}>Bữa ngon đang chờ bạn. Chọn món yêu thích từ thực đơn để bắt đầu.</Text>
        </View>}
        <Interactive style={[styles.orderButton, styles.browseButton]} onPress={khiVeTrangChu}><Text style={styles.orderText}>{placedOrder ? 'Tiếp tục chọn món' : 'Xem thực đơn'}</Text></Interactive>
        {nguoiDungHienTai && <View style={styles.ordersSection}><OrdersPanel scope="current" key={placedOrder?.id || 'history'} token={nguoiDungHienTai.token} initialOrder={placedOrder || undefined} title="Theo dõi đơn đã đặt" onChanged={khiDatHangThanhCong} /></View>}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, width >= 768 && { padding: 32 }]} keyboardShouldPersistTaps="handled">
      {tabs}
      <View style={styles.titleRow}>
        <View><Text style={styles.title}>Giỏ hàng</Text><Text style={styles.subtitle}>{gioHang.length} món ăn trong giỏ</Text></View>
        <Interactive disabled={dangDatHang} style={styles.textButton} onPress={xoaTatCa}><Text style={styles.clear}>Xóa tất cả</Text></Interactive>
      </View>

      {notice !== '' && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
      <Action disabled={dangDatHang} onPress={refreshPrices}>Làm mới giá / tồn kho</Action>
      {thongBao !== '' && !hienXacNhan && <Text style={styles.message}>{thongBao}</Text>}
      <View style={[styles.checkoutLayout, wide && { flexDirection: 'row', alignItems: 'flex-start' }]}>
      <View style={[styles.cartList, wide && { flex: 1.3 }]}>
      {gioHang.map((mon) => (
        <View style={styles.item} key={mon.ma}>
          <FoodImage source={mon.hinhAnh} name={mon.ten} drink={mon.danhMuc === 'Đồ uống'} style={styles.image} />
          <View style={styles.info}>
            <View style={styles.nameRow}><Text style={styles.name}>{mon.ten}</Text><Interactive disabled={dangDatHang} accessibilityLabel={`Xóa ${mon.ten} khỏi giỏ`} style={styles.textButton} onPress={() => xoaMon(mon.ma)}><Text style={styles.delete}>Xóa</Text></Interactive></View>
            <Text style={styles.price}>Đơn giá: {dinhDangGia(mon.gia)}</Text>
            <View style={styles.row}>
              <Interactive disabled={dangDatHang} accessibilityLabel={`Giảm số lượng ${mon.ten}`} style={styles.smallButton} onPress={() => thayDoiSoLuong(mon.ma, -1)}><Text>−</Text></Interactive>
              <Text style={styles.quantity}>{mon.soLuong}</Text>
              <Interactive disabled={dangDatHang || mon.soLuong >= mon.soLuongTon} accessibilityLabel={`Tăng số lượng ${mon.ten}`} style={styles.smallButton} onPress={() => thayDoiSoLuong(mon.ma, 1)}><Text>+</Text></Interactive>
            </View>
            <Text style={styles.subtotal}>Thành tiền: {dinhDangGia(mon.gia * mon.soLuong)}</Text>
          </View>
        </View>
      ))}

      </View>
      <View style={[styles.summaryColumn, wide && { flex: 1, maxWidth: 440 }]}>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryHeading}>Tóm tắt đơn hàng</Text>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tạm tính</Text><Text style={styles.summaryValue}>{dinhDangGia(tongTien)}</Text></View>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Tổng cộng</Text><Text style={styles.total}>{dinhDangGia(tongTien)}</Text></View>
        <Text style={styles.paymentNote}>Nhận tại quầy · Thanh toán tiền mặt khi nhận món</Text>
      </View>

      {!hienXacNhan ? (
        <Interactive style={styles.orderButton} onPress={() => setHienXacNhan(true)}><Text style={styles.orderText}>Tiến hành đặt hàng</Text></Interactive>
      ) : (
        <View style={styles.confirmation}>
          <Text style={styles.confirmTitle}>Xác nhận đặt hàng</Text>
          <View style={styles.receiverBox}>
            <Text style={styles.receiverLabel}>Người nhận</Text>
            <Text style={styles.receiverName}>{nguoiDungHienTai?.hoTen}</Text>
          </View>
          {gioHang.map((mon) => (
            <View key={mon.ma} style={styles.confirmItem}>
              <Text style={styles.confirmName}>{mon.ten} × {mon.soLuong}</Text>
              <Text style={styles.confirmPrice}>{dinhDangGia(mon.gia * mon.soLuong)}</Text>
            </View>
          ))}
          <View style={styles.confirmTotal}><Text style={styles.totalLabel}>Tổng tiền</Text><Text style={styles.total}>{dinhDangGia(tongTien)}</Text></View>
          <Text style={styles.label}>Chọn giờ nhận món tại quầy (giờ Việt Nam)</Text>
          <Action onPress={loadSlots} disabled={slotLoading || dangDatHang}>Làm mới khung giờ</Action>
          {slotLoading && <Text>Đang tải khung giờ…</Text>}
          {!slotLoading && slots.length === 0 && <Text>Không có khung giờ nhận khả dụng.</Text>}
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {slots.map(slot => <Interactive key={slot} disabled={dangDatHang} onPress={() => setPickupAt(slot)} accessibilityState={{ selected: pickupAt === slot }} style={{ minHeight: 48, justifyContent: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: pickupAt === slot ? colors.primary : colors.border, backgroundColor: pickupAt === slot ? colors.soft : '#FFFFFF', marginVertical: 4 }}><Text>{pickupAt === slot ? '✓ ' : ''}{localTime(slot)}</Text></Interactive>)}
          </ScrollView>
          <Text>Thanh toán tiền mặt khi nhận món.</Text>
          <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
          <TextInput accessibilityLabel="Ghi chú cho đơn hàng" style={[styles.input, styles.addressInput]} editable={!dangDatHang} value={ghiChu} onChangeText={setGhiChu} placeholder="Ví dụ: Không cay, không hành..." multiline maxLength={500} />
          {thongBao !== '' && <Text style={styles.message}>{thongBao}</Text>}
          <View style={styles.confirmActions}>
            <Interactive style={styles.backButton} onPress={() => setHienXacNhan(false)} disabled={dangDatHang}><Text style={styles.backButtonText}>Quay lại</Text></Interactive>
            <Interactive style={[styles.confirmButton, dangDatHang && styles.disabled]} onPress={xacNhanDatHang} disabled={dangDatHang}><Text style={styles.orderText}>{dangDatHang ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}</Text></Interactive>
          </View>
        </View>
      )}
      </View>
      </View>
      {nguoiDungHienTai && <View style={styles.ordersSection}><OrdersPanel scope="current" token={nguoiDungHienTai.token} title="Theo dõi đơn đã đặt" onChanged={khiDatHangThanhCong} /></View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, padding: 4, borderRadius: 16, backgroundColor: colors.surface, marginBottom: 24 },
  tab: { flex: 1, minHeight: 52, padding: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  tabSelected: { backgroundColor: colors.soft },
  tabText: { color: colors.muted, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  browseButton: { alignSelf: 'center', paddingHorizontal: 24, minHeight: 48, marginTop: 16 },
  checkoutLayout: { gap: 24, marginTop: 16 },
  cartList: { minWidth: 0 },
  summaryColumn: { minWidth: 0 },
  summaryHeading: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 20 },
  paymentNote: { marginTop: 16, color: colors.muted, fontSize: 13, lineHeight: 21 },
  textButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingHorizontal: 8 },
  notice: { color: colors.green, backgroundColor: colors.greenSoft, borderRadius: 12, padding: 14, marginBottom: 14, lineHeight: 20 },
  emptyIllustration: { width: 76, height: 76, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  container: { ...pageLayout },
  ordersSection: { marginTop: 28 },
  successBox: { padding: 18, borderRadius: 16, backgroundColor: '#EAF8EF', borderWidth: 1, borderColor: '#C5EBD2', gap: 8 },
  successTitle: { color: '#167444', fontSize: 22, fontWeight: '800' },
  successText: { color: '#245B3D', lineHeight: 22 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: '#858B94', marginTop: 5 },
  clear: { color: colors.primary, fontWeight: '700' },
  item: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12 },
  image: { width: 80, height: 60, borderRadius: 11 },
  info: { flex: 1, minWidth: 0, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  name: { flex: 1, minWidth: 0, fontWeight: '700', fontSize: 16 },
  delete: { color: colors.primary, fontSize: 12 },
  price: { color: colors.primary, marginTop: 5 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  smallButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  quantity: { width: 38, textAlign: 'center', fontWeight: '700' },
  subtotal: { marginTop: 12, color: colors.text, fontWeight: '700', flexShrink: 1 },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 18, marginTop: 12 },
  summaryBox: { borderWidth: 1, borderColor: colors.border, padding: 20, borderRadius: 16, backgroundColor: '#FFFFFF' },
  summaryRow: { flexWrap: 'wrap', gap: 8, flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#656C76' },
  summaryValue: { color: '#454A52', fontWeight: '700' },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  total: { fontSize: 20, fontWeight: '800', color: colors.primary },
  orderButton: { backgroundColor: colors.primary, alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 22 },
  orderText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  confirmation: { marginTop: 24, padding: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: '#FFFFFF' },
  confirmTitle: { marginBottom: 16, color: colors.text, fontSize: 21, fontWeight: '800' },
  receiverBox: { marginBottom: 10, padding: 13, borderRadius: 10, backgroundColor: colors.soft },
  receiverLabel: { color: '#858B94', fontSize: 12 },
  receiverName: { marginTop: 4, color: colors.text, fontSize: 15, fontWeight: '800' },
  confirmItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  confirmName: { flex: 1, marginRight: 10, color: '#454A52', fontWeight: '600' },
  confirmPrice: { color: '#454A52' },
  confirmTotal: { flexWrap: 'wrap', gap: 8, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  label: { marginTop: 18, marginBottom: 7, color: '#34383E', fontWeight: '700' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FAFAFA' },
  addressInput: { minHeight: 82, paddingTop: 13, textAlignVertical: 'top' },
  message: { marginTop: 12, color: colors.primary },
  confirmActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  backButton: { flexGrow: 1, minWidth: 100, alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#D8DDE3', borderRadius: 12, backgroundColor: '#FFFFFF' },
  backButtonText: { color: '#525A65', fontSize: 15, fontWeight: '700' },
  confirmButton: { flexGrow: 1.6, minWidth: 160, alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: colors.primary },
  disabled: { opacity: 0.65 },
  empty: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 16, minHeight: 216, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: { fontSize: 58 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginTop: 14 },
  emptyText: { color: colors.muted, marginTop: 10, lineHeight: 22, textAlign: 'center', maxWidth: 360 },
});
