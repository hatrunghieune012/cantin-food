import {
  Image,
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
import { danhSachMonAn, dinhDangGia } from '../data/foods';

interface ThuocTinhAdmin {
  tenAdmin: string;
  token: string;
  khiDangXuat: () => void;
}

type TrangAdmin = 'tongQuan' | 'monAn' | 'nguoiDung' | 'donHang';

interface TaiKhoanAdmin {
  id: number;
  full_name: string;
  student_code: string;
  email: string;
  phone: string | null;
  role: 'user' | 'admin';
}

interface DonHangAdmin {
  id: number;
  customer_name: string;
  phone: string;
  delivery_address: string;
  note: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  items: { id: number; food_name: string; price: number; quantity: number }[];
}

const tenTrangThai: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', delivering: 'Đang giao',
  completed: 'Hoàn thành', cancelled: 'Đã hủy',
};

const thongKe = [
  { icon: '♨', label: 'Tổng số món ăn', value: '15', note: '↑ 2 món so với tuần trước', color: '#FF5B16', pale: '#FFF0E9' },
  { icon: '♙', label: 'Tổng người dùng', value: '120', note: '↑ 12 người mới', color: '#1677FF', pale: '#EAF3FF' },
  { icon: '□', label: 'Món sắp hết hàng', value: '3', note: 'Cần cập nhật số lượng', color: '#ED3348', pale: '#FFECEE' },
  { icon: '▤', label: 'Đơn hàng hôm nay', value: '28', note: '↑ 15% so với hôm qua', color: '#18A957', pale: '#EAF8EF' },
];

const cotDonHang = [10, 20, 16, 22, 31, 26, 35];
const ngay = ['01/10', '02/10', '03/10', '04/10', '05/10', '06/10', '07/10'];
const soLuongDaBan = [45, 38, 32, 25];
const donHangGanDay = [
  { ma: '#DH001', ten: 'Nguyễn Văn A', tong: '30.000đ', trangThai: 'Đang chuẩn bị', mau: '#F59E0B', nen: '#FFF4D9', gio: '07/10 12:30' },
  { ma: '#DH002', ten: 'Trần Thị B', tong: '65.000đ', trangThai: 'Đã hoàn thành', mau: '#159947', nen: '#E5F8EB', gio: '07/10 12:15' },
  { ma: '#DH003', ten: 'Lê Văn C', tong: '45.000đ', trangThai: 'Đang giao', mau: '#1677FF', nen: '#E7F1FF', gio: '07/10 11:50' },
];

