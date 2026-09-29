import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NguoiDung } from '../types';

interface ThuocTinhDangNhap {
  khiDangNhap: (taiKhoan: NguoiDung) => void;
  khiDangKy: () => void;
}

// Web gọi localhost; điện thoại thật gọi địa chỉ LAN của máy tính chạy backend.
const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000/api/login'
  : 'http://10.21.61.245:3000/api/login';

interface DuLieuDangNhap {
  message?: string;
  user?: {
    full_name: string;
    student_code: string;
    email: string;
  };
}

export default function ManHinhDangNhap({ khiDangNhap, khiDangKy }: ThuocTinhDangNhap) {
  const [maSinhVien, setMaSinhVien] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangGui, setDangGui] = useState(false);

  async function xuLyDangNhap() {
    const maSinhVienDaCat = maSinhVien.trim();

    if (!maSinhVienDaCat || !matKhau) {
      setThongBao('Vui lòng nhập đầy đủ mã sinh viên và mật khẩu.');
      return;
    }

    try {
      setDangGui(true);
      setThongBao('');

      // Gửi MSSV và mật khẩu đến API để kiểm tra tài khoản trong MySQL.
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: maSinhVienDaCat,
          password: matKhau,
        }),
      });

      const data: DuLieuDangNhap = await response.json();

      if (!response.ok || !data.user) {
        setThongBao(data.message || 'Đăng nhập không thành công.');
        return;
      }

      khiDangNhap({
        hoTen: data.user.full_name,
        maSinhVien: data.user.student_code,
        email: data.user.email,
      });
    } catch (error) {
      setThongBao('Không thể kết nối đến server.');
    } finally {
      setDangGui(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Đăng nhập</Text>

        <Text style={styles.label}>Mã số sinh viên</Text>
        <TextInput
          style={styles.input}
          value={maSinhVien}
          onChangeText={setMaSinhVien}
          placeholder="Nhập mã số sinh viên"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          value={matKhau}
          onChangeText={setMatKhau}
          placeholder="Nhập mật khẩu"
          secureTextEntry
        />

        {thongBao !== '' && <Text style={styles.message}>{thongBao}</Text>}

        <Pressable style={styles.button} onPress={xuLyDangNhap} disabled={dangGui}>
          <Text style={styles.buttonText}>{dangGui ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
        </Pressable>

        <Pressable onPress={khiDangKy}>
          <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { marginBottom: 28, color: '#20242A', fontSize: 30, fontWeight: '800', textAlign: 'center' },
  label: { marginBottom: 7, color: '#34383E', fontWeight: '700' },
  input: { height: 52, marginBottom: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E3E7', borderRadius: 12, backgroundColor: '#FAFAFA', fontSize: 16 },
  message: { marginBottom: 12, color: '#D85624', textAlign: 'center' },
  button: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#E86A33' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 22, color: '#D85624', fontWeight: '700', textAlign: 'center' },
});
