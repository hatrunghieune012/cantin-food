import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NguoiDung } from '../types';

interface ThuocTinhDangNhap {
  danhSachNguoiDung: NguoiDung[];
  khiDangNhap: (taiKhoan: NguoiDung) => void;
  khiDangKy: () => void;
}

export default function ManHinhDangNhap({ danhSachNguoiDung, khiDangNhap, khiDangKy }: ThuocTinhDangNhap) {
  const [maSinhVien, setMaSinhVien] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [thongBao, setThongBao] = useState('');

  function xuLyDangNhap() {
    if (maSinhVien === '' || matKhau === '') {
      setThongBao('Vui lòng nhập đầy đủ mã sinh viên và mật khẩu.');
      return;
    }

    const taiKhoan = danhSachNguoiDung.find(
      (nguoi) => nguoi.maSinhVien === maSinhVien && nguoi.matKhau === matKhau,
    );

    if (taiKhoan) {
      setThongBao('');
      khiDangNhap(taiKhoan);
    } else {
      setThongBao('Mã sinh viên hoặc mật khẩu không đúng.');
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

        <Pressable style={styles.button} onPress={xuLyDangNhap}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
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
