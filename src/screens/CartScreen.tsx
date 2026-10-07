import { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { DonHang, MonTrongGioHang, NguoiDung } from '../types';

interface ThuocTinhGioHang {
  gioHang: MonTrongGioHang[];
  setGioHang: (gioHangMoi: MonTrongGioHang[]) => void;
  nguoiDungHienTai: NguoiDung | null;
  themDonHang: (donHangMoi: DonHang) => void;
  khiVeTrangChu: () => void;
}

export default function ManHinhGioHang({ gioHang, setGioHang, nguoiDungHienTai, themDonHang, khiVeTrangChu }: ThuocTinhGioHang) {
  const [hienXacNhan, setHienXacNhan] = useState(false);
  const [soDienThoai, setSoDienThoai] = useState(nguoiDungHienTai?.phone || '');
  const [diaChi, setDiaChi] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangDatHang, setDangDatHang] = useState(false);

  function thayDoiSoLuong(ma: number, mucThayDoi: number) {
    setGioHang(gioHang.map((mon) => mon.ma === ma ? { ...mon, soLuong: mon.soLuong + mucThayDoi } : mon).filter((mon) => mon.soLuong > 0));
  }

  function xoaMon(ma: number) {
    setGioHang(gioHang.filter((mon) => mon.ma !== ma));
  }

  function xoaTatCa() {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa toàn bộ giỏ hàng không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => setGioHang([]) },
    ]);
  }

  const tongTien = gioHang.reduce((tong, mon) => tong + mon.gia * mon.soLuong, 0);

  async function xacNhanDatHang() {
    const phone = soDienThoai.trim();
    const deliveryAddress = diaChi.trim();

    if (!/^\+?[0-9]{8,15}$/.test(phone)) {
      setThongBao('Số điện thoại nhận hàng không hợp lệ.');
      return;
    }

    if (!deliveryAddress) {
      setThongBao('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    if (!nguoiDungHienTai?.token) {
      setThongBao('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    const apiUrl = Platform.OS === 'web'
      ? 'http://localhost:3000/api/orders'
      : 'http://10.21.61.245:3000/api/orders';

    try {
      setDangDatHang(true);
      setThongBao('');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nguoiDungHienTai.token}`,
        },
        body: JSON.stringify({
          phone,
          deliveryAddress,
          note: ghiChu.trim(),
          items: gioHang.map((mon) => ({
            foodId: mon.ma,
            name: mon.ten,
            price: mon.gia,
            quantity: mon.soLuong,
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.order) {
        setThongBao(data.message || 'Không thể tạo đơn hàng.');
        return;
      }

      const donHangMoi: DonHang = {
        ma: data.order.id,
        cacMon: data.order.items.map((item: { food_id: number; food_name: string; price: number; quantity: number }) => ({
          ma: item.food_id,
          ten: item.food_name,
          gia: Number(item.price),
          soLuong: item.quantity,
        })),
        tongTien: Number(data.order.total_amount),
        phone: data.order.phone,
        diaChiGiaoHang: data.order.delivery_address,
        ghiChu: data.order.note || '',
        trangThai: data.order.status,
        ngayTao: new Date(data.order.created_at).toLocaleString('vi-VN'),
      };

      themDonHang(donHangMoi);
      setGioHang([]);
      Alert.alert('Thành công', 'Đặt món thành công.');
    } catch {
      setThongBao('Không thể kết nối đến server.');
    } finally {
      setDangDatHang(false);
    }
  }

  if (gioHang.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
        <Text style={styles.emptyText}>Hãy chọn món ăn yêu thích của bạn.</Text>
        <Pressable style={styles.orderButton} onPress={khiVeTrangChu}><Text style={styles.orderText}>Xem thực đơn</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <View><Text style={styles.title}>Giỏ hàng</Text><Text style={styles.subtitle}>{gioHang.length} món ăn trong giỏ</Text></View>
        <Pressable onPress={xoaTatCa}><Text style={styles.clear}>Xóa tất cả</Text></Pressable>
      </View>

      {gioHang.map((mon) => (
        <View style={styles.item} key={mon.ma}>
          <Image source={mon.hinhAnh} resizeMode="cover" style={styles.image} />
          <View style={styles.info}>
            <View style={styles.nameRow}><Text style={styles.name}>{mon.ten}</Text><Pressable onPress={() => xoaMon(mon.ma)}><Text style={styles.delete}>Xóa</Text></Pressable></View>
            <Text style={styles.price}>{dinhDangGia(mon.gia)}</Text>
            <View style={styles.row}>
              <Pressable style={styles.smallButton} onPress={() => thayDoiSoLuong(mon.ma, -1)}><Text>−</Text></Pressable>
              <Text style={styles.quantity}>{mon.soLuong}</Text>
              <Pressable style={styles.smallButton} onPress={() => thayDoiSoLuong(mon.ma, 1)}><Text>+</Text></Pressable>
              <Text style={styles.subtotal}>{dinhDangGia(mon.gia * mon.soLuong)}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tạm tính</Text><Text style={styles.summaryValue}>{dinhDangGia(tongTien)}</Text></View>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Tổng cộng</Text><Text style={styles.total}>{dinhDangGia(tongTien)}</Text></View>
      </View>

      {!hienXacNhan ? (
        <Pressable style={styles.orderButton} onPress={() => setHienXacNhan(true)}><Text style={styles.orderText}>Tiến hành đặt hàng</Text></Pressable>
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
          <Text style={styles.label}>Số điện thoại nhận hàng</Text>
          <TextInput style={styles.input} value={soDienThoai} onChangeText={setSoDienThoai} keyboardType="phone-pad" placeholder="Nhập số điện thoại" />
          <Text style={styles.label}>Địa chỉ giao hàng</Text>
          <TextInput style={[styles.input, styles.addressInput]} value={diaChi} onChangeText={setDiaChi} placeholder="Nhập địa chỉ giao hàng" multiline />
          <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
          <TextInput style={[styles.input, styles.addressInput]} value={ghiChu} onChangeText={setGhiChu} placeholder="Ví dụ: Không cay, giao tại cổng ký túc xá..." multiline maxLength={500} />
          {thongBao !== '' && <Text style={styles.message}>{thongBao}</Text>}
          <View style={styles.confirmActions}>
            <Pressable style={styles.backButton} onPress={() => setHienXacNhan(false)} disabled={dangDatHang}><Text style={styles.backButtonText}>Quay lại</Text></Pressable>
            <Pressable style={[styles.confirmButton, dangDatHang && styles.disabled]} onPress={xacNhanDatHang} disabled={dangDatHang}><Text style={styles.orderText}>{dangDatHang ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}</Text></Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 20, paddingBottom: 45 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#25282D' },
  subtitle: { color: '#858B94', marginTop: 5 },
  clear: { color: '#D85624', fontWeight: '700' },
  item: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', borderRadius: 15, marginBottom: 12 },
  image: { width: 76, height: 76, borderRadius: 11 },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700', fontSize: 16 },
  delete: { color: '#D85624', fontSize: 12 },
  price: { color: '#E86A33', marginTop: 5 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  smallButton: { width: 27, height: 27, borderRadius: 7, backgroundColor: '#FFF0E9', alignItems: 'center', justifyContent: 'center' },
  quantity: { width: 28, textAlign: 'center', fontWeight: '700' },
  subtotal: { marginLeft: 'auto', fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 18, marginTop: 12 },
  summaryBox: { marginTop: 12, padding: 18, borderRadius: 14, backgroundColor: '#FFFFFF' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#656C76' },
  summaryValue: { color: '#454A52', fontWeight: '700' },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  total: { fontSize: 20, fontWeight: '800', color: '#E86A33' },
  orderButton: { backgroundColor: '#E86A33', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 22 },
  orderText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  confirmation: { marginTop: 24, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, backgroundColor: '#FFFFFF' },
  confirmTitle: { marginBottom: 16, color: '#25282D', fontSize: 21, fontWeight: '800' },
  receiverBox: { marginBottom: 10, padding: 13, borderRadius: 10, backgroundColor: '#FFF7F2' },
  receiverLabel: { color: '#858B94', fontSize: 12 },
  receiverName: { marginTop: 4, color: '#25282D', fontSize: 15, fontWeight: '800' },
  confirmItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  confirmName: { color: '#454A52', fontWeight: '600' },
  confirmPrice: { color: '#454A52' },
  confirmTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  label: { marginTop: 18, marginBottom: 7, color: '#34383E', fontWeight: '700' },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 10, backgroundColor: '#FAFAFA' },
  addressInput: { minHeight: 82, paddingTop: 13, textAlignVertical: 'top' },
  message: { marginTop: 12, color: '#D85624' },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  backButton: { flex: 1, alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#D8DDE3', borderRadius: 12, backgroundColor: '#FFFFFF' },
  backButtonText: { color: '#525A65', fontSize: 15, fontWeight: '700' },
  confirmButton: { flex: 1.6, alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#E86A33' },
  disabled: { opacity: 0.65 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: { fontSize: 58 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginTop: 14 },
  emptyText: { color: '#858B94', marginTop: 7 },
});
