import { useState } from 'react';
import {
  ImageBackground,
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
import type { NguoiDung } from '../types';

interface ThuocTinhDangNhap {
  khiDangNhap: (taiKhoan: NguoiDung) => void;
  khiDangKy: () => void;
}

const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000/api/login'
  : 'http://10.21.61.245:3000/api/login';

interface DuLieuDangNhap {
  message?: string;
  token?: string;
  user?: { id: number; name: string; student_code: string; email: string; phone: string | null; role: 'user' | 'admin' };
}

export default function ManHinhDangNhap({ khiDangNhap, khiDangKy }: ThuocTinhDangNhap) {
  const { width } = useWindowDimensions();
  const laManHinhRong = width >= 820;
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [thongBao, setThongBao] = useState('');
  const [dangGui, setDangGui] = useState(false);

  async function xuLyDangNhap() {
    const emailDaCat = email.trim().toLowerCase();

    if (!emailDaCat || !matKhau) {
      setThongBao('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      setDangGui(true);
      setThongBao('');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailDaCat, password: matKhau }),
      });
      const data: DuLieuDangNhap = await response.json();

      if (!response.ok || !data.user || !data.token) {
        setThongBao(data.message || 'Đăng nhập không thành công.');
        return;
      }

      khiDangNhap({
        id: data.user.id,
        hoTen: data.user.name,
        maSinhVien: data.user.student_code,
        email: data.user.email,
        phone: data.user.phone || '',
        role: data.user.role,
        token: data.token,
      });
    } catch (error) {
      setThongBao('Không thể kết nối đến server.');
    } finally {
      setDangGui(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.layout, !laManHinhRong && styles.layoutMobile]}>
        <ScrollView
          style={[styles.formColumn, laManHinhRong && styles.formColumnDesktop]}
          contentContainerStyle={styles.formColumnContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <View style={styles.brand}>
              <View style={styles.logo}><Text style={styles.logoText}>SC</Text></View>
              <Text style={styles.brandText}>SMART CANTEEN</Text>
            </View>

            <Text style={styles.title}>Chào mừng trở lại!</Text>
            <Text style={styles.description}>Đăng nhập để tiếp tục sử dụng Smart Canteen</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@gmail.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordField}>
              <TextInput
                style={styles.passwordInput}
                value={matKhau}
                onChangeText={setMatKhau}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!hienMatKhau}
                textContentType="password"
                autoComplete="password"
                onSubmitEditing={xuLyDangNhap}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setHienMatKhau((giaTri) => !giaTri)}
                accessibilityRole="button"
                accessibilityLabel={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <Text style={styles.eyeIcon}>{hienMatKhau ? '◉' : '◌'}</Text>
              </Pressable>
            </View>

            {thongBao !== '' && <Text style={styles.message}>{thongBao}</Text>}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !dangGui && styles.buttonPressed,
                dangGui && styles.buttonDisabled,
              ]}
              onPress={xuLyDangNhap}
              disabled={dangGui}
            >
              <Text style={styles.buttonText}>{dangGui ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
            </Pressable>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <Pressable onPress={khiDangKy} accessibilityRole="link">
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {laManHinhRong && (
          <View style={styles.imageColumn}>
            <ImageBackground
              source={require('../../assets/images/mi-xao-bo.jpg')}
              style={styles.image}
              imageStyle={styles.imageRadius}
              resizeMode="cover"
            >
              <View style={styles.imageOverlay} />
              <View style={styles.imageCopy}>
                <View style={styles.accentLine} />
                <Text style={styles.imageTitle}>Bữa ăn ngon,{`\n`}ngày học tốt hơn.</Text>
                <Text style={styles.imageDescription}>
                  Đặt món nhanh chóng và tiện lợi cùng Smart Canteen.
                </Text>
              </View>
            </ImageBackground>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F7' },
  layout: { flex: 1, flexDirection: 'row', padding: 24, gap: 24 },
  layoutMobile: { padding: 0 },
  formColumn: { flex: 1 },
  formColumnDesktop: { flexGrow: 0, flexBasis: '42%' },
  formColumnContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  form: { width: '100%', maxWidth: 460 },
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 42 },
  logo: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 11, borderRadius: 11, backgroundColor: '#E86A33' },
  logoText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: -0.5 },
  brandText: { color: '#292C31', fontSize: 15, fontWeight: '800', letterSpacing: 1.1 },
  title: { marginBottom: 10, color: '#20242A', fontSize: 34, fontWeight: '800', letterSpacing: -0.7 },
  description: { marginBottom: 34, color: '#757B84', fontSize: 15, lineHeight: 22 },
  label: { marginBottom: 8, color: '#34383E', fontSize: 14, fontWeight: '700' },
  input: { height: 52, marginBottom: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E3E7', borderRadius: 12, backgroundColor: '#FFFFFF', color: '#20242A', fontSize: 16 },
  passwordField: { height: 52, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E0E3E7', borderRadius: 12, backgroundColor: '#FFFFFF' },
  passwordInput: { flex: 1, height: '100%', paddingLeft: 16, color: '#20242A', fontSize: 16 },
  eyeButton: { width: 50, height: '100%', alignItems: 'center', justifyContent: 'center' },
  eyeIcon: { color: '#757B84', fontSize: 24, lineHeight: 26 },
  message: { marginBottom: 14, color: '#D85624', fontSize: 14 },
  button: { height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4, borderRadius: 12, backgroundColor: '#E86A33', shadowColor: '#A5411B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 3 },
  buttonPressed: { backgroundColor: '#D95B25', transform: [{ scale: 0.995 }] },
  buttonDisabled: { opacity: 0.68 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { color: '#757B84', fontSize: 14 },
  registerLink: { color: '#D85624', fontSize: 14, fontWeight: '700' },
  imageColumn: { flex: 1, overflow: 'hidden', borderRadius: 24 },
  image: { flex: 1, justifyContent: 'flex-end', overflow: 'hidden' },
  imageRadius: { borderRadius: 24 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 24, backgroundColor: 'rgba(25, 16, 10, 0.34)' },
  imageCopy: { maxWidth: 520, paddingHorizontal: 48, paddingBottom: 52 },
  accentLine: { width: 44, height: 5, marginBottom: 20, borderRadius: 3, backgroundColor: '#F18A56' },
  imageTitle: { marginBottom: 14, color: '#FFFFFF', fontSize: 38, fontWeight: '800', lineHeight: 46 },
  imageDescription: { color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 24 },
});
