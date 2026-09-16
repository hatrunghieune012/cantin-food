import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function RegisterScreen({ users, setUsers, onBack }) {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // MSSV được dùng làm tên đăng nhập nên chỉ cho nhập đúng 8 chữ số.
  function changeStudentId(value) {
    setStudentId(value);
  }

  function handleRegister() {
    if (
      !fullName ||
      !studentId ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin đăng ký.');
      return;
    }

    if (studentId.length !== 8) {
      Alert.alert('MSSV không hợp lệ', 'Mã số sinh viên phải gồm đúng 8 chữ số.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu chưa khớp', 'Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    // Kiểm tra tài khoản có cùng MSSV hay chưa.
    if (users.find((item) => item.studentId === studentId)) {
        Alert.alert('Tài khoản đã tồn tại', 'Mã số sinh viên đã được đăng ký.');
        return;
      }

      // Kiểm tra email sau khi đã đưa về chữ thường để tránh đăng ký trùng.
      if (users.find((item) => item.email === email)) {
        Alert.alert('Email đã tồn tại', 'Email này đã được đăng ký.');
        return;
      }

      const newAccount = {
        fullName,
        studentId,
        email,
        password,
      };
      setUsers([...users, newAccount]);

      Alert.alert('Thành công', 'Đăng ký tài khoản thành công.');
      // Chuyển ngay về Login; không phụ thuộc callback của Alert trên web.
      onBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>‹ Quay lại đăng nhập</Text>
        </Pressable>

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>
          Mã số sinh viên sẽ được dùng để đăng nhập
        </Text>

        <Field label="Họ và tên">
          <TextInput
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
        </Field>

        <Field label="Mã số sinh viên">
          <TextInput
            placeholder="Ví dụ: 23103019"
            value={studentId}
            onChangeText={changeStudentId}
            keyboardType="number-pad"
            maxLength={8}
            style={styles.input}
          />
        </Field>

        <Field label="Email">
          <TextInput
            placeholder="student@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </Field>

        <Field label="Mật khẩu">
          <TextInput
            placeholder="Ít nhất 6 ký tự"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </Field>

        <Field label="Xác nhận mật khẩu">
          <TextInput
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
        </Field>

        <Pressable style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Đăng ký</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  back: { color: '#D85624', fontWeight: '700', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', color: '#25282D' },
  subtitle: { color: '#858B94', marginTop: 7, marginBottom: 24 },
  field: { marginBottom: 12 },
  label: { color: '#34383E', fontWeight: '700', marginBottom: 7 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E3E7',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FAFAFA',
  },
  button: {
    height: 52,
    backgroundColor: '#E86A33',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
      // Tạo object tài khoản mới rồi thêm vào danh sách cũ.
