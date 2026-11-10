import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../api';
import OrdersPanel from '../components/OrdersPanel';
import AccountsPanel from '../components/AccountsPanel';
import { Action, ui } from '../components/OperationsUI';
import { request } from '../api';
import CounterScreen from './CounterScreen';
import { apiUrl as buildApiUrl } from '../api';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { danhSachHinhAnh, dinhDangGia, layHinhAnhMonAn } from '../data/foods';
import FoodImage from '../components/FoodImage';
import type { MonAn } from '../types';

interface ThuocTinhAdmin {
  tenAdmin: string;
  token: string;
  danhSachMonAn: MonAn[];
  khiTaiLaiMonAn: () => Promise<void>;
  khiDangXuat: () => void;
  loiMonAn: string;
  dangTaiMon: boolean;
}

type TrangAdmin = 'tongQuan' | 'monAn' | 'nguoiDung' | 'donHang' | 'counter';

interface DashboardData {
  todayRevenue: number;
  totalFoods: number;
  totalUsers: number;
  todayOrders: number;
  popularFoods: { id: number; name: string; price: number; sold_quantity: number }[];
  recentOrders: { id: number; customer_name: string; total_amount: number; status: string; created_at: string }[];
  ordersByDay: { order_date: string; total: number }[];
}

const tenTrangThai: Record<string, string> = {
  pending: 'Chờ xác nhận', preparing: 'Đang chuẩn bị', ready: 'Sẵn sàng nhận', delivering: 'Đang giao (đơn cũ)',
  completed: 'Hoàn thành', cancelled: 'Đã hủy',
};