export default function ManHinhAdmin({ tenAdmin, token, khiDangXuat }: ThuocTinhAdmin) {
  const { width } = useWindowDimensions();
  const laDesktop = width >= 960;
  const laManHinhNho = width < 640;
  const chuCai = tenAdmin.trim().charAt(0).toUpperCase() || 'A';
  const [trang, setTrang] = useState<TrangAdmin>('tongQuan');
  const [taiKhoan, setTaiKhoan] = useState<TaiKhoanAdmin[]>([]);
  const [dangTaiTaiKhoan, setDangTaiTaiKhoan] = useState(false);
  const [daTaiTaiKhoan, setDaTaiTaiKhoan] = useState(false);
  const [loiTaiKhoan, setLoiTaiKhoan] = useState('');
  const [donHangAdmin, setDonHangAdmin] = useState<DonHangAdmin[]>([]);
  const [dangTaiDonHang, setDangTaiDonHang] = useState(false);
  const [daTaiDonHang, setDaTaiDonHang] = useState(false);
  const [loiDonHang, setLoiDonHang] = useState('');

  useEffect(() => {
    if (trang !== 'nguoiDung' || daTaiTaiKhoan || dangTaiTaiKhoan) return;

    const apiUrl = Platform.OS === 'web'
      ? 'http://localhost:3000/api/admin/users'
      : 'http://10.21.61.245:3000/api/admin/users';

    setDangTaiTaiKhoan(true);
    setLoiTaiKhoan('');
    fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Không thể tải người dùng');
        setTaiKhoan(data.users || []);
      })
      .catch((error: Error) => setLoiTaiKhoan(error.message))
      .finally(() => { setDangTaiTaiKhoan(false); setDaTaiTaiKhoan(true); });
  }, [trang, daTaiTaiKhoan, dangTaiTaiKhoan, token]);

  useEffect(() => {
    if (trang !== 'donHang' || daTaiDonHang || dangTaiDonHang) return;
    const apiUrl = Platform.OS === 'web' ? 'http://localhost:3000/api/admin/orders' : 'http://10.21.61.245:3000/api/admin/orders';
    setDangTaiDonHang(true);
    fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Không thể tải đơn hàng');
        setDonHangAdmin(data.orders || []);
      })
      .catch((error: Error) => setLoiDonHang(error.message))
      .finally(() => { setDangTaiDonHang(false); setDaTaiDonHang(true); });
  }, [trang, daTaiDonHang, dangTaiDonHang, token]);

  async function capNhatTrangThai(orderId: number, status: string) {
    const apiUrl = Platform.OS === 'web'
      ? `http://localhost:3000/api/admin/orders/${orderId}/status`
      : `http://10.21.61.245:3000/api/admin/orders/${orderId}/status`;
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể cập nhật trạng thái');
      setDonHangAdmin((orders) => orders.map((order) => order.id === orderId ? data.order : order));
    } catch (error) {
      setLoiDonHang(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái');
    }
  }

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
              <Text style={styles.chevron}>⌄</Text>
            </View>
          </View>

          {!laDesktop && (
            <View style={styles.mobileNav}>
              <MucMenu icon="⌂" label="Tổng quan" dangChon={trang === 'tongQuan'} khiNhan={() => setTrang('tongQuan')} />
              <MucMenu icon="♨" label="Món ăn" dangChon={trang === 'monAn'} khiNhan={() => setTrang('monAn')} />
              <MucMenu icon="♙" label="Người dùng" dangChon={trang === 'nguoiDung'} khiNhan={() => setTrang('nguoiDung')} />
              <MucMenu icon="▤" label="Đơn hàng" dangChon={trang === 'donHang'} khiNhan={() => setTrang('donHang')} />
            </View>
          )}

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {trang === 'tongQuan' && <TrangTongQuan tenAdmin={tenAdmin} laDesktop={laDesktop} laManHinhNho={laManHinhNho} />}
            {trang === 'monAn' && <TrangQuanLyMonAn />}
            {trang === 'nguoiDung' && <TrangQuanLyNguoiDung taiKhoan={taiKhoan} dangTai={dangTaiTaiKhoan} loi={loiTaiKhoan} />}
            {trang === 'donHang' && <TrangQuanLyDonHang donHang={donHangAdmin} dangTai={dangTaiDonHang} loi={loiDonHang} khiCapNhat={capNhatTrangThai} />}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TrangTongQuan({ tenAdmin, laDesktop, laManHinhNho }: { tenAdmin: string; laDesktop: boolean; laManHinhNho: boolean }) {
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
                  <Text style={styles.viewAll}>Xem tất cả →</Text>
                </View>
                {danhSachMonAn.slice(0, 4).map((mon, index) => (
                  <View key={mon.ma} style={styles.foodRow}>
                    <Image source={mon.hinhAnh} style={styles.foodImage} />
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{mon.ten}</Text>
                      <Text style={styles.foodPrice}>{dinhDangGia(mon.gia)}</Text>
                    </View>
                    <Text style={styles.sold}>Đã bán: {soLuongDaBan[index]}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.rightColumn, !laDesktop && styles.fullWidth]}>
                <View style={styles.panel}>
                  <Text style={styles.panelTitlePadded}>Thống kê đơn hàng (7 ngày qua)</Text>
                  <View style={styles.chart}>
                    {cotDonHang.map((soLuong, index) => (
                      <View key={ngay[index]} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View style={[styles.bar, { height: `${(soLuong / 40) * 100}%` }]} />
                        </View>
                        <Text style={styles.barLabel}>{ngay[index]}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={[styles.panel, styles.ordersPanel]}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Đơn hàng gần đây</Text>
                    <Text style={styles.viewAll}>Xem tất cả →</Text>
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
                      {donHangGanDay.map((don) => (
                        <View key={don.ma} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.codeCell, styles.strong]}>{don.ma}</Text>
                          <Text style={[styles.tableCell, styles.personCell]}>{don.ten}</Text>
                          <Text style={styles.tableCell}>{don.tong}</Text>
                          <View style={[styles.statusCell, styles.statusWrap]}>
                            <Text style={[styles.status, { color: don.mau, backgroundColor: don.nen }]}>{don.trangThai}</Text>
                          </View>
                          <Text style={[styles.tableCell, styles.timeCell]}>{don.gio}</Text>
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

function TrangQuanLyMonAn() {
  return (
    <>
      <View style={styles.pageHeading}>
        <View>
          <Text style={styles.title}>Quản lý món ăn</Text>
          <Text style={styles.welcome}>Thêm, sửa, xóa và quản lý danh sách món ăn</Text>
        </View>
        <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>＋ Thêm món ăn</Text></Pressable>
      </View>
      <View style={[styles.panel, styles.managementPanel]}>
        <View style={styles.filters}>
          <TextInput style={styles.searchInput} placeholder="Tìm kiếm món ăn..." placeholderTextColor="#8A96A6" />
          <View style={styles.filterButton}><Text style={styles.filterText}>Tất cả danh mục⌄</Text></View>
          <View style={styles.filterButton}><Text style={styles.filterText}>Trạng thái⌄</Text></View>
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
            {danhSachMonAn.map((mon, index) => (
              <View key={mon.ma} style={styles.manageRow}>
                <View style={[styles.manageCell, styles.imageCell]}><Image source={mon.hinhAnh} style={styles.manageImage} /></View>
                <Text style={[styles.manageCell, styles.foodNameCell, styles.strong]}>{mon.ten}</Text>
                <Text style={styles.manageCell}>{mon.danhMuc}</Text>
                <Text style={styles.manageCell}>{dinhDangGia(mon.gia)}</Text>
                <Text style={styles.manageCell}>{index === 2 ? 0 : 20 - index}</Text>
                <View style={styles.manageCell}><Text style={[styles.availability, index === 2 && styles.outOfStock]}>{index === 2 ? 'Hết hàng' : 'Còn hàng'}</Text></View>
                <View style={[styles.manageCell, styles.actions]}><Text style={styles.editAction}>✎</Text><Text style={styles.deleteAction}>▣</Text></View>
              </View>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.tableFooter}>Hiển thị 1 - {danhSachMonAn.length} / {danhSachMonAn.length} món ăn</Text>
      </View>
    </>
  );
}

function TrangQuanLyNguoiDung({ taiKhoan, dangTai, loi }: { taiKhoan: TaiKhoanAdmin[]; dangTai: boolean; loi: string }) {
  return (
    <>
      <Text style={styles.title}>Quản lý người dùng</Text>
      <Text style={styles.welcome}>Xem danh sách và quản lý tài khoản người dùng</Text>
      <View style={[styles.panel, styles.managementPanel]}>
        <View style={styles.filters}>
          <TextInput style={[styles.searchInput, styles.searchWide]} placeholder="Tìm kiếm theo tên, email hoặc MSSV..." placeholderTextColor="#8A96A6" />
          <View style={styles.filterButton}><Text style={styles.filterText}>Tất cả vai trò⌄</Text></View>
        </View>
        {dangTai && <Text style={styles.feedback}>Đang tải người dùng...</Text>}
        {loi !== '' && <Text style={[styles.feedback, styles.errorText]}>{loi}</Text>}
        {!dangTai && loi === '' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.manageTable, styles.userTable]}>
              <View style={[styles.manageRow, styles.tableHeader]}>
                <Text style={[styles.manageCell, styles.userNameCell]}>Họ tên</Text>
                <Text style={styles.manageCell}>Mã SV</Text>
                <Text style={[styles.manageCell, styles.emailCell]}>Email</Text>
                <Text style={[styles.manageCell, styles.phoneCell]}>Số điện thoại</Text>
                <Text style={styles.manageCell}>Vai trò</Text>
                <Text style={styles.manageCell}>Trạng thái</Text>
                <Text style={styles.manageCell}>Thao tác</Text>
              </View>
              {taiKhoan.map((user) => (
                <View key={user.id} style={styles.manageRow}>
                  <Text style={[styles.manageCell, styles.userNameCell, styles.strong]}>{user.full_name}</Text>
                  <Text style={styles.manageCell}>{user.student_code || '-'}</Text>
                  <Text style={[styles.manageCell, styles.emailCell]}>{user.email}</Text>
                  <Text style={[styles.manageCell, styles.phoneCell]}>{user.phone || 'Chưa cập nhật'}</Text>
                  <View style={styles.manageCell}><Text style={[styles.roleBadge, user.role === 'admin' && styles.adminBadge]}>{user.role === 'admin' ? 'Admin' : 'User'}</Text></View>
                  <View style={styles.manageCell}><Text style={styles.availability}>Hoạt động</Text></View>
                  <View style={[styles.manageCell, styles.actions]}><Text style={styles.editBlueAction}>✎</Text><Text style={styles.deleteAction}>▣</Text></View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        {!dangTai && loi === '' && <Text style={styles.tableFooter}>Hiển thị {taiKhoan.length} người dùng</Text>}
      </View>
    </>
  );
}

function TrangQuanLyDonHang({ donHang, dangTai, loi, khiCapNhat }: { donHang: DonHangAdmin[]; dangTai: boolean; loi: string; khiCapNhat: (id: number, status: string) => void }) {
  return (
    <>
      <Text style={styles.title}>Quản lý đơn hàng</Text>
      <Text style={styles.welcome}>Xem thông tin giao hàng và các món khách đã đặt</Text>
      <View style={[styles.panel, styles.managementPanel]}>
        {dangTai && <Text style={styles.feedback}>Đang tải đơn hàng...</Text>}
        {loi !== '' && <Text style={[styles.feedback, styles.errorText]}>{loi}</Text>}
        {!dangTai && loi === '' && donHang.length === 0 && <Text style={styles.feedback}>Chưa có đơn hàng.</Text>}
        {!dangTai && loi === '' && donHang.map((order) => (
          <View key={order.id} style={styles.orderAdminCard}>
            <View style={styles.orderAdminHeader}>
              <View><Text style={styles.orderAdminId}>Đơn #{order.id}</Text><Text style={styles.orderCustomer}>{order.customer_name}</Text></View>
              <View style={styles.orderHeaderRight}><Text style={styles.availability}>{tenTrangThai[order.status] || order.status}</Text><Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString('vi-VN')}</Text></View>
            </View>
            <View style={styles.orderDelivery}>
              <Text style={styles.deliveryLine}>SĐT nhận hàng: {order.phone}</Text>
              <Text style={styles.deliveryLine}>Địa chỉ: {order.delivery_address}</Text>
              {order.note && <Text style={styles.deliveryLine}>Ghi chú: {order.note}</Text>}
            </View>
            {order.items.map((item) => (
              <View key={item.id} style={styles.orderItemLine}>
                <Text style={styles.orderItemName}>{item.food_name} × {item.quantity}</Text>
                <Text style={styles.orderItemPrice}>{dinhDangGia(Number(item.price) * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.orderAdminTotal}><Text style={styles.strong}>Tổng tiền</Text><Text style={styles.foodPrice}>{dinhDangGia(Number(order.total_amount))}</Text></View>
            <View style={styles.statusActions}>
              {['pending', 'confirmed', 'delivering', 'completed', 'cancelled'].map((status) => (
                <Pressable key={status} style={[styles.statusButton, order.status === status && styles.statusButtonActive]} onPress={() => khiCapNhat(order.id, status)}>
                  <Text style={[styles.statusButtonText, order.status === status && styles.statusButtonTextActive]}>{tenTrangThai[status]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function Logo({ gon = false }: { gon?: boolean }) {
  return (
    <View style={[styles.logoWrap, gon && styles.logoCompact]}>
      <View style={styles.logoIcon}><Text style={styles.logoIconText}>♨</Text></View>
      <View>
        <Text style={styles.logoText}>SMART <Text style={styles.orange}>CANTEEN</Text></Text>
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
  mobileNav: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, paddingVertical: 8, gap: 5, borderBottomWidth: 1, borderBottomColor: '#E4E9EF', backgroundColor: '#FFFFFF' },
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
  foodImage: { width: 58, height: 58, borderRadius: 9 },
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
  manageImage: { width: 45, height: 45, borderRadius: 8 },
  availability: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: '#DDF7E6', color: '#148B42', fontSize: 9, fontWeight: '700' },
  outOfStock: { backgroundColor: '#FFE7E7', color: '#E03535' },
  roleBadge: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: '#E5F0FF', color: '#1677FF', fontSize: 9, fontWeight: '700' },
  adminBadge: { backgroundColor: '#FFF0E5', color: '#FF5A12' },
  actions: { flexDirection: 'row', gap: 7 },
  editAction: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 6, backgroundColor: '#FFF0DF', color: '#FF5A12', fontSize: 14 },
  editBlueAction: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 6, backgroundColor: '#1677FF', color: '#FFFFFF', fontSize: 14 },
  deleteAction: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 6, backgroundColor: '#FFE7E9', color: '#E63946', fontSize: 13 },
  tableFooter: { padding: 15, color: '#69778A', fontSize: 11 },
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
