import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ManHinhDangNhap from './src/screens/LoginScreen';
import ManHinhDangKy from './src/screens/RegisterScreen';
import ManHinhTrangChu from './src/screens/HomeScreen';
import ManHinhThucDon from './src/screens/MenuScreen';
import ManHinhChiTietMon from './src/screens/FoodDetailScreen';
import ManHinhGioHang from './src/screens/CartScreen';
import ManHinhCaNhan from './src/screens/ProfileScreen';
import type { DonHang, MonAn, MonTrongGioHang, NguoiDung, TenManHinh } from './src/types';

const KHOA_PHIEN_DANG_NHAP = 'smart-canteen-user';

function layNguoiDungDaLuu(): NguoiDung | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  try {
    const duLieu = window.localStorage.getItem(KHOA_PHIEN_DANG_NHAP);
    if (!duLieu) return null;
    const nguoiDung = JSON.parse(duLieu) as Partial<NguoiDung>;
    if (!nguoiDung.hoTen || !nguoiDung.maSinhVien || !nguoiDung.email) return null;
    return { hoTen: nguoiDung.hoTen, maSinhVien: nguoiDung.maSinhVien, email: nguoiDung.email };
  } catch {
    return null;
  }
}

function luuNguoiDung(nguoiDung: NguoiDung | null) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  try {
    if (nguoiDung) {
      const duLieuAnToan = { hoTen: nguoiDung.hoTen, maSinhVien: nguoiDung.maSinhVien, email: nguoiDung.email };
      window.localStorage.setItem(KHOA_PHIEN_DANG_NHAP, JSON.stringify(duLieuAnToan));
    } else {
      window.localStorage.removeItem(KHOA_PHIEN_DANG_NHAP);
    }
  } catch {
    // Trình duyệt có thể chặn localStorage ở chế độ riêng tư; đăng nhập vẫn hoạt động trong phiên hiện tại.
  }
}

export default function UngDung() {
  const { width } = useWindowDimensions();
  const laDesktop = width >= 760;
  const [phienDangNhapBanDau] = useState<NguoiDung | null>(() => layNguoiDungDaLuu());
  const [manHinh, setManHinh] = useState<TenManHinh>(() => phienDangNhapBanDau ? 'trangChu' : 'dangNhap');
  const [nguoiDung, setNguoiDung] = useState<NguoiDung[]>([]);
  const [monDangChon, setMonDangChon] = useState<MonAn | null>(null);
  const [gioHang, setGioHang] = useState<MonTrongGioHang[]>([]);
  const [donHang, setDonHang] = useState<DonHang[]>([]);
  const [nguoiDungHienTai, setNguoiDungHienTai] = useState<NguoiDung | null>(phienDangNhapBanDau);
  const [hienMenuTaiKhoan, setHienMenuTaiKhoan] = useState(false);

  function dangXuat() {
    luuNguoiDung(null);
    setHienMenuTaiKhoan(false);
    setNguoiDungHienTai(null);
    setGioHang([]);
    setDonHang([]);
    setManHinh('dangNhap');
  }

  function chonMon(monAn: MonAn) {
    setMonDangChon(monAn);
    setManHinh('chiTiet');
  }

  if (manHinh === 'dangNhap') {
    return <><StatusBar style="dark" /><ManHinhDangNhap khiDangNhap={(taiKhoan) => { luuNguoiDung(taiKhoan); setNguoiDungHienTai(taiKhoan); setManHinh('trangChu'); }} khiDangKy={() => setManHinh('dangKy')} /></>;
  }

  if (manHinh === 'dangKy') {
    return <><StatusBar style="dark" /><ManHinhDangKy khiDangKy={(taiKhoan) => { setNguoiDung([...nguoiDung, taiKhoan]); setManHinh('dangNhap'); }} khiQuayLai={() => setManHinh('dangNhap')} /></>;
  }

  const ten = nguoiDungHienTai?.hoTen || 'Sinh viên';
  const chuCai = ten.split(' ').filter(Boolean).slice(-2).map((tu) => tu[0]).join('').toUpperCase() || 'SV';

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Pressable style={styles.brand} onPress={() => setManHinh('trangChu')}>
            <View style={styles.logo}><Text style={styles.logoText}>SC</Text></View>
            <Text style={styles.brandText}>SMART <Text style={styles.orange}>CANTEEN</Text></Text>
          </Pressable>

          {laDesktop && (
            <View style={styles.desktopNav}>
              <NutDieuHuong icon="⌂" label="Trang chủ" dangChon={manHinh === 'trangChu'} khiNhan={() => setManHinh('trangChu')} />
              <NutDieuHuong icon="♨" label="Thực đơn" dangChon={manHinh === 'thucDon' || manHinh === 'chiTiet'} khiNhan={() => setManHinh('thucDon')} />
              <NutDieuHuong icon="🛒" label="Giỏ hàng" dangChon={manHinh === 'gioHang'} khiNhan={() => setManHinh('gioHang')} soLuong={gioHang.reduce((tong, mon) => tong + mon.soLuong, 0)} />
            </View>
          )}

          <Pressable style={styles.accountButton} onPress={() => setHienMenuTaiKhoan((giaTri) => !giaTri)}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{chuCai}</Text></View>
            {laDesktop && <><Text style={styles.accountName} numberOfLines={1}>{ten}</Text><Text style={styles.chevron}>⌄</Text></>}
          </Pressable>
        </View>
      </View>

      {hienMenuTaiKhoan && (
        <View style={styles.accountMenu}>
          <Text style={styles.menuName}>{ten}</Text>
          <Text style={styles.menuEmail}>{nguoiDungHienTai?.email}</Text>
          <View style={styles.divider} />
          <Pressable style={styles.menuItem} onPress={() => { setHienMenuTaiKhoan(false); setManHinh('caNhan'); }}><Text style={styles.menuItemText}>♙  Thông tin cá nhân</Text></Pressable>
          <Pressable style={styles.menuItem} onPress={dangXuat}><Text style={styles.logoutText}>↪  Đăng xuất</Text></Pressable>
        </View>
      )}

      <View style={styles.content}>
        {manHinh === 'trangChu' && <ManHinhTrangChu nguoiDungHienTai={nguoiDungHienTai} khiChonMon={chonMon} khiXemThucDon={() => setManHinh('thucDon')} />}
        {manHinh === 'thucDon' && <ManHinhThucDon khiChonMon={chonMon} />}
        {manHinh === 'chiTiet' && <ManHinhChiTietMon monAn={monDangChon} gioHang={gioHang} setGioHang={setGioHang} khiQuayLai={() => setManHinh('thucDon')} khiXemGioHang={() => setManHinh('gioHang')} />}
        {manHinh === 'gioHang' && <ManHinhGioHang gioHang={gioHang} setGioHang={setGioHang} themDonHang={(donMoi) => setDonHang([donMoi, ...donHang])} khiVeTrangChu={() => setManHinh('thucDon')} />}
        {manHinh === 'caNhan' && <ManHinhCaNhan nguoiDungHienTai={nguoiDungHienTai} donHang={donHang} khiDangXuat={dangXuat} />}
      </View>

      {!laDesktop && (
        <View style={styles.mobileNav}>
          <NutDieuHuong icon="⌂" label="Trang chủ" dangChon={manHinh === 'trangChu'} khiNhan={() => setManHinh('trangChu')} mobile />
          <NutDieuHuong icon="♨" label="Thực đơn" dangChon={manHinh === 'thucDon' || manHinh === 'chiTiet'} khiNhan={() => setManHinh('thucDon')} mobile />
          <NutDieuHuong icon="🛒" label="Giỏ hàng" dangChon={manHinh === 'gioHang'} khiNhan={() => setManHinh('gioHang')} soLuong={gioHang.reduce((tong, mon) => tong + mon.soLuong, 0)} mobile />
        </View>
      )}
    </View>
  );
}

