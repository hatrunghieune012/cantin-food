import DemographicFields from '../components/DemographicFields';
import Interactive from '../components/Interactive';
import { colors } from '../styles/theme';
import { validBirthDate, passwordBytes } from '../accountValidation';
import { apiFetch } from '../api';
import { apiUrl as buildApiUrl } from '../api';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import type { NguoiDung } from '../types';

interface ThuocTinhDangKy {
  khiDangKy: (nguoiDung: NguoiDung) => void;
  khiQuayLai: () => void;
}

// Web gọi localhost; điện thoại thật gọi địa chỉ LAN của máy tính chạy backend.
const API_URL = buildApiUrl('/api/register');

export default function ManHinhDangKy({ khiDangKy, khiQuayLai }: ThuocTinhDangKy) {
  const [hoTen, setHoTen] = useState('');
  const [gender, setGender] = useState<NguoiDung['gender']>(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Hàm xử lý chạy khi người dùng nhấn nút Đăng ký.
  async function xuLyDangKy() {
    if (dangGui) return;
    const hoTenDaCat = hoTen.trim();
    const emailDaCat = email.trim();
    const soDienThoaiDaCat = soDienThoai.trim();

    if (!hoTenDaCat || !emailDaCat || !soDienThoaiDaCat || !matKhau || !gender || !dateOfBirth) {
      setThongBao('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (!/^\+?[0-9]{8,15}$/.test(soDienThoaiDaCat)) {
      setThongBao('Số điện thoại phải có từ 8 đến 15 chữ số.');
      return;
    }

    if (hoTenDaCat.length > 100 || emailDaCat.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDaCat)) {
      setThongBao('Họ tên tối đa 100 ký tự và email phải hợp lệ.'); return;
    }

    if (!validBirthDate(dateOfBirth)) {
      setThongBao('Ngày sinh không hợp lệ hoặc ở tương lai.');
      return;
    }
    if (matKhau.length < 8 || passwordBytes(matKhau) > 72) {
      setThongBao('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte UTF-8.');
      return;
    }

    try {
      setDangGui(true);
      setThongBao('');

      // fetch gửi dữ liệu JSON từ các TextInput đến API đăng ký.
      const response = await apiFetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: hoTenDaCat,
          gender,
          date_of_birth: dateOfBirth,
          email: emailDaCat,
          phone: soDienThoaiDaCat,
          password: matKhau,
        }),
      });

      const data: { message?: string } = await response.json();

      if (!response.ok) {
        setThongBao(data.message || 'Đăng ký không thành công.');
        return;
      }

      setThongBao(data.message || 'Đăng ký thành công');
      // Chờ một chút để người dùng nhìn thấy thông báo rồi mới quay lại đăng nhập.
      timer.current = setTimeout(() => {
        khiDangKy({
          id: 0,
          hoTen: hoTenDaCat,
          maSinhVien: '',
          gender,
          dateOfBirth,
          email: emailDaCat,
          phone: soDienThoaiDaCat,
          defaultAddress: '',
          role: 'user',
          token: '',
        });
      }, 1000);
    } catch (error) {
      setThongBao(error instanceof Error ? error.message : 'Không thể kết nối đến server.');
    } finally {
      setDangGui(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Interactive onPress={khiQuayLai}>
          <Text style={styles.back}>‹ Quay lại đăng nhập</Text>
        </Interactive>

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Bắt đầu những bữa ăn ngon cùng App Canteen.</Text>

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput accessibilityLabel="Họ và tên" editable={!dangGui} maxLength={100} autoComplete="name" style={styles.input} value={hoTen} onChangeText={setHoTen} placeholder="Nhập họ và tên" />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput accessibilityLabel="Số điện thoại" editable={!dangGui} style={styles.input} value={soDienThoai} onChangeText={setSoDienThoai} placeholder="Nhập số điện thoại" keyboardType="phone-pad" autoComplete="tel" />

        <Text style={styles.label}>Email</Text>
        <TextInput accessibilityLabel="Email" editable={!dangGui} style={styles.input} value={email} onChangeText={setEmail} placeholder="Nhập email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

        <DemographicFields gender={gender} dateOfBirth={dateOfBirth} onGender={setGender} onDate={setDateOfBirth} disabled={dangGui} />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput accessibilityLabel="Mật khẩu" editable={!dangGui} style={styles.input} value={matKhau} onChangeText={setMatKhau} placeholder="Ít nhất 8 ký tự" secureTextEntry autoComplete="new-password" />

        {thongBao !== '' && <Text accessibilityLiveRegion="polite" style={styles.message}>{thongBao}</Text>}

        <Interactive style={styles.button} onPress={xuLyDangKy} disabled={dangGui}>
          <Text style={styles.buttonText}>{dangGui ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
        </Interactive>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24, paddingBottom: 40 },
  back: { marginBottom: 28, color: colors.primaryDark, fontWeight: '700' },
  title: { marginBottom: 8, color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.muted, lineHeight: 22, marginBottom: 24 },
  label: { marginBottom: 7, color: colors.text, fontWeight: '700' },
  input: { minHeight: 52, marginBottom: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
  message: { marginBottom: 12, color: colors.primaryDark, textAlign: 'center' },
  button: { height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 6, borderRadius: 12, backgroundColor: colors.primary },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
