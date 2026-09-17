import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { DonHang, MonTrongGioHang } from '../types';

interface ThuocTinhGioHang {
  gioHang: MonTrongGioHang[];
  setGioHang: (gioHangMoi: MonTrongGioHang[]) => void;
  themDonHang: (donHangMoi: DonHang) => void;
  khiVeTrangChu: () => void;
}

export default function ManHinhGioHang({ gioHang, setGioHang, themDonHang, khiVeTrangChu }: ThuocTinhGioHang) {
  function thayDoiSoLuong(ma: number, mucThayDoi: number) {
    setGioHang(
      gioHang
        .map((mon) =>
          mon.ma === ma
            ? { ...mon, soLuong: mon.soLuong + mucThayDoi }
            : mon
        )
        .filter((mon) => mon.soLuong > 0)
    );
  }

  function xoaMon(ma: number) {
    setGioHang(gioHang.filter((mon) => mon.ma !== ma));
  }

  function xoaTatCa() {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa toàn bộ giỏ hàng không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => setGioHang([]) },
      ]
    );
  }

  if (gioHang.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
        <Text style={styles.emptyText}>Hãy chọn món ăn yêu thích của bạn.</Text>
        <Pressable style={styles.orderButton} onPress={khiVeTrangChu}>
          <Text style={styles.orderText}>Xem thực đơn</Text>
        </Pressable>
      </View>
    );
  }

  let tongTien = 0;
  for (let viTri = 0; viTri < gioHang.length; viTri++) {
    tongTien = tongTien + gioHang[viTri].gia * gioHang[viTri].soLuong;
  }

  function datHang() {
    const donHangMoi: DonHang = {
      ma: Date.now(),
      cacMon: gioHang.map((mon) => ({
        ma: mon.ma,
        ten: mon.ten,
        soLuong: mon.soLuong,
      })),
      tongTien,
      trangThai: 'Đang chuẩn bị',
      ngayTao: new Date().toLocaleDateString('vi-VN'),
    };

    // Đơn hàng chỉ được tạo sau khi người dùng bấm Đặt suất ăn.
    themDonHang(donHangMoi);
    setGioHang([]);
    Alert.alert('Thành công', 'Đặt suất ăn thành công.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Giỏ hàng</Text>
          <Text style={styles.subtitle}>{gioHang.length} món ăn trong giỏ</Text>
        </View>
        <Pressable onPress={xoaTatCa}>
          <Text style={styles.clear}>Xóa tất cả</Text>
        </Pressable>
      </View>

      {gioHang.map((mon) => (
        <View style={styles.item} key={mon.ma}>
          <Image source={mon.hinhAnh} resizeMode="cover" style={styles.image} />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{mon.ten}</Text>
              <Pressable onPress={() => xoaMon(mon.ma)}>
                <Text style={styles.delete}>🗑 Xóa</Text>
              </Pressable>
            </View>
            <Text style={styles.price}>{dinhDangGia(mon.gia)}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.smallButton}
                onPress={() => thayDoiSoLuong(mon.ma, -1)}
              >
                <Text>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{mon.soLuong}</Text>
              <Pressable
                style={styles.smallButton}
                onPress={() => thayDoiSoLuong(mon.ma, 1)}
              >
                <Text>+</Text>
              </Pressable>
              <Text style={styles.subtotal}>
                {dinhDangGia(mon.gia * mon.soLuong)}
              </Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng cộng</Text>
        <Text style={styles.total}>{dinhDangGia(tongTien)}</Text>
      </View>
      <Pressable style={styles.orderButton} onPress={datHang}>
        <Text style={styles.orderText}>Đặt suất ăn</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#25282D' },
  subtitle: { color: '#858B94', marginTop: 5 },
  clear: { color: '#D85624', fontWeight: '700' },
  item: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 12,
  },
  image: { width: 76, height: 76, borderRadius: 11 },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700', fontSize: 16 },
  delete: { color: '#D85624', fontSize: 12 },
  price: { color: '#E86A33', marginTop: 5 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  smallButton: {
    width: 27,
    height: 27,
    borderRadius: 7,
    backgroundColor: '#FFF0E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: { width: 28, textAlign: 'center', fontWeight: '700' },
  subtotal: { marginLeft: 'auto', fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 18,
    marginTop: 12,
  },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  total: { fontSize: 20, fontWeight: '800', color: '#E86A33' },
  orderButton: {
    backgroundColor: '#E86A33',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 22,
  },
  orderText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: { fontSize: 58 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginTop: 14 },
  emptyText: { color: '#858B94', marginTop: 7 },
});
