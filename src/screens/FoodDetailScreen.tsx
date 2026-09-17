import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { MonAn, MonTrongGioHang } from '../types';

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
    const monDaCo = gioHang.find((mon) => mon.ma === monDangXem.ma);

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

    Alert.alert('Thành công', 'Đã thêm món vào giỏ hàng.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={khiQuayLai}>
        <Text style={styles.back}>‹ Quay lại</Text>
      </Pressable>

      <Image source={monDangXem.hinhAnh} style={styles.image} />
      <Text style={styles.name}>{monDangXem.ten}</Text>
      <Text style={styles.price}>{dinhDangGia(monDangXem.gia)}</Text>
      <Text style={styles.description}>{monDangXem.moTa}</Text>
      <Text style={styles.available}>● Còn món</Text>

      <Text style={styles.label}>Số lượng</Text>
      <View style={styles.counter}>
        <Pressable style={styles.circle} onPress={giamSoLuong}>
          <Text style={styles.symbol}>−</Text>
        </Pressable>

        <Text style={styles.quantity}>{soLuong}</Text>

        <Pressable style={styles.circle} onPress={() => setSoLuong(soLuong + 1)}>
          <Text style={styles.symbol}>+</Text>
        </Pressable>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng</Text>
        <Text style={styles.total}>{dinhDangGia(monDangXem.gia * soLuong)}</Text>
      </View>

      <Pressable style={styles.button} onPress={themVaoGioHang}>
        <Text style={styles.buttonText}>Thêm vào giỏ hàng</Text>
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
  image: { width: '100%', height: 240, borderRadius: 18 },
  name: { marginTop: 20, color: '#25282D', fontSize: 28, fontWeight: '800' },
  price: { marginTop: 7, color: '#E86A33', fontSize: 20, fontWeight: '700' },
  description: { marginTop: 16, color: '#656C76', fontSize: 15 },
  available: { marginTop: 16, color: '#2E9B68', fontWeight: '700' },
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
  cartLink: { marginTop: 18, color: '#D85624', textAlign: 'center' },
});
