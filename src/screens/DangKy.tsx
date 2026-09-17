import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

interface TaiKhoan {
  hoTen: string;
  maSinhVien: string;
  email: string;
  matKhau: string;
}

export default function DangKy() {
  const [hoTen, setHoTen] = useState('');
  const [maSinhVien, setMaSinhVien] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [thongBao, setThongBao] = useState('');

  function dangKy() {
    if (!hoTen || !maSinhVien || !email || !matKhau) {
      setThongBao('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const taiKhoanMoi: TaiKhoan = { hoTen, maSinhVien, email, matKhau };
    setThongBao(`Đăng ký thành công: ${taiKhoanMoi.hoTen}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>
      <TextInput style={styles.input} placeholder="Họ tên" value={hoTen} onChangeText={setHoTen} />
      <TextInput style={styles.input} placeholder="Mã sinh viên" value={maSinhVien} onChangeText={setMaSinhVien} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Mật khẩu" value={matKhau} onChangeText={setMatKhau} secureTextEntry />
      <Text>{thongBao}</Text>
      <Button title="Đăng ký" color="#F4A261" onPress={dangKy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  input: { borderWidth: 2, borderColor: 'black', padding: 12 },
});
