import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { DonHang, NguoiDung } from '../types';

interface ThuocTinhCaNhan {
  nguoiDungHienTai: NguoiDung | null;
  donHang: DonHang[];
  khiDangXuat: () => void;
}

export default function ManHinhCaNhan({ nguoiDungHienTai, donHang, khiDangXuat }: ThuocTinhCaNhan) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profile}>
        <Image
          source={require('../../assets/images/cantin.jpg')}
          style={styles.avatar}
        />
        <Text style={styles.name}>{nguoiDungHienTai?.hoTen || 'Sinh viên'}</Text>
        <Text style={styles.mssv}>
          MSSV: {nguoiDungHienTai?.maSinhVien || 'Chưa cập nhật'}
        </Text>
        <Text style={styles.email}>
          {nguoiDungHienTai?.email || 'Chưa cập nhật'}
        </Text>
      </View>

      <Text style={styles.heading}>Đơn hàng gần đây</Text>

      {donHang.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
          <Text style={styles.emptyText}>
            Đơn hàng sẽ xuất hiện ở đây sau khi bạn đặt món.
          </Text>
        </View>
      ) : (
        donHang.map((don, viTri) => (
          <View style={styles.order} key={don.ma}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>
                Đơn #{String(donHang.length - viTri).padStart(3, '0')}
              </Text>
              <Text style={styles.date}>{don.ngayTao}</Text>
            </View>
            {don.cacMon.map((mon) => (
              <Text style={styles.itemText} key={mon.ma}>
                {mon.ten} x{mon.soLuong}
              </Text>
            ))}
            <Text style={styles.total}>Tổng tiền: {dinhDangGia(don.tongTien)}</Text>
            <Text style={styles.status}>Trạng thái: {don.trangThai}</Text>
          </View>
        ))
      )}

      <Pressable style={styles.logout} onPress={khiDangXuat}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  profile: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  mssv: { color: '#656C76', marginTop: 5 },
  email: { color: '#858B94', marginTop: 4 },
  heading: { fontSize: 20, fontWeight: '800', marginTop: 26, marginBottom: 12 },
  emptyOrders: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
  },
  emptyIcon: { fontSize: 38 },
  emptyTitle: { fontWeight: '800', fontSize: 17, marginTop: 10 },
  emptyText: { color: '#858B94', textAlign: 'center', marginTop: 7 },
  order: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: { fontWeight: '800' },
  date: { color: '#858B94', fontSize: 12 },
  itemText: { marginBottom: 4, color: '#454A52' },
  total: { fontWeight: '700', marginTop: 7 },
  status: { color: '#E86A33', marginTop: 7 },
  logout: {
    borderWidth: 1,
    borderColor: '#E86A33',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: { color: '#D85624', fontWeight: '700' },
});
