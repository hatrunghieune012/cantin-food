import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import TheMonAn from '../components/FoodCard';
import { danhSachMonAn } from '../data/foods';
import type { MonAn, NguoiDung } from '../types';

interface ThuocTinhTrangChu {
  nguoiDungHienTai: NguoiDung | null;
  khiChonMon: (monAn: MonAn) => void;
}

export default function ManHinhTrangChu({ nguoiDungHienTai, khiChonMon }: ThuocTinhTrangChu) {
  const ten = nguoiDungHienTai ? nguoiDungHienTai.hoTen : 'Sinh viên';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.small}>Thứ hai, 15 tháng 9</Text>
          <Text style={styles.greeting}>Xin chào, {ten} 👋</Text>
        </View>
        <Text style={styles.avatar}>SV</Text>
      </View>

      <View style={styles.banner}>
        <Image source={require('../../assets/images/cantin.jpg')} style={styles.bannerImage} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Bữa trưa ngon miệng</Text>
          <Text style={styles.bannerSubtitle}>Nạp năng lượng cho ngày học mới 🍱</Text>
        </View>
      </View>

      <Text style={styles.heading}>Hôm nay ăn gì?</Text>
      <Text style={styles.subheading}>Món ngon đang chờ bạn</Text>

      {danhSachMonAn.map((monAn) => (
        <TheMonAn
          key={monAn.ma}
          monAn={monAn}
          khiNhan={() => khiChonMon(monAn)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  small: { color: '#8A9099', fontSize: 12 },
  greeting: { marginTop: 5, color: '#25282D', fontSize: 20, fontWeight: '700' },
  avatar: { color: '#D85624', fontWeight: '700' },
  banner: { height: 125, marginBottom: 24, borderRadius: 18, overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%', opacity: 0.5 },
  bannerText: { position: 'absolute', top: 25, left: 18 },
  bannerTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  bannerSubtitle: { marginTop: 7, color: '#FFFFFF', fontSize: 13 },
  heading: { color: '#25282D', fontSize: 28, fontWeight: '800' },
  subheading: { marginTop: 5, marginBottom: 12, color: '#858B94' },
});
