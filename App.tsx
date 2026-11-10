import { readSession, saveSession, readLocal, saveLocal } from './src/storage';
import { pendingOrder } from './src/orderJournal';
import { onUnauthorized } from './src/api';
import { apiFetch } from './src/api';
import Interactive from './src/components/Interactive';
import Icon, { IconName } from './src/components/Icon';
import { colors } from './src/styles/theme';
import StaffScreen from './src/screens/StaffScreen';
import { apiUrl as buildApiUrl } from './src/api';
import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ManHinhDangNhap from './src/screens/LoginScreen';
import ManHinhDangKy from './src/screens/RegisterScreen';
import ManHinhTrangChu from './src/screens/HomeScreen';
import ManHinhThucDon from './src/screens/MenuScreen';
import ManHinhChiTietMon from './src/screens/FoodDetailScreen';
import ManHinhGioHang from './src/screens/CartScreen';
import ManHinhCaNhan from './src/screens/ProfileScreen';
import ManHinhAdmin from './src/screens/AdminScreen';
import { layHinhAnhMonAn } from './src/data/foods';
import type { DonHang, MonAn, MonTrongGioHang, NguoiDung, TenManHinh } from './src/types';

export default function UngDung() {
  const { width } = useWindowDimensions();
  const laDesktop = width >= 1000;
  const [booting, setBooting] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [cartReady, setCartReady] = useState(false);
  const [manHinh, setManHinh] = useState<TenManHinh>('dangNhap');
  const [nguoiDung, setNguoiDung] = useState<NguoiDung[]>([]);
  const [monDangChon, setMonDangChon] = useState<MonAn | null>(null);
  const [danhSachMonAn, setDanhSachMonAn] = useState<MonAn[]>([]);
  const [loiMonAn, setLoiMonAn] = useState('');
  const [dangTaiMon, setDangTaiMon] = useState(false);
  const [gioHang, setCartState] = useState<MonTrongGioHang[]>([]);
  const [donHang, setDonHang] = useState<DonHang[]>([]);
  const [nguoiDungHienTai, setNguoiDungHienTai] = useState<NguoiDung | null>(null);
  const [hienMenuTaiKhoan, setHienMenuTaiKhoan] = useState(false);
  const cartRef = useRef(gioHang);
  const userRef = useRef(nguoiDungHienTai);
  userRef.current = nguoiDungHienTai;
  function setGioHang(value: MonTrongGioHang[] | ((old: MonTrongGioHang[]) => MonTrongGioHang[])) {
    const user = nguoiDungHienTai;
    if (!user || !cartReady) return;
    void (async () => {
      const pending = await pendingOrder(user.id, 'online');
      if (userRef.current?.id !== user.id) return;
      if (pending && (typeof value === 'function' || value.length > 0)) {
        setStorageError('Có đơn chưa xác định kết quả. Mở Giỏ hàng để kiểm tra trước khi sửa giỏ.'); return;
      }
      const next = typeof value === 'function' ? value(cartRef.current) : value;
      cartRef.current = next; setCartState(next);
      await saveLocal(`cart:${user.id}`, next.map(({ hinhAnh, ...item }) => item));
      setStorageError('');
    })().catch(() => setStorageError('Không lưu được giỏ hàng trên thiết bị. Vui lòng kiểm tra dung lượng/quyền lưu trữ.'));
  }
  useEffect(() => {
    let active = true;
    readSession().then(user => {
      if (!active) return;
      setNguoiDungHienTai(user);
      setManHinh(user?.role === 'admin' ? 'admin' : user?.role === 'staff' ? 'staff' : user ? 'trangChu' : 'dangNhap');
    }).catch(() => setStorageError('Không đọc được phiên đã lưu. Vui lòng đăng nhập lại.'))
      .finally(() => { if (active) setBooting(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setCartReady(false); cartRef.current = []; setCartState([]);
    const id = nguoiDungHienTai?.id;
    if (!id) return;
    Promise.all([readLocal<MonTrongGioHang[]>(`cart:${id}`), pendingOrder(id, 'online')]).then(([saved, pending]) => {
      if (!active) return;
      const cart = (saved || []).map(item => ({ ...item, hinhAnh: layHinhAnhMonAn(item.maHinhAnh || '') }));
      cartRef.current = cart; setCartState(cart); setCartReady(true);
      if (pending && nguoiDungHienTai.role === 'user') setManHinh('gioHang');
    }).catch(() => { if (active) setStorageError('Không đọc được giỏ/giao dịch đã lưu. Hãy mở lại ứng dụng; chưa thể đặt đơn mới.'); });
    return () => { active = false; };
  }, [nguoiDungHienTai?.id]);
  useEffect(() => onUnauthorized(token => {
    if (token !== userRef.current?.token) return;
    void saveSession(null).catch(() => setStorageError('Không xóa được phiên trên thiết bị.'));
    setNguoiDungHienTai(null); setDonHang([]); setManHinh('dangNhap');
  }), []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hienMenuTaiKhoan) { setHienMenuTaiKhoan(false); return true; }
      if (['chiTiet', 'gioHang', 'caNhan', 'thucDon', 'dangKy'].includes(manHinh)) {
        setManHinh(manHinh === 'dangKy' ? 'dangNhap' : manHinh === 'chiTiet' ? 'thucDon' : 'trangChu'); return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [manHinh, hienMenuTaiKhoan]);
  function luuNguoiDung(user: NguoiDung | null) {
    void saveSession(user).catch(() => setStorageError('Không lưu được phiên trên thiết bị.'));
  }


  const [cartNotice, setCartNotice] = useState('');
  const previousCart = useRef(gioHang);
  useEffect(() => {
    const added = gioHang.find(item => item.soLuong > (previousCart.current.find(old => old.ma === item.ma)?.soLuong || 0));
    if (added) setCartNotice(`Đã thêm ${added.ten} vào giỏ hàng.`);
    previousCart.current = gioHang;
  }, [gioHang]);
  useEffect(() => {
    if (!cartNotice) return;
    const timer = setTimeout(() => setCartNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [cartNotice, gioHang]);
  useEffect(() => { setHienMenuTaiKhoan(false); }, [manHinh]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !hienMenuTaiKhoan) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setHienMenuTaiKhoan(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [hienMenuTaiKhoan]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const duongDanDung = nguoiDungHienTai?.role === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== duongDanDung) {
      window.history.replaceState({}, '', duongDanDung);
    }
  }, [nguoiDungHienTai]);

  useEffect(() => {
    if (!nguoiDungHienTai?.token) return;
    const apiUrl = buildApiUrl('/api/me');
    apiFetch(apiUrl, { headers: { Authorization: `Bearer ${nguoiDungHienTai.token}` } })
      .then(async response => {
        if (!response.ok) return;
        const { user } = await response.json();
        if (!user) return;
        setNguoiDungHienTai(current => current && current.id === user.id && current.token === nguoiDungHienTai.token
          ? { ...current, gender: user.gender, dateOfBirth: user.date_of_birth } : current);
      })
      .catch(() => undefined);
  }, [nguoiDungHienTai?.token]);

  const catalogVersion = useRef(0);
  async function taiDanhSachMonAn() {
    const version = ++catalogVersion.current;
    const token = nguoiDungHienTai?.token;
    setDangTaiMon(true);
    const apiUrl = buildApiUrl(nguoiDungHienTai?.role === 'admin' ? '/api/admin/foods' : '/api/foods');
    try {
      const response = await apiFetch(apiUrl, { headers: nguoiDungHienTai ? { Authorization: `Bearer ${nguoiDungHienTai.token}` } : {} });
      const data = await response.json();
      if (version !== catalogVersion.current || token !== userRef.current?.token) return;
      if (!response.ok || !Array.isArray(data.foods)) throw new Error(data.message || 'Không thể tải món ăn');
      setLoiMonAn('');
      setDanhSachMonAn(data.foods.map((food: any) => {
        return {
          ma: food.id,
          ten: food.name,
          gia: Number(food.price),
          moTa: food.description,
          danhMuc: food.category,
          hinhAnh: layHinhAnhMonAn(food.image_key),
          soLuongTon: food.stock_quantity,
          conMon: Boolean(food.is_active) && food.stock_quantity > 0,
          dangBan: Boolean(food.is_active),
          maHinhAnh: food.image_key,
        } as MonAn;
      }));
    } catch {
      if (version !== catalogVersion.current || token !== userRef.current?.token) return;
      setLoiMonAn('Không thể tải thực đơn. Vui lòng thử lại.');
    } finally { if (version === catalogVersion.current) setDangTaiMon(false); }
  }

  useEffect(() => { taiDanhSachMonAn(); }, [nguoiDungHienTai?.role, nguoiDungHienTai?.token, manHinh]);

  useEffect(() => {
    if (!nguoiDungHienTai || nguoiDungHienTai.role !== 'user') return;
    const apiUrl = buildApiUrl('/api/orders');
    apiFetch(apiUrl, { headers: { Authorization: `Bearer ${nguoiDungHienTai.token}` } })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        const orders: DonHang[] = (data.orders || []).map((order: any) => ({
          ma: order.id,
          cacMon: order.items.map((item: any) => ({ ma: item.food_id, ten: item.food_name, gia: Number(item.price), soLuong: item.quantity })),
          tongTien: Number(order.total_amount),
          phone: order.phone,
          diaChiGiaoHang: order.delivery_address,
          ghiChu: order.note || '',
          trangThai: order.status,
          ngayTao: new Date(order.created_at).toLocaleString('vi-VN'),
        }));
        setDonHang(orders);
      })
      .catch(() => undefined);
  }, [nguoiDungHienTai]);

  function dangXuat() {
    const token = nguoiDungHienTai?.token;
    if (token) {
      const apiUrl = buildApiUrl('/api/logout');
      apiFetch(apiUrl, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }).catch(() => undefined);
    }
    luuNguoiDung(null);
    setHienMenuTaiKhoan(false);
    setNguoiDungHienTai(null);
    cartRef.current = []; setCartState([]);
    setDonHang([]);
    setManHinh('dangNhap');
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.history.replaceState({}, '', '/');
  }

  function chonMon(monAn: MonAn) {
    setMonDangChon(monAn);
    setManHinh('chiTiet');
  }

  function themMonVaoGio(monAn: MonAn) {
    if (!monAn.conMon || monAn.dangBan === false || monAn.soLuongTon <= 0) return;
    setGioHang((hienTai) => {
      const daCo = hienTai.find((mon) => mon.ma === monAn.ma);
      if ((daCo?.soLuong || 0) >= monAn.soLuongTon) return hienTai;
      return daCo
        ? hienTai.map((mon) => mon.ma === monAn.ma ? { ...monAn, soLuong: mon.soLuong + 1 } : mon)
        : [...hienTai, { ...monAn, soLuong: 1 }];
    });
  }

  if (booting || (nguoiDungHienTai && !cartReady)) return <View style={{ padding: 30 }}><Text>{storageError || 'Đang khôi phục dữ liệu…'}</Text></View>;

  if (manHinh === 'dangNhap') {
    return <><StatusBar style="dark" /><ManHinhDangNhap khiDangNhap={async (taiKhoan) => {
      await saveSession(taiKhoan);
      setNguoiDungHienTai(taiKhoan);
      const manHinhSauDangNhap = taiKhoan.role === 'admin' ? 'admin' : taiKhoan.role === 'staff' ? 'staff' : 'trangChu';
      setManHinh(manHinhSauDangNhap);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState({}, '', taiKhoan.role === 'admin' ? '/admin' : '/');
      }
    }} khiDangKy={() => setManHinh('dangKy')} /></>;
  }

  if (manHinh === 'dangKy') {
    return <><StatusBar style="dark" /><ManHinhDangKy khiDangKy={(taiKhoan) => { setNguoiDung([...nguoiDung, taiKhoan]); setManHinh('dangNhap'); }} khiQuayLai={() => setManHinh('dangNhap')} /></>;
  }

  if (manHinh === 'staff' && nguoiDungHienTai?.role === 'staff') return <StaffScreen token={nguoiDungHienTai.token} name={nguoiDungHienTai.hoTen} onLogout={dangXuat} />;

  // Route Admin chỉ hiển thị khi phiên đăng nhập thực sự có role admin.
  if (manHinh === 'admin') {
    if (!nguoiDungHienTai || nguoiDungHienTai.role !== 'admin') {
      luuNguoiDung(null);
      setManHinh('dangNhap');
      return null;
    }

    return <><StatusBar style="dark" /><ManHinhAdmin tenAdmin={nguoiDungHienTai.hoTen} token={nguoiDungHienTai.token} danhSachMonAn={danhSachMonAn} khiTaiLaiMonAn={taiDanhSachMonAn} khiDangXuat={dangXuat} loiMonAn={loiMonAn} dangTaiMon={dangTaiMon} /></>;
  }

  const ten = nguoiDungHienTai?.hoTen || 'Sinh viên';
  const chuCai = ten.split(' ').filter(Boolean).slice(-2).map((tu) => tu[0]).join('').toUpperCase() || 'SV';

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Interactive style={styles.brand} onPress={() => setManHinh('trangChu')}>
            <View style={styles.logo}><Text style={styles.logoText}>AC</Text></View>
            <Text style={styles.brandText}>APP <Text style={styles.orange}>CANTEEN</Text></Text>
          </Interactive>

          {laDesktop && (
            <View style={styles.desktopNav}>
              <NutDieuHuong icon="home" label="Trang chủ" dangChon={manHinh === 'trangChu'} khiNhan={() => setManHinh('trangChu')} />
              <NutDieuHuong icon="menu" label="Thực đơn" dangChon={manHinh === 'thucDon' || manHinh === 'chiTiet'} khiNhan={() => setManHinh('thucDon')} />
              <NutDieuHuong icon="cart" label="Giỏ hàng" dangChon={manHinh === 'gioHang'} khiNhan={() => setManHinh('gioHang')} soLuong={gioHang.reduce((tong, mon) => tong + mon.soLuong, 0)} />
            </View>
          )}

          <Interactive accessibilityLabel="Mở menu tài khoản" accessibilityState={{ expanded: hienMenuTaiKhoan }} style={styles.accountButton} onPress={() => setHienMenuTaiKhoan((giaTri) => !giaTri)}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{chuCai}</Text></View>
            {laDesktop && <><Text style={styles.accountName} numberOfLines={1}>{ten}</Text><Text style={styles.chevron}>⌄</Text></>}
          </Interactive>
        </View>
      </View>

      {hienMenuTaiKhoan && (
        <><Interactive accessibilityLabel="Đóng menu tài khoản" style={styles.menuBackdrop} onPress={() => setHienMenuTaiKhoan(false)} />
        <View style={[styles.accountMenu, { right: Math.max(16, (width - 1280) / 2 + 24), width: Math.min(280, width - 32) }]}>
          <Text style={styles.menuCaption}>TÀI KHOẢN CỦA BẠN</Text>
          <Text style={styles.menuName}>{ten}</Text>
          <Text style={styles.menuEmail}>{nguoiDungHienTai?.email}</Text>
          <View style={styles.divider} />
          <Interactive style={styles.menuItem} onPress={() => { setHienMenuTaiKhoan(false); setManHinh('caNhan'); }}><Icon name="user" /><Text style={styles.menuItemText}>Thông tin cá nhân</Text></Interactive>
          <Interactive style={styles.menuItem} onPress={dangXuat}><Text style={styles.logoutText}>Đăng xuất</Text></Interactive>
        </View></>
      )}

      {storageError !== '' && <Text accessibilityRole="alert" style={{ padding: 12, color: colors.red }}>{storageError}</Text>}
      <View style={styles.content}>
        {manHinh === 'trangChu' && <ManHinhTrangChu nguoiDungHienTai={nguoiDungHienTai} danhSachMonAn={danhSachMonAn} khiChonMon={chonMon} khiXemThucDon={() => setManHinh('thucDon')} gioHang={gioHang} khiThemVaoGio={themMonVaoGio} loading={dangTaiMon} error={loiMonAn} onRetry={taiDanhSachMonAn} />}
        {manHinh === 'thucDon' && <ManHinhThucDon danhSachMonAn={danhSachMonAn} khiChonMon={chonMon} gioHang={gioHang} khiThemVaoGio={themMonVaoGio} loading={dangTaiMon} error={loiMonAn} onRetry={taiDanhSachMonAn} />}
        {manHinh === 'chiTiet' && <ManHinhChiTietMon monAn={monDangChon} gioHang={gioHang} setGioHang={setGioHang} khiQuayLai={() => setManHinh('thucDon')} khiXemGioHang={() => setManHinh('gioHang')} />}
        {manHinh === 'gioHang' && <ManHinhGioHang gioHang={gioHang} setGioHang={setGioHang} nguoiDungHienTai={nguoiDungHienTai} themDonHang={(donMoi) => setDonHang([donMoi, ...donHang])} khiDatHangThanhCong={taiDanhSachMonAn} khiVeTrangChu={() => setManHinh('thucDon')} />}
        {manHinh === 'caNhan' && <ManHinhCaNhan nguoiDungHienTai={nguoiDungHienTai} donHang={donHang} khiCapNhatNguoiDung={(nguoiDungMoi) => { luuNguoiDung(nguoiDungMoi); setNguoiDungHienTai(nguoiDungMoi); }} khiDangXuat={dangXuat} />}
      </View>

      {cartNotice !== '' && <View style={[styles.toast, { bottom: laDesktop ? 24 : 84, maxWidth: Math.min(480, width - 32) }]} accessibilityLiveRegion="polite">
        <Text style={styles.toastText}>{cartNotice}</Text>
        <Interactive accessibilityLabel="Xem giỏ hàng" style={styles.toastAction} onPress={() => { setManHinh('gioHang'); setCartNotice(''); }}><Text style={styles.toastLink}>Xem giỏ</Text></Interactive>
      </View>}
      {!laDesktop && (
        <View style={styles.mobileNav}>
          <NutDieuHuong icon="home" label="Trang chủ" dangChon={manHinh === 'trangChu'} khiNhan={() => setManHinh('trangChu')} mobile />
          <NutDieuHuong icon="menu" label="Thực đơn" dangChon={manHinh === 'thucDon' || manHinh === 'chiTiet'} khiNhan={() => setManHinh('thucDon')} mobile />
          <NutDieuHuong icon="cart" label="Giỏ hàng" dangChon={manHinh === 'gioHang'} khiNhan={() => setManHinh('gioHang')} soLuong={gioHang.reduce((tong, mon) => tong + mon.soLuong, 0)} mobile />
        </View>
      )}
    </View>
  );
}