function NutDieuHuong({ icon, label, dangChon, khiNhan, soLuong = 0, mobile = false }: { icon: string; label: string; dangChon: boolean; khiNhan: () => void; soLuong?: number; mobile?: boolean }) {
  return (
    <Pressable style={[mobile ? styles.mobileNavButton : styles.navButton, dangChon && styles.navActive]} onPress={khiNhan}>
      <View><Text style={[styles.navIcon, dangChon && styles.navTextActive]}>{icon}</Text>{soLuong > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{soLuong}</Text></View>}</View>
      <Text style={[styles.navText, dangChon && styles.navTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { zIndex: 20, borderBottomWidth: 1, borderBottomColor: '#ECEEF1', backgroundColor: '#FFFFFF' },
  headerInner: { width: '100%', maxWidth: 1240, height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', paddingHorizontal: 18 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#FF6629' },
  logoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  brandText: { marginLeft: 9, color: '#171A1F', fontSize: 15, fontWeight: '900' },
  orange: { color: '#F15F24' },
  desktopNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navButton: { minWidth: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 22 },
  navActive: { backgroundColor: '#FFF0E9' },
  navIcon: { color: '#5D646E', fontSize: 18, textAlign: 'center' },
  navText: { color: '#5D646E', fontSize: 13, fontWeight: '600' },
  navTextActive: { color: '#F15F24', fontWeight: '800' },
  accountButton: { maxWidth: 205, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#FF6629' },
  avatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  accountName: { maxWidth: 130, marginLeft: 9, color: '#3B4149', fontSize: 13, fontWeight: '700' },
  chevron: { marginLeft: 7, color: '#636A74' },
  content: { flex: 1 },
  accountMenu: { position: 'absolute', zIndex: 100, top: 60, right: 18, width: 230, padding: 14, borderWidth: 1, borderColor: '#E8EAED', borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: '#20242A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 10 },
  menuName: { color: '#20242A', fontSize: 15, fontWeight: '800' },
  menuEmail: { marginTop: 3, color: '#8A9099', fontSize: 12 },
  divider: { height: 1, marginVertical: 11, backgroundColor: '#ECEEF1' },
  menuItem: { paddingVertical: 10 },
  menuItemText: { color: '#3E444C', fontSize: 14, fontWeight: '600' },
  logoutText: { color: '#D85624', fontSize: 14, fontWeight: '700' },
  mobileNav: { height: 66, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  mobileNavButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  badge: { position: 'absolute', top: -8, right: -11, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderRadius: 9, backgroundColor: '#F15F24' },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
});
