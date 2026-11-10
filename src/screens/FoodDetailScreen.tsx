import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { MonAn, MonTrongGioHang } from '../types';
import FoodImage from '../components/FoodImage';

interface ThuocTinhChiTietMon {
  monAn: MonAn | null;
  gioHang: MonTrongGioHang[];
  setGioHang: (gioHangMoi: MonTrongGioHang[]) => void;
  khiQuayLai: () => void;
  khiXemGioHang: () => void;
}

export default function ManHinhChiTietMon({
  monAn,
  gioHang,
  setGioHang,
  khiQuayLai,
  khiXemGioHang,
}: ThuocTinhChiTietMon) {
  const [soLuong, setSoLuong] = useState(1);
  const [notice, setNotice] = useState('');

  if (monAn === null) {
    return null;
  }

  const monDangXem = monAn;

  function giamSoLuong() {
    if (soLuong > 1) {
      setSoLuong(soLuong - 1);
    }
  }

  function themVaoGioHang() {
    if (!monDangXem.conMon) return;
    const monDaCo = gioHang.find((mon) => mon.ma === monDangXem.ma);

    if ((monDaCo?.soLuong || 0) + soLuong > monDangXem.soLuongTon) { setNotice('Số lượng vượt tồn kho hiện tại.'); return; }
    if (monDaCo) {
      const gioHangMoi = gioHang.map((mon) => {
        if (mon.ma === monDangXem.ma) {
          return { ...mon, soLuong: mon.soLuong + soLuong };
        }
        return mon;
      });

      setGioHang(gioHangMoi);
    } else {
      const monMoi = { ...monDangXem, soLuong };
      setGioHang([...gioHang, monMoi]);
    }

    setNotice('Đã yêu cầu thêm món. Kiểm tra số lượng trong giỏ hàng.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={khiQuayLai}>
        <Text style={styles.back}>‹ Quay lại</Text>
      </Pressable>

      <FoodImage source={monDangXem.hinhAnh} name={monDangXem.ten} drink={monDangXem.danhMuc === 'Đồ uống'} style={styles.image} />
      <Text style={styles.name}>{monDangXem.ten}</Text>
      <Text style={styles.price}>{dinhDangGia(monDangXem.gia)}</Text>
      <Text style={styles.description}>{monDangXem.moTa}</Text>
      <Text style={[styles.available, !monDangXem.conMon && styles.unavailable]}>● {monDangXem.conMon ? 'Còn hàng' : 'Hết hàng'}</Text>

      {notice !== '' && <Text accessibilityLiveRegion="polite">{notice}</Text>}
      <Text style={styles.label}>Số lượng</Text>
      <View style={styles.counter}>
        <Pressable style={styles.circle} onPress={giamSoLuong}>
          <Text style={styles.symbol}>−</Text>
        </Pressable>

        <Text style={styles.quantity}>{soLuong}</Text>

        <Pressable style={styles.circle} disabled={!monDangXem.conMon || soLuong >= monDangXem.soLuongTon} onPress={() => setSoLuong(Math.min(monDangXem.soLuongTon, soLuong + 1))}>
          <Text style={styles.symbol}>+</Text>
        </Pressable>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng</Text>
        <Text style={styles.total}>{dinhDangGia(monDangXem.gia * soLuong)}</Text>
      </View>

      <Pressable style={[styles.button, !monDangXem.conMon && styles.buttonDisabled]} onPress={themVaoGioHang} disabled={!monDangXem.conMon}>
        <Text style={styles.buttonText}>{monDangXem.conMon ? 'Thêm vào giỏ hàng' : 'Món ăn đã hết hàng'}</Text>
      </Pressable>

      <Pressable onPress={khiXemGioHang}>
        <Text style={styles.cartLink}>Xem giỏ hàng</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 20 },
  back: { marginBottom: 18, color: '#D85624', fontSize: 16, fontWeight: '700' },
  image: { width: '100%', maxWidth: 800, alignSelf: 'center', borderRadius: 18 },
  name: { marginTop: 20, color: '#25282D', fontSize: 28, fontWeight: '800' },
  price: { marginTop: 7, color: '#E86A33', fontSize: 20, fontWeight: '700' },
  description: { marginTop: 16, color: '#656C76', fontSize: 15 },
  available: { marginTop: 16, color: '#2E9B68', fontWeight: '700' },
  unavailable: { color: '#D73545' },
  label: { marginTop: 25, marginBottom: 10, fontWeight: '700' },
  counter: { flexDirection: 'row', alignItems: 'center' },
  circle: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFF0E9',
  },
  symbol: { color: '#D85624', fontSize: 23 },
  quantity: { width: 45, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  total: { color: '#E86A33', fontSize: 20, fontWeight: '800' },
  button: {
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#E86A33',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  cartLink: { marginTop: 18, color: '#D85624', textAlign: 'center' },
});