function NutDieuHuong({ icon, label, dangChon, khiNhan, soLuong = 0, mobile = false }: { icon: IconName; label: string; dangChon: boolean; khiNhan: () => void; soLuong?: number; mobile?: boolean }) {
  return (
    <Interactive accessibilityLabel={soLuong > 0 ? `${label}, ${soLuong} món trong giỏ` : label} accessibilityState={{ selected: dangChon }} style={[mobile ? styles.mobileNavButton : styles.navButton, dangChon && styles.navActive]} onPress={khiNhan}>
      <View><Icon name={icon} color={dangChon ? colors.primary : colors.muted} />{soLuong > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{soLuong > 99 ? '99+' : soLuong}</Text></View>}</View>
      <Text style={[styles.navText, dangChon && styles.navTextActive]}>{label}</Text>
    </Interactive>
  );
}

const styles = StyleSheet.create({
  menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 90, backgroundColor: 'rgba(20,30,40,0.12)' },
  menuCaption: { fontSize: 10, letterSpacing: 1, fontWeight: '700', color: colors.muted, marginBottom: 12 },
  toast: { position: 'absolute', right: 16, zIndex: 50, borderRadius: 14, paddingHorizontal: 16, backgroundColor: '#26362D', flexDirection: 'row', gap: 12, alignItems: 'center', shadowOpacity: 0.12, shadowRadius: 12 },
  toastText: { color: '#FFFFFF', flexShrink: 1, paddingVertical: 14, lineHeight: 20 },
  toastAction: { minHeight: 48, justifyContent: 'center' },
  toastLink: { color: '#FFE3B9', fontWeight: '700' },
  app: { flex: 1, backgroundColor: colors.background },
  header: { zIndex: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#FFFFFF' },
  headerInner: { width: '100%', maxWidth: 1280, minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.primary },
  logoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  brandText: { marginLeft: 9, color: '#171A1F', fontSize: 15, fontWeight: '900' },
  orange: { color: colors.primary },
  desktopNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navButton: { minHeight: 46, minWidth: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 12 },
  navActive: { backgroundColor: colors.soft },
  navIcon: { color: '#5D646E', fontSize: 18, textAlign: 'center' },
  navText: { color: '#5D646E', fontSize: 12, fontWeight: '600' },
  navTextActive: { color: colors.primary, fontWeight: '800' },
  accountButton: { minHeight: 44, borderRadius: 24, paddingHorizontal: 6, maxWidth: 205, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.primary },
  avatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  accountName: { maxWidth: 130, marginLeft: 9, color: '#3B4149', fontSize: 13, fontWeight: '700' },
  chevron: { marginLeft: 7, color: '#636A74' },
  content: { flex: 1, minHeight: 0 },
  accountMenu: { position: 'absolute', zIndex: 100, top: 76, right: 18, width: 280, padding: 18, borderWidth: 1, borderColor: '#E8EAED', borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: colors.text, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 10 },
  menuName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  menuEmail: { marginTop: 6, color: colors.muted, fontSize: 12 },
  divider: { height: 1, marginVertical: 11, backgroundColor: colors.border },
  menuItem: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 48, paddingHorizontal: 10, borderRadius: 10 },
  menuItemText: { color: '#3E444C', fontSize: 14, fontWeight: '600' },
  logoutText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  mobileNav: { minHeight: 72, paddingBottom: 6, paddingTop: 6, paddingHorizontal: 8, gap: 4, flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#FFFFFF' },
  mobileNavButton: { minHeight: 52, borderRadius: 14, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  badge: { position: 'absolute', top: -8, right: -11, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.primary },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
});