export default function ManHinhAdmin({ tenAdmin, token, danhSachMonAn, khiTaiLaiMonAn, khiDangXuat, loiMonAn, dangTaiMon }: ThuocTinhAdmin) {
  const { width } = useWindowDimensions();
  const laDesktop = width >= 960;
  const laManHinhNho = width < 640;
  const chuCai = tenAdmin.trim().charAt(0).toUpperCase() || 'A';
  const [trang, setTrang] = useState<TrangAdmin>('tongQuan');
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData>({ todayRevenue: 0, totalFoods: 0, totalUsers: 0, todayOrders: 0, popularFoods: [], recentOrders: [], ordersByDay: [] });

  useEffect(() => { if (trang === 'monAn') khiTaiLaiMonAn(); }, [trang]);

  async function taiDashboard() {
    const apiUrl = buildApiUrl('/api/admin/dashboard');
    try {
      const response = await apiFetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setDashboard(data); setDashboardError('');
    } catch {
      setDashboardError('Không tải được thống kê.');
    } finally { setDashboardLoading(false); }
  }

  useEffect(() => {
    taiDashboard();
  }, [token, trang]);

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.layout}>
        {laDesktop && (
          <View style={styles.sidebar}>
            <Logo />
            <View style={styles.sideNav}>
              <MucMenu icon="⌂" label="Tổng quan" dangChon={trang === 'tongQuan'} khiNhan={() => setTrang('tongQuan')} />
              <MucMenu icon="♨" label="Quản lý món ăn" dangChon={trang === 'monAn'} khiNhan={() => setTrang('monAn')} />
              <MucMenu icon="♙" label="Quản lý người dùng" dangChon={trang === 'nguoiDung'} khiNhan={() => setTrang('nguoiDung')} />
              <MucMenu icon="₫" label="Bán tại quầy" dangChon={trang === 'counter'} khiNhan={() => setTrang('counter')} />
              <MucMenu icon="▤" label="Quản lý đơn hàng" dangChon={trang === 'donHang'} khiNhan={() => setTrang('donHang')} />
            </View>
            <Pressable style={styles.logoutSide} onPress={khiDangXuat}>
              <Text style={styles.logoutIcon}>↪</Text>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.main}>
          <View style={styles.topbar}>
            <View style={styles.topbarLeft}>
              {!laDesktop && <Logo gon />}
              {laDesktop && <Text style={styles.menuToggle}>☰</Text>}
            </View>
            <View style={styles.adminProfile}>
              <Text style={styles.bell}>♧</Text>
              <View style={styles.avatar}><Text style={styles.avatarText}>{chuCai}</Text></View>
              {!laManHinhNho && <Text style={styles.adminName}>{tenAdmin}</Text>}
<Action onPress={khiDangXuat}>Đăng xuất</Action>
            </View>
          </View>

          {!laDesktop && (
            <View style={styles.mobileNav}>
              <MucMenu icon="⌂" label="Tổng quan" dangChon={trang === 'tongQuan'} khiNhan={() => setTrang('tongQuan')} />
              <MucMenu icon="♨" label="Món ăn" dangChon={trang === 'monAn'} khiNhan={() => setTrang('monAn')} />
              <MucMenu icon="♙" label="Người dùng" dangChon={trang === 'nguoiDung'} khiNhan={() => setTrang('nguoiDung')} />
              <MucMenu icon="₫" label="Bán tại quầy" dangChon={trang === 'counter'} khiNhan={() => setTrang('counter')} />
              <MucMenu icon="▤" label="Đơn hàng" dangChon={trang === 'donHang'} khiNhan={() => setTrang('donHang')} />
            </View>
          )}

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {trang === 'monAn' && <><Action onPress={khiTaiLaiMonAn}>Làm mới món ăn</Action>{dangTaiMon && <Text>Đang tải món…</Text>}{loiMonAn !== '' && <Text style={ui.error}>{loiMonAn}</Text>}</>}
            {trang === 'tongQuan' && <><Action onPress={taiDashboard}>Làm mới thống kê</Action>{dashboardLoading && <Text>Đang tải thống kê…</Text>}{dashboardError !== '' && <Text style={ui.error}>{dashboardError}</Text>}</>}
            {trang === 'tongQuan' && !dashboardLoading && !dashboardError && <TrangTongQuan tenAdmin={tenAdmin} laDesktop={laDesktop} laManHinhNho={laManHinhNho} danhSachMonAn={danhSachMonAn} dashboard={dashboard} />}
            {trang === 'monAn' && <TrangQuanLyMonAn danhSachMonAn={danhSachMonAn} token={token} khiTaiLai={khiTaiLaiMonAn} khiTaiLaiDashboard={taiDashboard} />}
            {trang === 'nguoiDung' && <AccountsPanel token={token} />}
            {trang === 'donHang' && <OrdersPanel token={token} management onChanged={khiTaiLaiMonAn} />}
            {trang === 'counter' && <CounterScreen token={token} />}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TrangTongQuan({ tenAdmin, laDesktop, laManHinhNho, danhSachMonAn, dashboard }: { tenAdmin: string; laDesktop: boolean; laManHinhNho: boolean; danhSachMonAn: MonAn[]; dashboard: DashboardData }) {
  const thongKe = [
    { icon: '₫', label: 'Tiền mặt thu hôm nay', value: dinhDangGia(dashboard.todayRevenue), note: 'Chỉ đơn đã ghi nhận thanh toán', color: '#18A957', pale: '#EAF8EF' },
    { icon: '♨', label: 'Tổng số món ăn', value: String(dashboard.totalFoods), note: 'Dữ liệu từ MySQL', color: '#FF5B16', pale: '#FFF0E9' },
    { icon: '♙', label: 'Tổng người dùng', value: String(dashboard.totalUsers), note: 'Tài khoản User', color: '#1677FF', pale: '#EAF3FF' },
    { icon: '▤', label: 'Đơn hàng hôm nay', value: String(dashboard.todayOrders), note: 'Theo lần tải gần nhất', color: '#18A957', pale: '#EAF8EF' },
  ];
  const monPhoBien = dashboard.popularFoods.map((food) => ({ ...food, local: danhSachMonAn.find((mon) => mon.ma === food.id) }));
  const duLieuBieuDo = dashboard.ordersByDay;
  const maxDonHang = Math.max(1, ...duLieuBieuDo.map((item) => item.total));
  return (
    <>
      <Text style={styles.title}>Tổng quan</Text>
      <Text style={styles.welcome}>Chào mừng bạn trở lại, {tenAdmin}! 👋</Text>

      <View style={styles.statsGrid}>
              {thongKe.map((item) => (
                <View key={item.label} style={[styles.statCard, laManHinhNho && styles.statCardMobile]}>
                  <View style={[styles.statIcon, { backgroundColor: item.pale }]}>
                    <Text style={[styles.statIconText, { color: item.color }]}>{item.icon}</Text>
                  </View>
                  <View style={styles.statCopy}>
                    <Text style={styles.statLabel}>{item.label}</Text>
                    <Text style={styles.statValue}>{item.value}</Text>
                    <Text style={[styles.statNote, { color: item.color }]}>{item.note}</Text>
                  </View>
                </View>
              ))}
      </View>

      <View style={[styles.dashboardRow, !laDesktop && styles.dashboardColumn]}>
              <View style={[styles.panel, styles.popularPanel, !laDesktop && styles.fullWidth]}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Món ăn phổ biến</Text>

                </View>
                {monPhoBien.map((food) => (
                  <View key={food.id} style={styles.foodRow}>
                    {food.local && <FoodImage source={food.local.hinhAnh} name={food.name} drink={food.local.danhMuc === 'Đồ uống'} style={styles.foodImage} />}
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodPrice}>{dinhDangGia(food.price)}</Text>
                    </View>
                    <Text style={styles.sold}>Đã bán: {food.sold_quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.rightColumn, !laDesktop && styles.fullWidth]}>
                <View style={styles.panel}>
                  <Text style={styles.panelTitlePadded}>Thống kê đơn hàng (7 ngày qua)</Text>
                  <View style={styles.chart}>
                    {duLieuBieuDo.map((item) => (
                      <View key={item.order_date} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View style={[styles.bar, { height: `${(item.total / maxDonHang) * 100}%` }]} />
                        </View>
                        <Text style={styles.barLabel}>{item.order_date}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={[styles.panel, styles.ordersPanel]}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Đơn hàng gần đây</Text>

                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.table}>
                      <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.codeCell]}>Mã đơn</Text>
                        <Text style={[styles.tableCell, styles.personCell]}>Người đặt</Text>
                        <Text style={styles.tableCell}>Tổng tiền</Text>
                        <Text style={[styles.tableCell, styles.statusCell]}>Trạng thái</Text>
                        <Text style={[styles.tableCell, styles.timeCell]}>Thời gian</Text>
                      </View>
                      {dashboard.recentOrders.map((don) => (
                        <View key={don.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.codeCell, styles.strong]}>#DH{don.id}</Text>
                          <Text style={[styles.tableCell, styles.personCell]}>{don.customer_name}</Text>
                          <Text style={styles.tableCell}>{dinhDangGia(don.total_amount)}</Text>
                          <View style={[styles.statusCell, styles.statusWrap]}>
                            <Text style={styles.status}>{tenTrangThai[don.status] || don.status}</Text>
                          </View>
                          <Text style={[styles.tableCell, styles.timeCell]}>{new Date(don.created_at).toLocaleString('vi-VN')}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
      </View>
    </>
  );
}

function TrangQuanLyMonAn({ danhSachMonAn, token, khiTaiLai, khiTaiLaiDashboard }: { danhSachMonAn: MonAn[]; token: string; khiTaiLai: () => Promise<void>; khiTaiLaiDashboard: () => Promise<void> }) {
  const danhMuc = ['Cơm', 'Mì', 'Đồ uống', 'Ăn vặt', 'Món khác'] as const;
  const [editing, setEditing] = useState<MonAn | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [active, setActive] = useState(true);
  const [stockBusy, setStockBusy] = useState(false);
  const [hienFormThem, setHienFormThem] = useState(false);
  const [tenMon, setTenMon] = useState('');
  const [loaiMon, setLoaiMon] = useState<(typeof danhMuc)[number]>('Cơm');
  const [moTa, setMoTa] = useState('');
  const [gia, setGia] = useState('');
  const [soLuong, setSoLuong] = useState('');
  const [maHinhAnh, setMaHinhAnh] = useState('');
  const [tenTepAnh, setTenTepAnh] = useState('');
  const [dangTaiAnh, setDangTaiAnh] = useState(false);
  const [dangThem, setDangThem] = useState(false);
  const [loiThemMon, setLoiThemMon] = useState('');

  function dongFormThem() {
    if (!dangThem && !dangTaiAnh) setHienFormThem(false);
  }

  async function chonAnhTuMay() {
    if (Platform.OS !== 'web') {
      try {
        const selected = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: false });
        if (selected.canceled) return;
        const asset = selected.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) throw new Error('Ảnh không được vượt quá 5 MB.');
        const type = asset.mimeType || 'image/jpeg';
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
        const body = new FormData();
        body.append('image', { uri: asset.uri, name: asset.fileName || 'food.jpg', type } as any);
        setDangTaiAnh(true); setLoiThemMon('');
        const response = await apiFetch(buildApiUrl('/api/admin/food-images'), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Không thể tải ảnh.');
        setMaHinhAnh(data.image_key); setTenTepAnh(asset.fileName || 'Ảnh từ thư viện');
      } catch (error) { setLoiThemMon(error instanceof Error ? error.message : 'Không chọn được ảnh.'); }
      finally { setDangTaiAnh(false); }
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setLoiThemMon('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.'); return;
      }
      if (file.size > 5 * 1024 * 1024) { setLoiThemMon('Ảnh không được vượt quá 5 MB.'); return; }
      const body = new FormData(); body.append('image', file);
      try {
        setDangTaiAnh(true); setLoiThemMon('');
        const response = await apiFetch(buildApiUrl('/api/admin/food-images'), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Không thể tải ảnh lên.');
        setMaHinhAnh(data.image_key);
        setTenTepAnh(file.name);
      } catch (error) {
        setLoiThemMon(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
      } finally { setDangTaiAnh(false); }
    };
    input.click();
  }

  async function themMonAn() {
    const price = Number(gia);
    const stockQuantity = Number(soLuong);
    if (!tenMon.trim() || !moTa.trim()) {
      setLoiThemMon('Vui lòng nhập tên món và mô tả.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setLoiThemMon('Giá món ăn phải lớn hơn 0.');
      return;
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setLoiThemMon('Số lượng phải là số nguyên không âm.');
      return;
    }
    if (!maHinhAnh) {
      setLoiThemMon('Vui lòng tải ảnh lên hoặc chọn một ảnh có sẵn.');
      return;
    }

    const apiUrl = buildApiUrl(editing ? `/api/admin/foods/${editing.ma}` : '/api/admin/foods');
    try {
      setDangThem(true);
      setLoiThemMon('');
      const response = await apiFetch(apiUrl, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: tenMon.trim(), category: loaiMon, description: moTa.trim(),
          price, stock_quantity: stockQuantity, image_key: maHinhAnh, is_active: active,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoiThemMon(data.message || 'Không thể thêm món ăn.');
        return;
      }
      await khiTaiLai();
      await khiTaiLaiDashboard();
      setTenMon(''); setMoTa(''); setGia(''); setSoLuong('');
      setLoaiMon('Cơm'); setMaHinhAnh(''); setTenTepAnh(''); setHienFormThem(false);
    } catch {
      setLoiThemMon('Không thể kết nối đến server.');
    } finally {
      setDangThem(false);
    }
  }

  async function thayDoiTonKho(mon: MonAn, delta: number) {
    setStockBusy(true); setLoiThemMon('');
    try {
      await request(`/api/admin/foods/${mon.ma}/stock`, token, { method: 'PUT', body: JSON.stringify({ delta }) });
      await khiTaiLai();
    } catch (e) { setLoiThemMon(e instanceof Error ? e.message : 'Không thể cập nhật tồn kho.'); }
    finally { setStockBusy(false); }
  }
  function edit(mon: MonAn) {
    setEditing(mon); setTenMon(mon.ten); setMoTa(mon.moTa); setGia(String(mon.gia));
    setSoLuong(String(mon.soLuongTon)); setLoaiMon(mon.danhMuc); setMaHinhAnh(mon.maHinhAnh || 'com-ga');
    setTenTepAnh('Ảnh hiện tại của món');
    setActive(mon.dangBan !== false); setLoiThemMon(''); setHienFormThem(true);
  }
  const visibleFoods = danhSachMonAn.filter(mon => mon.ten.toLowerCase().includes(search.toLowerCase())
    && (categoryFilter === 'Tất cả' || mon.danhMuc === categoryFilter)
    && (activeFilter === 'Tất cả' || (activeFilter === 'Đang bán' ? mon.dangBan !== false : mon.dangBan === false)));

  function trangThaiTonKho(mon: MonAn) {
    if (mon.dangBan === false) return 'Ngừng bán';
    if (mon.soLuongTon === 0) return 'Hết hàng';
    if (mon.soLuongTon < 5) return 'Cần thêm hàng';
    return 'Còn hàng';
  }

  return (
    <>
      <View style={styles.pageHeading}>
        <View>
          <Text style={styles.title}>Quản lý món ăn</Text>
          <Text style={styles.welcome}>Thêm, sửa, ngừng bán và quản lý tồn kho</Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={() => { setLoiThemMon(''); setEditing(null); setTenMon(''); setMoTa(''); setGia(''); setSoLuong('0'); setMaHinhAnh(''); setTenTepAnh(''); setActive(true); setHienFormThem(true); }}><Text style={styles.primaryButtonText}>＋ Thêm món ăn</Text></Pressable>
      </View>
      <View style={[styles.panel, styles.managementPanel]}>
        <View style={styles.filters}>
          <TextInput value={search} onChangeText={setSearch} style={styles.searchInput} placeholder="Tìm kiếm món ăn..." placeholderTextColor="#8A96A6" />
          <View style={ui.row}>{['Tất cả', ...danhMuc].map(value => <Action key={value} onPress={() => setCategoryFilter(value)}>{categoryFilter === value ? '✓ ' : ''}{value}</Action>)}</View>
          <View style={ui.row}>{['Tất cả', 'Đang bán', 'Ngừng bán'].map(value => <Action key={value} onPress={() => setActiveFilter(value)}>{activeFilter === value ? '✓ ' : ''}{value}</Action>)}</View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.manageTable, styles.foodTable]}>
            <View style={[styles.manageRow, styles.tableHeader]}>
              <Text style={[styles.manageCell, styles.imageCell]}>Ảnh</Text>
              <Text style={[styles.manageCell, styles.foodNameCell]}>Tên món</Text>
              <Text style={styles.manageCell}>Danh mục</Text>
              <Text style={styles.manageCell}>Giá</Text>
              <Text style={styles.manageCell}>Số lượng</Text>
              <Text style={styles.manageCell}>Trạng thái</Text>
              <Text style={styles.manageCell}>Thao tác</Text>
            </View>
            {visibleFoods.map((mon) => (
              <View key={mon.ma} style={styles.manageRow}>
                <View style={[styles.manageCell, styles.imageCell]}><FoodImage source={mon.hinhAnh} name={mon.ten} drink={mon.danhMuc === 'Đồ uống'} style={styles.manageImage} /></View>
                <Text style={[styles.manageCell, styles.foodNameCell, styles.strong]}>{mon.ten}</Text>
                <Text style={styles.manageCell}>{mon.danhMuc}</Text>
                <Text style={styles.manageCell}>{dinhDangGia(mon.gia)}</Text>
                <Text style={[styles.manageCell, styles.stockNumber]}>{mon.soLuongTon}</Text>
                <View style={styles.manageCell}><Text style={[styles.availability, mon.soLuongTon === 0 && styles.outOfStock, mon.soLuongTon > 0 && mon.soLuongTon < 5 && styles.lowStock]}>{trangThaiTonKho(mon)}</Text></View>
                <View style={[styles.manageCell, styles.actions]}>
                  <Action onPress={() => edit(mon)}>Sửa</Action>
                  <Pressable disabled={stockBusy} style={styles.stockButton} onPress={() => thayDoiTonKho(mon, -1)}><Text style={styles.stockButtonText}>−</Text></Pressable>
                  <Pressable disabled={stockBusy} style={styles.stockButton} onPress={() => thayDoiTonKho(mon, 1)}><Text style={styles.stockButtonText}>+</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.tableFooter}>Hiển thị {visibleFoods.length} / {danhSachMonAn.length} món ăn</Text>
      </View>
      {!hienFormThem && loiThemMon !== '' && <Text style={ui.error}>{loiThemMon}</Text>}
      <Modal visible={hienFormThem} transparent animationType="fade" onRequestClose={dongFormThem}>
        <View style={styles.modalBackdrop}>
          <View style={styles.foodFormModal}>
            <View style={styles.formHeader}>
              <View><Text style={styles.formTitle}>{editing ? 'Sửa món ăn' : 'Thêm món ăn'}</Text><Text style={styles.formSubtitle}>Thông tin được lưu sau khi máy chủ xác nhận.</Text></View>
              <Pressable onPress={dongFormThem}><Text style={styles.closeButton}>×</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.foodFormBody}>
              <Text style={styles.fieldLabel}>Ảnh món ăn</Text>
              <View style={styles.uploadRow}>
                {maHinhAnh ? <FoodImage source={layHinhAnhMonAn(maHinhAnh)} name="Ảnh xem trước" drink={loaiMon === 'Đồ uống'} style={styles.imagePreview} /> : <View style={[styles.imagePreview, styles.emptyPreview]}><Text style={styles.uploadHint}>Chưa chọn ảnh</Text></View>}
                <View style={styles.uploadCopy}><Pressable disabled={dangTaiAnh} style={[styles.uploadButton, dangTaiAnh && styles.disabledButton]} onPress={chonAnhTuMay}><Text style={styles.primaryButtonText}>{dangTaiAnh ? 'Đang tải ảnh...' : 'Chọn hoặc thay ảnh'}</Text></Pressable><Text style={styles.uploadHint}>JPG, PNG, WebP · tối đa 5 MB · tự tối ưu khung 4:3</Text>{tenTepAnh !== '' && <Text style={styles.uploadSuccess}>✓ {tenTepAnh}</Text>}</View>
              </View>
              <Text style={styles.fieldLabel}>Hoặc chọn ảnh có sẵn</Text>
              <View style={styles.imageChoices}>
                {danhSachHinhAnh.map((anh) => (
                  <Pressable key={anh.ma} style={[styles.imageChoice, maHinhAnh === anh.ma && styles.imageChoiceActive]} onPress={() => { setMaHinhAnh(anh.ma); setTenTepAnh(`Ảnh có sẵn: ${anh.ten}`); }}>
                    <FoodImage source={layHinhAnhMonAn(anh.ma)} name={anh.ten} style={styles.imageChoicePhoto} />
                    <Text style={styles.imageChoiceText}>{anh.ten}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Tên món ăn *</Text>
              <TextInput style={styles.formInput} value={tenMon} onChangeText={setTenMon} placeholder="Nhập tên món ăn" />
              <Text style={styles.fieldLabel}>Danh mục *</Text>
              <View style={styles.categoryChoices}>
                {danhMuc.map((loai) => <Pressable key={loai} style={[styles.categoryChoice, loaiMon === loai && styles.categoryChoiceActive]} onPress={() => setLoaiMon(loai)}><Text style={[styles.categoryChoiceText, loaiMon === loai && styles.categoryChoiceTextActive]}>{loai}</Text></Pressable>)}
              </View>
              <Text style={styles.fieldLabel}>Mô tả *</Text>
              <TextInput style={[styles.formInput, styles.descriptionInput]} value={moTa} onChangeText={setMoTa} placeholder="Nhập mô tả món ăn" multiline />
              <View style={styles.twoFields}>
                <View style={styles.halfField}><Text style={styles.fieldLabel}>Giá (VNĐ) *</Text><TextInput style={styles.formInput} value={gia} onChangeText={setGia} keyboardType="numeric" placeholder="30000" /></View>
                {!editing && <View style={styles.halfField}><Text style={styles.fieldLabel}>Số lượng *</Text><TextInput style={styles.formInput} value={soLuong} onChangeText={setSoLuong} keyboardType="numeric" placeholder="10" /></View>}
              </View>
              {editing && <Action onPress={() => setActive(!active)}>{active ? 'Đang bán' : 'Ngừng bán'} — nhấn để đổi</Action>}
              {loiThemMon !== '' && <Text style={styles.formError}>{loiThemMon}</Text>}
            </ScrollView>
            <View style={styles.formActions}>
              <Pressable style={styles.cancelButton} onPress={dongFormThem}><Text style={styles.cancelButtonText}>Hủy</Text></Pressable>
              <Pressable style={[styles.primaryButton, (dangThem || dangTaiAnh) && styles.disabledButton]} disabled={dangThem || dangTaiAnh} onPress={themMonAn}><Text style={styles.primaryButtonText}>{dangThem ? 'Đang lưu...' : 'Lưu món ăn'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Logo({ gon = false }: { gon?: boolean }) {
  return (
    <View style={[styles.logoWrap, gon && styles.logoCompact]}>
      <View style={styles.logoIcon}><Text style={styles.logoIconText}>♨</Text></View>
      <View>
        <Text style={styles.logoText}>APP <Text style={styles.orange}>CANTEEN</Text></Text>
        {!gon && <Text style={styles.logoSub}>ADMIN</Text>}
      </View>
    </View>
  );
}

function MucMenu({ icon, label, dangChon = false, khiNhan }: { icon: string; label: string; dangChon?: boolean; khiNhan: () => void }) {
  return (
    <Pressable style={[styles.navItem, dangChon && styles.navItemActive]} onPress={khiNhan}>
      <Text style={[styles.navItemIcon, dangChon && styles.navItemTextActive]}>{icon}</Text>
      <Text style={[styles.navItemText, dangChon && styles.navItemTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  layout: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 238, paddingHorizontal: 16, paddingVertical: 22, borderRightWidth: 1, borderRightColor: '#E5EAF0', backgroundColor: '#FFFFFF' },
  logoWrap: { height: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 7 },
  logoCompact: { height: 40, paddingHorizontal: 0 },
  logoIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#FF5A12' },
  logoIconText: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  logoText: { color: '#171A20', fontSize: 14, fontWeight: '900' },
  logoSub: { marginTop: 1, color: '#6E7681', fontSize: 8, fontWeight: '800', letterSpacing: 1.4 },
  orange: { color: '#FF5A12' },
  sideNav: { flex: 1, marginTop: 26, gap: 8 },
  navItem: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, borderRadius: 8 },
  navItemActive: { backgroundColor: '#FF5A12', shadowColor: '#FF5A12', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  navItemIcon: { width: 22, color: '#435267', fontSize: 19, textAlign: 'center' },
  navItemText: { color: '#344154', fontSize: 14, fontWeight: '600' },
  navItemTextActive: { color: '#FFFFFF', fontWeight: '800' },
  logoutSide: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15 },
  logoutIcon: { color: '#435267', fontSize: 22 },
  logoutText: { color: '#344154', fontSize: 14, fontWeight: '600' },
  main: { flex: 1 },
  topbar: { height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#E4E9EF', backgroundColor: '#FFFFFF' },
  topbarLeft: { flexDirection: 'row', alignItems: 'center' },
  menuToggle: { color: '#334155', fontSize: 21 },
  adminProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bell: { marginRight: 16, color: '#42536A', fontSize: 21 },
  avatar: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#FF5A12' },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  adminName: { maxWidth: 150, color: '#2A3441', fontSize: 14, fontWeight: '600' },
  chevron: { color: '#42536A', fontSize: 18 },
  mobileNav: { flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, paddingVertical: 8, gap: 5, borderBottomWidth: 1, borderBottomColor: '#E4E9EF', backgroundColor: '#FFFFFF' },
  content: { width: '100%', maxWidth: 1280, alignSelf: 'center', padding: 22, paddingBottom: 40 },
  title: { color: '#10151D', fontSize: 27, fontWeight: '900' },
  welcome: { marginTop: 5, marginBottom: 20, color: '#59677A', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  statCard: { minWidth: 210, flex: 1, flexDirection: 'row', alignItems: 'flex-start', padding: 18, borderWidth: 1, borderColor: '#E7EBF0', borderRadius: 10, backgroundColor: '#FFFFFF', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 9, elevation: 2 },
  statCardMobile: { minWidth: '100%' },
  statIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26 },
  statIconText: { fontSize: 27, fontWeight: '800' },
  statCopy: { flex: 1, marginLeft: 14 },
  statLabel: { color: '#526174', fontSize: 12 },
  statValue: { marginTop: 2, color: '#111827', fontSize: 27, fontWeight: '900' },
  statNote: { marginTop: 8, fontSize: 11, fontWeight: '600' },
  dashboardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 16 },
  dashboardColumn: { flexDirection: 'column' },
  panel: { overflow: 'hidden', borderWidth: 1, borderColor: '#E7EBF0', borderRadius: 10, backgroundColor: '#FFFFFF', shadowColor: '#64748B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 9, elevation: 2 },
  popularPanel: { flex: 0.88, minWidth: 330 },
  rightColumn: { flex: 1.12, gap: 14 },
  fullWidth: { width: '100%' },
  panelHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  panelTitle: { color: '#151B24', fontSize: 15, fontWeight: '800' },
  panelTitlePadded: { padding: 18, color: '#151B24', fontSize: 15, fontWeight: '800' },
  viewAll: { color: '#FF5A12', fontSize: 11, fontWeight: '700' },
  foodRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  foodImage: { width: 64, height: 48, borderRadius: 9 },
  foodInfo: { flex: 1, marginLeft: 14 },
  foodName: { color: '#242D39', fontSize: 14, fontWeight: '700' },
  foodPrice: { marginTop: 5, color: '#FF4D00', fontSize: 13, fontWeight: '800' },
  sold: { color: '#718096', fontSize: 11 },
  chart: { height: 190, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 18, paddingBottom: 16 },
  barColumn: { flex: 1, height: 145, alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: { width: '100%', maxWidth: 30, height: 112, justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#DDE3EA' },
  bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: '#FF6330' },
  barLabel: { marginTop: 7, color: '#617085', fontSize: 9 },
  ordersPanel: { minHeight: 214 },
  table: { minWidth: 620, paddingBottom: 7 },
  tableRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EEF1F4' },
  tableHeader: { minHeight: 38, backgroundColor: '#F8FAFC' },
  tableCell: { width: 82, color: '#465569', fontSize: 10 },
  codeCell: { width: 72 },
  personCell: { width: 102 },
  statusCell: { width: 112 },
  timeCell: { width: 90 },
  strong: { color: '#202A37', fontWeight: '800' },
  statusWrap: { alignItems: 'flex-start' },
  status: { overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 5, borderRadius: 5, fontSize: 9, fontWeight: '700' },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  primaryButton: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 8, backgroundColor: '#FF5A12' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  managementPanel: { marginTop: 6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#E8EDF2' },
  searchInput: { minWidth: 230, flex: 1, height: 42, paddingHorizontal: 14, borderWidth: 1, borderColor: '#DDE4EC', borderRadius: 7, backgroundColor: '#F8FAFC', color: '#263445', fontSize: 12 },
  searchWide: { minWidth: 300 },
  filterButton: { minWidth: 145, height: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: '#DDE4EC', borderRadius: 7, backgroundColor: '#FFFFFF' },
  filterText: { color: '#465569', fontSize: 11, fontWeight: '600' },
  manageTable: { paddingBottom: 4 },
  foodTable: { minWidth: 900 },
  userTable: { minWidth: 880 },
  manageRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#E8EDF2' },
  manageCell: { width: 112, color: '#465569', fontSize: 11 },
  imageCell: { width: 70 },
  foodNameCell: { width: 145 },
  userNameCell: { width: 150 },
  emailCell: { width: 210 },
  phoneCell: { width: 135 },
  manageImage: { width: 60, height: 45, borderRadius: 8 },
  availability: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: '#DDF7E6', color: '#148B42', fontSize: 9, fontWeight: '700' },
  outOfStock: { backgroundColor: '#FFE7E7', color: '#E03535' },
  lowStock: { backgroundColor: '#FFF4D9', color: '#D97706' },
  stockNumber: { fontWeight: '800' },
  stockButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#FFF0E9' },
  stockButtonText: { color: '#F15F24', fontSize: 16, fontWeight: '800' },
  roleBadge: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: '#E5F0FF', color: '#1677FF', fontSize: 9, fontWeight: '700' },
  adminBadge: { backgroundColor: '#FFF0E5', color: '#FF5A12' },
  actions: { minWidth: 145, flexDirection: 'row', gap: 7 },
  editAction: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 6, backgroundColor: '#FFF0DF', color: '#FF5A12', fontSize: 14 },
  editBlueAction: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 6, backgroundColor: '#1677FF', color: '#FFFFFF', fontSize: 14 },
  deleteAction: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 6, backgroundColor: '#FFE7E9', color: '#E63946', fontSize: 13 },
  tableFooter: { padding: 15, color: '#69778A', fontSize: 11 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  foodFormModal: { width: '100%', maxWidth: 680, maxHeight: '92%', overflow: 'hidden', borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: '#111827', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#E8EDF2' },
  formTitle: { color: '#151B24', fontSize: 20, fontWeight: '900' },
  formSubtitle: { marginTop: 4, color: '#718096', fontSize: 12 },
  closeButton: { color: '#64748B', fontSize: 28, lineHeight: 28 },
  foodFormBody: { padding: 22 },
  fieldLabel: { marginTop: 13, marginBottom: 7, color: '#344154', fontSize: 12, fontWeight: '700' },
  formInput: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderColor: '#DCE3EB', borderRadius: 8, backgroundColor: '#FAFBFC', color: '#1F2937', fontSize: 13 },
  descriptionInput: { height: 78, paddingTop: 12, textAlignVertical: 'top' },
  imageChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  imagePreview: { width: 160, borderRadius: 10 },
  emptyPreview: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  uploadCopy: { flex: 1, alignItems: 'flex-start', gap: 7 },
  uploadButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#FF5A12' },
  uploadHint: { color: '#718096', fontSize: 11, lineHeight: 17 },
  uploadSuccess: { color: '#168A45', fontSize: 11, fontWeight: '700' },
  imageChoice: { width: 76, padding: 5, borderWidth: 2, borderColor: 'transparent', borderRadius: 9, backgroundColor: '#F4F7FA' },
  imageChoiceActive: { borderColor: '#FF5A12', backgroundColor: '#FFF3ED' },
  imageChoicePhoto: { width: '100%', borderRadius: 6 },
  imageChoiceText: { marginTop: 4, color: '#526174', fontSize: 9, textAlign: 'center' },
  categoryChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChoice: { paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: '#DCE3EB', borderRadius: 18, backgroundColor: '#FFFFFF' },
  categoryChoiceActive: { borderColor: '#FF5A12', backgroundColor: '#FFF0E9' },
  categoryChoiceText: { color: '#526174', fontSize: 11, fontWeight: '600' },
  categoryChoiceTextActive: { color: '#E94F0C' },
  twoFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  formError: { marginTop: 14, color: '#D73A49', fontSize: 12 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingHorizontal: 22, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E8EDF2', backgroundColor: '#FAFBFC' },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: '#DCE3EB', borderRadius: 8, backgroundColor: '#FFFFFF' },
  cancelButtonText: { color: '#526174', fontSize: 13, fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  feedback: { padding: 24, color: '#64748B', fontSize: 13, textAlign: 'center' },
  errorText: { color: '#D73A49' },
  orderAdminCard: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#E8EDF2' },
  orderAdminHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  orderAdminId: { color: '#202A37', fontSize: 15, fontWeight: '800' },
  orderCustomer: { marginTop: 4, color: '#526174', fontSize: 13 },
  orderHeaderRight: { alignItems: 'flex-end' },
  orderDate: { marginTop: 7, color: '#7A8798', fontSize: 10 },
  orderDelivery: { marginTop: 13, padding: 11, borderRadius: 8, backgroundColor: '#F8FAFC' },
  deliveryLine: { marginVertical: 2, color: '#526174', fontSize: 12 },
  orderItemLine: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 11 },
  orderItemName: { color: '#374151', fontSize: 12 },
  orderItemPrice: { color: '#526174', fontSize: 12 },
  orderAdminTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8EDF2' },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  statusButton: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#DDE4EC', borderRadius: 7, backgroundColor: '#FFFFFF' },
  statusButtonActive: { borderColor: '#FF5A12', backgroundColor: '#FFF0E9' },
  statusButtonText: { color: '#5D6878', fontSize: 10, fontWeight: '700' },
  statusButtonTextActive: { color: '#FF5A12' },
});
