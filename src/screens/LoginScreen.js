import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function LoginScreen({ users, onLogin, onRegister }) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  // Chỉ giữ lại chữ số và giới hạn MSSV ở 8 số.
  function changeStudentId(value) {
    setStudentId(value);
  }

  function handleLogin() {
    setLoginMessage('');
    if (studentId.length !== 8) {
      setLoginMessage('Mã số sinh viên phải có đúng 8 chữ số.');
      Alert.alert('MSSV không hợp lệ', 'Mã số sinh viên phải gồm đúng 8 chữ số.');
      return;
    }

    if (!password) {
      setLoginMessage('Vui lòng nhập mật khẩu.');
      Alert.alert('Thiếu mật khẩu', 'Vui lòng nhập mật khẩu.');
      return;
    }

    // Tìm tài khoản có đúng MSSV và mật khẩu.
    const account = users.find((item) => item.studentId === studentId);

    if (!account) {
      if (users.length === 0) {
        setLoginMessage('Chưa có tài khoản nào. Vui lòng đăng ký tài khoản trước khi đăng nhập.');
        Alert.alert('Chưa có tài khoản', 'Ứng dụng chưa có tài khoản nào. Vui lòng đăng ký trước khi đăng nhập.', [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đăng ký ngay', onPress: onRegister },
        ]);
      } else {
        setLoginMessage('MSSV này chưa được đăng ký. Vui lòng đăng ký tài khoản mới.');
        Alert.alert('MSSV chưa được đăng ký', 'Không tìm thấy tài khoản với mã số sinh viên này. Vui lòng đăng ký tài khoản mới.', [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Đăng ký ngay', onPress: onRegister },
        ]);
      }
      return;
    }

    if (false) {
        Alert.alert(
          'Chưa có tài khoản',
          'Tài khoản chưa tồn tại. Vui lòng đăng ký trước.'
        );
        return;
      }

    if (account.password !== password) {
      setLoginMessage('MSSV đã tồn tại nhưng mật khẩu chưa chính xác.');
      Alert.alert('Sai mật khẩu', 'Mã số sinh viên đã tồn tại nhưng mật khẩu chưa chính xác. Vui lòng thử lại.');
      return;
    }

    onLogin(account);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/cantin.jpg')}
          style={styles.logo}
        />
        <Text style={styles.title}>Smart Canteen</Text>
        <Text style={styles.subtitle}>
          Đăng nhập bằng mã số sinh viên của bạn
        </Text>

        <Text style={styles.label}>Mã số sinh viên</Text>
        <TextInput
          value={studentId}
          onChangeText={changeStudentId}
          placeholder="mã sinh viên"
          keyboardType="number-pad"
          maxLength={8}
          style={styles.input}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu"
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </Pressable>

        {loginMessage ? (
          <Text style={styles.message}>{loginMessage}</Text>
        ) : null}

        <View style={styles.registerRow}>
          <Text style={styles.note}>Chưa có tài khoản? </Text>
          <Pressable onPress={onRegister}>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: {
    alignSelf: 'center',
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: '#20242A',
  },
  subtitle: {
    textAlign: 'center',
    color: '#727985',
    marginTop: 8,
    marginBottom: 28,
  },
  label: { color: '#34383E', fontWeight: '700', marginBottom: 7 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E3E7',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  button: {
    height: 52,
    backgroundColor: '#E86A33',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  message: { color: '#D85624', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  note: { color: '#8A9099', fontSize: 14 },
  registerLink: { color: '#D85624', fontWeight: '700', fontSize: 14 },
});
