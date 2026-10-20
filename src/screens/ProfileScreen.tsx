import OrdersPanel from '../components/OrdersPanel';
import { apiUrl as buildApiUrl } from '../api';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { DonHang, NguoiDung } from '../types';

interface ThuocTinhCaNhan {
  nguoiDungHienTai: NguoiDung | null;
  donHang: DonHang[];
  khiCapNhatNguoiDung: (nguoiDung: NguoiDung) => void;
  khiDangXuat: () => void;
}

export default function ManHinhCaNhan({ nguoiDungHienTai, donHang, khiCapNhatNguoiDung, khiDangXuat }: ThuocTinhCaNhan) {
  const [dangSua, setDangSua] = useState(false);
  const [hoTen, setHoTen] = useState(nguoiDungHienTai?.hoTen || '');
  const [soDienThoai, setSoDienThoai] = useState(nguoiDungHienTai?.phone || '');
  const [diaChiMacDinh, setDiaChiMacDinh] = useState(nguoiDungHienTai?.defaultAddress || '');
  const [donDangMo, setDonDangMo] = useState<number | null>(null);
  const [thongBao, setThongBao] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  function huyChinhSua() {
    setHoTen(nguoiDungHienTai?.hoTen || '');
    setSoDienThoai(nguoiDungHienTai?.phone || '');
    setDiaChiMacDinh(nguoiDungHienTai?.defaultAddress || '');
    setThongBao('');
    setDangSua(false);
  }

  async function luuThayDoi() {
    const name = hoTen.trim();
    const phone = soDienThoai.trim();
    if (!name) return setThongBao('Họ tên không được để trống.');
    if (!/^\+?[0-9]{8,15}$/.test(phone)) return setThongBao('Số điện thoại không hợp lệ.');
    if (!nguoiDungHienTai) return;

    const apiUrl = buildApiUrl('/api/users/me');
    try {
      setDangLuu(true);
      setThongBao('');
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nguoiDungHienTai.token}` },
        body: JSON.stringify({ full_name: name, phone, defaultAddress: diaChiMacDinh.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.user) {
        setThongBao(data.message || 'Không thể cập nhật thông tin.');
        return;
      }
      khiCapNhatNguoiDung({
        ...nguoiDungHienTai,
        hoTen: data.user.full_name,
        phone: data.user.phone,
        defaultAddress: data.user.default_address || '',
      });
      setDangSua(false);
      setThongBao('Cập nhật thông tin thành công');
    } catch {
      setThongBao('Không thể kết nối đến server.');
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Image source={require('../../assets/images/cantin.jpg')} style={styles.avatar} />
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{nguoiDungHienTai?.hoTen || 'Sinh viên'}</Text>
          <Text style={styles.mssv}>MSSV: {nguoiDungHienTai?.maSinhVien || 'Chưa cập nhật'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>Thông tin tài khoản</Text>
          {!dangSua && <Pressable style={styles.editButton} onPress={() => { setDangSua(true); setThongBao(''); }}><Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text></Pressable>}
        </View>

        {!dangSua ? (
          <View style={styles.infoGrid}>
            <ThongTin label="Email" value={nguoiDungHienTai?.email || 'Chưa cập nhật'} />
            <ThongTin label="Số điện thoại" value={nguoiDungHienTai?.phone || 'Chưa cập nhật'} />

          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Họ tên</Text>
            <TextInput style={styles.input} value={hoTen} onChangeText={setHoTen} placeholder="Nhập họ tên" />
            <Text style={styles.label}>MSSV</Text>
            <TextInput style={[styles.input, styles.readonly]} value={nguoiDungHienTai?.maSinhVien || ''} editable={false} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, styles.readonly]} value={nguoiDungHienTai?.email || ''} editable={false} />
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput style={styles.input} value={soDienThoai} onChangeText={setSoDienThoai} keyboardType="phone-pad" placeholder="Nhập số điện thoại" />

            <View style={styles.formActions}>
              <Pressable style={styles.cancelButton} onPress={huyChinhSua}><Text style={styles.cancelText}>Hủy</Text></Pressable>
              <Pressable style={[styles.saveButton, dangLuu && styles.disabled]} onPress={luuThayDoi} disabled={dangLuu}><Text style={styles.saveText}>{dangLuu ? 'Đang lưu...' : 'Lưu thay đổi'}</Text></Pressable>
            </View>
          </View>
        )}
        {thongBao !== '' && <Text style={[styles.message, thongBao.includes('thành công') && styles.success]}>{thongBao}</Text>}
      </View>

      {nguoiDungHienTai && <OrdersPanel token={nguoiDungHienTai.token} />}

      <Pressable style={styles.logout} onPress={khiDangXuat}><Text style={styles.logoutText}>Đăng xuất</Text></Pressable>
    </ScrollView>
  );
}

function ThongTin({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <View style={[styles.infoItem, full && styles.infoItemFull]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: 20, paddingBottom: 45 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 22, borderRadius: 18, backgroundColor: '#FFFFFF' },
  avatar: { width: 82, height: 82, borderRadius: 41 },
  profileCopy: { marginLeft: 17 },
  name: { color: '#20242A', fontSize: 23, fontWeight: '800' },
  mssv: { marginTop: 6, color: '#656C76' },
  card: { marginTop: 16, padding: 20, borderWidth: 1, borderColor: '#ECEEF1', borderRadius: 16, backgroundColor: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  heading: { color: '#20242A', fontSize: 19, fontWeight: '800' },
  editButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9, backgroundColor: '#FFF0E9' },
  editButtonText: { color: '#D85624', fontSize: 12, fontWeight: '800' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  infoItem: { minWidth: 230, flex: 1, padding: 14, borderRadius: 11, backgroundColor: '#F8F9FA' },
  infoItemFull: { minWidth: '100%' },
  infoLabel: { color: '#858B94', fontSize: 12 },
  infoValue: { marginTop: 6, color: '#313740', fontSize: 14, fontWeight: '600' },
  form: { marginTop: 18 },
  label: { marginBottom: 7, color: '#34383E', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 48, marginBottom: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 10, backgroundColor: '#FFFFFF' },
  readonly: { color: '#858B94', backgroundColor: '#F3F4F6' },
  addressInput: { minHeight: 76, paddingTop: 13, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { minWidth: 100, alignItems: 'center', padding: 13, borderWidth: 1, borderColor: '#D8DDE3', borderRadius: 10 },
  cancelText: { color: '#5D646E', fontWeight: '700' },
  saveButton: { minWidth: 150, alignItems: 'center', padding: 13, borderRadius: 10, backgroundColor: '#E86A33' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.65 },
  message: { marginTop: 13, color: '#D85624', fontSize: 13 },
  success: { color: '#168A45' },
  historyTitle: { marginTop: 26, marginBottom: 4, color: '#20242A', fontSize: 20, fontWeight: '800' },
  emptyOrders: { alignItems: 'center', paddingVertical: 34 },
  emptyIcon: { color: '#E86A33', fontSize: 38 },
  emptyTitle: { marginTop: 10, fontSize: 17, fontWeight: '800' },
  emptyText: { marginTop: 7, color: '#858B94', textAlign: 'center' },
  order: { marginTop: 12, padding: 18, borderWidth: 1, borderColor: '#ECEEF1', borderRadius: 15, backgroundColor: '#FFFFFF' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  orderId: { color: '#20242A', fontSize: 15, fontWeight: '800' },
  date: { marginTop: 4, color: '#858B94', fontSize: 11 },
  statusBadge: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, color: '#D85624', backgroundColor: '#FFF0E9', fontSize: 10, fontWeight: '800' },
  cancelledBadge: { color: '#D73545', backgroundColor: '#FFE9EC' },
  orderSummary: { marginTop: 13, color: '#525A65', fontSize: 12 },
  total: { marginTop: 8, color: '#E86A33', fontSize: 14, fontWeight: '800' },
  progress: { flexDirection: 'row', marginTop: 20 },
  step: { flex: 1, alignItems: 'center' },
  stepTop: { width: '100%', height: 18, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', right: '50%', width: '100%', height: 3, backgroundColor: '#E3E6EA' },
  lineDone: { backgroundColor: '#F07A43' },
  dot: { zIndex: 2, width: 11, height: 11, borderRadius: 6, backgroundColor: '#DDE1E6' },
  dotDone: { backgroundColor: '#F07A43' },
  dotCurrent: { width: 15, height: 15, borderRadius: 8, borderWidth: 3, borderColor: '#FFD7C5', backgroundColor: '#E85F25' },
  stepLabel: { marginTop: 5, color: '#A0A6AE', fontSize: 9, textAlign: 'center' },
  stepLabelDone: { color: '#D85624', fontWeight: '700' },
  cancelledBox: { marginTop: 17, padding: 11, borderRadius: 8, backgroundColor: '#FFE9EC' },
  cancelledText: { color: '#D73545', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  detailHint: { marginTop: 14, color: '#D85624', fontSize: 11, fontWeight: '700', textAlign: 'right' },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#ECEEF1' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemText: { color: '#454A52', fontSize: 12 },
  delivery: { marginTop: 7, color: '#656C76', fontSize: 12 },
  logout: { alignSelf: 'center', width: '100%', maxWidth: 300, alignItems: 'center', marginTop: 26, padding: 14, borderWidth: 1, borderColor: '#E86A33', borderRadius: 11 },
  logoutText: { color: '#D85624', fontWeight: '700' },
});
