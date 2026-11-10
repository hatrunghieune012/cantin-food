import DemographicFields, { displayBirthDate, genderLabels } from '../components/DemographicFields';
import { validBirthDate } from '../accountValidation';
import Interactive from '../components/Interactive';
import { colors, pageLayout } from '../styles/theme';
import { apiFetch } from '../api';
import { apiUrl as buildApiUrl } from '../api';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { DonHang, NguoiDung } from '../types';

interface ThuocTinhCaNhan {
  nguoiDungHienTai: NguoiDung | null;
  donHang: DonHang[];
  khiCapNhatNguoiDung: (nguoiDung: NguoiDung) => void;
  khiDangXuat: () => void;
}

export default function ManHinhCaNhan({ nguoiDungHienTai, khiCapNhatNguoiDung, khiDangXuat }: ThuocTinhCaNhan) {
  const { width } = useWindowDimensions();
  const [dangSua, setDangSua] = useState(false);
  const [gender, setGender] = useState(nguoiDungHienTai?.gender || null);
  const [dateOfBirth, setDateOfBirth] = useState(nguoiDungHienTai?.dateOfBirth || '');
  const [hoTen, setHoTen] = useState(nguoiDungHienTai?.hoTen || '');
  const [soDienThoai, setSoDienThoai] = useState(nguoiDungHienTai?.phone || '');
  const [diaChiMacDinh, setDiaChiMacDinh] = useState(nguoiDungHienTai?.defaultAddress || '');
  const [donDangMo, setDonDangMo] = useState<number | null>(null);
  const [thongBao, setThongBao] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  function huyChinhSua() {
    setGender(nguoiDungHienTai?.gender || null);
    setDateOfBirth(nguoiDungHienTai?.dateOfBirth || '');
    setHoTen(nguoiDungHienTai?.hoTen || '');
    setSoDienThoai(nguoiDungHienTai?.phone || '');
    setDiaChiMacDinh(nguoiDungHienTai?.defaultAddress || '');
    setThongBao('');
    setDangSua(false);
  }

  async function luuThayDoi() {
    const name = hoTen.trim();
    const phone = soDienThoai.trim();
    if (!name || name.length > 100) return setThongBao('Họ tên cần từ 1 đến 100 ký tự.');
    if (dateOfBirth && !validBirthDate(dateOfBirth)) return setThongBao('Ngày sinh không hợp lệ hoặc ở tương lai.');
    if (!/^\+?[0-9]{8,15}$/.test(phone)) return setThongBao('Số điện thoại không hợp lệ.');
    if (!nguoiDungHienTai) return;

    const apiUrl = buildApiUrl('/api/users/me');
    try {
      setDangLuu(true);
      setThongBao('');
      const response = await apiFetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nguoiDungHienTai.token}` },
        body: JSON.stringify({ full_name: name, phone, defaultAddress: diaChiMacDinh.trim(), gender, date_of_birth: dateOfBirth || null }),
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
        gender: data.user.gender,
        dateOfBirth: data.user.date_of_birth,
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
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.container, width >= 768 && { padding: 32 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Tài khoản của bạn</Text>
      <Text style={styles.pageSubtitle}>Quản lý thông tin và theo dõi những bữa ăn đã đặt.</Text>
      <View style={[styles.accountLayout, width >= 1000 && styles.accountLayoutWide]}>
      <View style={[styles.accountSidebar, width >= 1000 && { width: 320 }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(nguoiDungHienTai?.hoTen || 'SV').trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase()}</Text></View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{nguoiDungHienTai?.hoTen || 'Sinh viên'}</Text>
        </View>
      </View>

      <Interactive style={styles.logout} onPress={khiDangXuat}><Text style={styles.logoutText}>Đăng xuất</Text></Interactive>
      </View>
      <View style={styles.accountContent}>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>Thông tin tài khoản</Text>
          {!dangSua && <Interactive style={styles.editButton} onPress={() => { huyChinhSua(); setDangSua(true); }}><Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text></Interactive>}
        </View>

        {!dangSua ? (
          <View style={styles.infoGrid}>
            <ThongTin label="Giới tính" value={nguoiDungHienTai?.gender ? genderLabels[nguoiDungHienTai.gender] : 'Chưa cập nhật'} />
            <ThongTin label="Ngày sinh" value={displayBirthDate(nguoiDungHienTai?.dateOfBirth)} />
            <ThongTin label="Email" value={cheEmail(nguoiDungHienTai?.email)} />
            <ThongTin label="Số điện thoại" value={cheThongTin(nguoiDungHienTai?.phone)} />

          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Họ tên</Text>
            <TextInput accessibilityLabel="Họ tên" style={styles.input} value={hoTen} onChangeText={setHoTen} placeholder="Nhập họ tên" />
            <Text style={styles.label}>Email</Text>
            <TextInput style={[styles.input, styles.readonly]} value={nguoiDungHienTai?.email || ''} editable={false} />
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput accessibilityLabel="Số điện thoại" style={styles.input} value={soDienThoai} onChangeText={setSoDienThoai} keyboardType="phone-pad" placeholder="Nhập số điện thoại" />

            <DemographicFields gender={gender} dateOfBirth={dateOfBirth} onGender={setGender} onDate={setDateOfBirth} disabled={dangLuu} />
            <View style={styles.formActions}>
              <Interactive disabled={dangLuu} style={styles.cancelButton} onPress={huyChinhSua}><Text style={styles.cancelText}>Hủy</Text></Interactive>
              <Interactive style={[styles.saveButton, dangLuu && styles.disabled]} onPress={luuThayDoi} disabled={dangLuu}><Text style={styles.saveText}>{dangLuu ? 'Đang lưu...' : 'Lưu thay đổi'}</Text></Interactive>
            </View>
          </View>
        )}
        {thongBao !== '' && <Text style={[styles.message, thongBao.includes('thành công') && styles.success]}>{thongBao}</Text>}
      </View>


      </View>
      </View>
    </ScrollView>
  );
}

function cheEmail(value?: string | null) {
  const email = value?.trim();
  if (!email) return 'Chưa cập nhật';
  const atIndex = email.lastIndexOf('@');
  return atIndex < 0 ? cheThongTin(email) : `${cheThongTin(email.slice(0, atIndex))}${email.slice(atIndex)}`;
}

function cheThongTin(value?: string | null) {
  const text = value?.trim();
  return text ? `******${text.slice(-3)}` : 'Chưa cập nhật';
}

function ThongTin({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <View style={[styles.infoItem, full && styles.infoItemFull]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { ...pageLayout },
  pageTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  pageSubtitle: { color: colors.muted, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  accountLayout: { gap: 24 },
  accountLayoutWide: { flexDirection: 'row', alignItems: 'flex-start' },
  accountSidebar: { gap: 12 },
  accountContent: { flex: 1, minWidth: 0, gap: 24 },
  avatarText: { fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 16, backgroundColor: '#FFFFFF' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  profileCopy: { marginLeft: 16, flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 23, fontWeight: '800' },
  card: { padding: 24, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  heading: { color: colors.text, fontSize: 19, fontWeight: '800' },
  editButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9, backgroundColor: colors.soft },
  editButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  infoItem: { minWidth: 0, width: '100%', padding: 14, borderRadius: 11, backgroundColor: '#F8F9FA' },
  infoItemFull: { minWidth: '100%' },
  infoLabel: { color: '#858B94', fontSize: 12 },
  infoValue: { marginTop: 6, color: '#313740', fontSize: 14, fontWeight: '600' },
  form: { marginTop: 18 },
  label: { marginBottom: 7, color: '#34383E', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 48, marginBottom: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FFFFFF' },
  readonly: { color: '#858B94', backgroundColor: '#F3F4F6' },
  addressInput: { minHeight: 76, paddingTop: 13, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { minWidth: 100, alignItems: 'center', padding: 13, borderWidth: 1, borderColor: '#D8DDE3', borderRadius: 10 },
  cancelText: { color: '#5D646E', fontWeight: '700' },
  saveButton: { minWidth: 150, alignItems: 'center', padding: 13, borderRadius: 10, backgroundColor: colors.primary },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.65 },
  message: { marginTop: 13, color: colors.primary, fontSize: 13 },
  success: { color: colors.green },
  historyTitle: { marginTop: 26, marginBottom: 4, color: colors.text, fontSize: 20, fontWeight: '800' },
  emptyOrders: { alignItems: 'center', paddingVertical: 34 },
  emptyIcon: { color: colors.primary, fontSize: 38 },
  emptyTitle: { marginTop: 10, fontSize: 17, fontWeight: '800' },
  emptyText: { marginTop: 7, color: '#858B94', textAlign: 'center' },
  order: { marginTop: 12, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: '#FFFFFF' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  orderId: { color: colors.text, fontSize: 15, fontWeight: '800' },
  date: { marginTop: 4, color: '#858B94', fontSize: 11 },
  statusBadge: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, color: colors.primary, backgroundColor: colors.soft, fontSize: 10, fontWeight: '800' },
  cancelledBadge: { color: '#D73545', backgroundColor: '#FFE9EC' },
  orderSummary: { marginTop: 13, color: '#525A65', fontSize: 12 },
  total: { marginTop: 8, color: colors.primary, fontSize: 14, fontWeight: '800' },
  progress: { flexDirection: 'row', marginTop: 20 },
  step: { flex: 1, alignItems: 'center' },
  stepTop: { width: '100%', height: 18, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', right: '50%', width: '100%', height: 3, backgroundColor: '#E3E6EA' },
  lineDone: { backgroundColor: '#F07A43' },
  dot: { zIndex: 2, width: 11, height: 11, borderRadius: 6, backgroundColor: colors.border },
  dotDone: { backgroundColor: '#F07A43' },
  dotCurrent: { width: 15, height: 15, borderRadius: 8, borderWidth: 3, borderColor: '#FFD7C5', backgroundColor: '#E85F25' },
  stepLabel: { marginTop: 5, color: '#A0A6AE', fontSize: 9, textAlign: 'center' },
  stepLabelDone: { color: colors.primary, fontWeight: '700' },
  cancelledBox: { marginTop: 17, padding: 11, borderRadius: 8, backgroundColor: '#FFE9EC' },
  cancelledText: { color: '#D73545', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  detailHint: { marginTop: 14, color: colors.primary, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemText: { color: '#454A52', fontSize: 12 },
  delivery: { marginTop: 7, color: '#656C76', fontSize: 12 },
  logout: { alignSelf: 'stretch', alignItems: 'center', marginTop: 0, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  logoutText: { color: colors.primary, fontWeight: '700' },
});
