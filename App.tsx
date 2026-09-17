import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ManHinhDangNhap from './src/screens/LoginScreen';
import ManHinhDangKy from './src/screens/RegisterScreen';
import ManHinhTrangChu from './src/screens/HomeScreen';
import ManHinhChiTietMon from './src/screens/FoodDetailScreen';
import ManHinhGioHang from './src/screens/CartScreen';
import ManHinhCaNhan from './src/screens/ProfileScreen';
import type { DonHang, MonAn, MonTrongGioHang, NguoiDung, TenManHinh } from './src/types';

export default function UngDung() {
  const [manHinh, setManHinh] = useState<TenManHinh>('dangNhap');
  const [nguoiDung, setNguoiDung] = useState<NguoiDung[]>([]);
  const [monDangChon, setMonDangChon] = useState<MonAn | null>(null);
  const [gioHang, setGioHang] = useState<MonTrongGioHang[]>([]);
  const [donHang, setDonHang] = useState<DonHang[]>([]);
  const [nguoiDungHienTai, setNguoiDungHienTai] = useState<NguoiDung | null>(null);

  if (manHinh === 'dangNhap') {
    return (
      <>
        <StatusBar style="dark" />
        <ManHinhDangNhap
          danhSachNguoiDung={nguoiDung}
          khiDangNhap={(taiKhoan) => {
            setNguoiDungHienTai(taiKhoan);
            setManHinh('trangChu');
          }}
          khiDangKy={() => setManHinh('dangKy')}
        />
      </>
    );
  }

  if (manHinh === 'dangKy') {
    return (
      <>
        <StatusBar style="dark" />
        <ManHinhDangKy
          khiDangKy={(taiKhoan) => {
            setNguoiDung([...nguoiDung, taiKhoan]);
            setManHinh('dangNhap');
          }}
          khiQuayLai={() => setManHinh('dangNhap')}
        />
      </>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />

      {manHinh === 'trangChu' && (
        <ManHinhTrangChu
          nguoiDungHienTai={nguoiDungHienTai}
          khiChonMon={(monAn) => {
            setMonDangChon(monAn);
            setManHinh('chiTiet');
          }}
        />
      )}

      {manHinh === 'chiTiet' && (
        <ManHinhChiTietMon
          monAn={monDangChon}
          gioHang={gioHang}
          setGioHang={setGioHang}
          khiQuayLai={() => setManHinh('trangChu')}
          khiXemGioHang={() => setManHinh('gioHang')}
        />
      )}

      {manHinh === 'gioHang' && (
        <ManHinhGioHang
          gioHang={gioHang}
          setGioHang={setGioHang}
          themDonHang={(donMoi) => setDonHang([donMoi, ...donHang])}
          khiVeTrangChu={() => setManHinh('trangChu')}
        />
      )}

      {manHinh === 'caNhan' && (
        <ManHinhCaNhan
          nguoiDungHienTai={nguoiDungHienTai}
          donHang={donHang}
          khiDangXuat={() => {
            setNguoiDungHienTai(null);
            setGioHang([]);
            setDonHang([]);
            setManHinh('dangNhap');
          }}
        />
      )}

      <View style={styles.menu}>
        <Pressable style={styles.menuButton} onPress={() => setManHinh('trangChu')}>
          <Text style={[styles.menuText, (manHinh === 'trangChu' || manHinh === 'chiTiet') && styles.active]}>
            ⌂{`\n`}Trang chủ
          </Text>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={() => setManHinh('gioHang')}>
          <Text style={[styles.menuText, manHinh === 'gioHang' && styles.active]}>
            🛒{`\n`}Giỏ hàng
          </Text>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={() => setManHinh('caNhan')}>
          <Text style={[styles.menuText, manHinh === 'caNhan' && styles.active]}>
            ♙{`\n`}Cá nhân
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#F7F8FA' },
  menu: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  menuButton: { flex: 1, alignItems: 'center' },
  menuText: { color: '#8A9099', fontSize: 12, lineHeight: 20, textAlign: 'center' },
  active: { color: '#E86A33', fontWeight: '700' },
});
