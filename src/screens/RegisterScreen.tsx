import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import type { NguoiDung } from '../types';

interface ThuocTinhDangKy {
  khiDangKy: (nguoiDung: NguoiDung) => void;
  khiQuayLai: () => void;
}

export default function ManHinhDangKy({ khiDangKy, khiQuayLai }: ThuocTinhDangKy) {
  const [hoTen, setHoTen] = useState('');
  const [maSinhVien, setMaSinhVien] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [thongBao, setThongBao] = useState('');

  // Hàm xử lý chạy khi người dùng nhấn nút Đăng ký.
  function xuLyDangKy() {
    if (hoTen === '' || maSinhVien === '' || email === '' || matKhau === '' || xacNhanMatKhau === '') {
      setThongBao('Vui lòng nhập đầy đủ thông tin.');
    } else if (matKhau !== xacNhanMatKhau) {
      setThongBao('Mật khẩu xác nhận không khớp.');
    } else {
      khiDangKy({
        hoTen,
        maSinhVien,
        email,
        matKhau,
      });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={khiQuayLai}>
          <Text style={styles.back}>‹ Quay lại đăng nhập</Text>
        </Pressable>

        <Text style={styles.title}>Đăng ký</Text>

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} value={hoTen} onChangeText={setHoTen} placeholder="Nhập họ và tên" />

        <Text style={styles.label}>Mã số sinh viên</Text>
        <TextInput style={styles.input} value={maSinhVien} onChangeText={setMaSinhVien} placeholder="Nhập mã số sinh viên" keyboardType="number-pad" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Nhập email" keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput style={styles.input} value={matKhau} onChangeText={setMatKhau} placeholder="Nhập mật khẩu" secureTextEntry />

        <Text style={styles.label}>Xác nhận mật khẩu</Text>
        <TextInput style={styles.input} value={xacNhanMatKhau} onChangeText={setXacNhanMatKhau} placeholder="Nhập lại mật khẩu" secureTextEntry />

        {thongBao !== '' && <Text style={styles.message}>{thongBao}</Text>}

        <Pressable style={styles.button} onPress={xuLyDangKy}>
          <Text style={styles.buttonText}>Đăng ký</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  back: { marginBottom: 28, color: '#D85624', fontWeight: '700' },
  title: { marginBottom: 24, color: '#25282D', fontSize: 28, fontWeight: '800' },
  label: { marginBottom: 7, color: '#34383E', fontWeight: '700' },
  input: { height: 50, marginBottom: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E0E3E7', borderRadius: 12, backgroundColor: '#FAFAFA' },
  message: { marginBottom: 12, color: '#D85624', textAlign: 'center' },
  button: { height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 6, borderRadius: 12, backgroundColor: '#E86A33' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
