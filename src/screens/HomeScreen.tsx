import { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import TheMonAn from '../components/FoodCard';
import { danhSachMonAn } from '../data/foods';
import type { MonAn, NguoiDung } from '../types';

interface ThuocTinhTrangChu {
  nguoiDungHienTai: NguoiDung | null;
  khiChonMon: (monAn: MonAn) => void;
  khiXemThucDon: () => void;
}

const danhMuc = ['Tất cả', 'Cơm', 'Mì', 'Đồ uống', 'Ăn vặt', 'Món khác'] as const;

export default function ManHinhTrangChu({ nguoiDungHienTai, khiChonMon, khiXemThucDon }: ThuocTinhTrangChu) {
  const { width } = useWindowDimensions();
  const [tuKhoa, setTuKhoa] = useState('');
  const [mucDangChon, setMucDangChon] = useState<(typeof danhMuc)[number]>('Tất cả');
  const ten = nguoiDungHienTai?.hoTen || 'Sinh viên';
  const laMobile = width < 650;

  const monHienThi = useMemo(() => danhSachMonAn.filter((mon) => {
    const dungDanhMuc = mucDangChon === 'Tất cả' || mon.danhMuc === mucDangChon;
    return dungDanhMuc && mon.ten.toLowerCase().includes(tuKhoa.trim().toLowerCase());
  }), [mucDangChon, tuKhoa]);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {laMobile && (
        <View style={styles.welcome}>
          <Text style={styles.welcomeTitle}>Xin chào, {ten} 👋</Text>
          <Text style={styles.welcomeText}>Hôm nay bạn muốn ăn gì?</Text>
        </View>
      )}

      <ImageBackground source={require('../../assets/images/mi-xao-bo.jpg')} style={[styles.banner, laMobile && styles.bannerMobile]} imageStyle={styles.bannerRadius} resizeMode="cover">
        <View style={styles.overlay} />
        <View style={styles.bannerCopy}>
          <Text style={[styles.bannerTitle, laMobile && styles.bannerTitleMobile]}>Bữa ăn ngon</Text>
          <Text style={[styles.bannerSubtitle, laMobile && styles.bannerSubtitleMobile]}>Nạp năng lượng cho ngày học mới</Text>
          {!laMobile && <Text style={styles.bannerMeta}>Đa dạng món ăn · Giá cả hợp lý · Phục vụ sinh viên</Text>}
          <Pressable style={styles.bannerButton} onPress={khiXemThucDon}>
            <Text style={styles.bannerButtonText}>Xem thực đơn  →</Text>
          </Pressable>
        </View>
      </ImageBackground>

      <View style={styles.tools}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput style={styles.searchInput} value={tuKhoa} onChangeText={setTuKhoa} placeholder="Tìm món ăn yêu thích..." placeholderTextColor="#9AA0A9" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {danhMuc.map((muc) => (
            <Pressable key={muc} style={[styles.category, mucDangChon === muc && styles.categoryActive]} onPress={() => setMucDangChon(muc)}>
              <Text style={[styles.categoryText, mucDangChon === muc && styles.categoryTextActive]}>{muc}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Món ăn nổi bật</Text>
        <Pressable onPress={khiXemThucDon}><Text style={styles.seeAll}>Xem tất cả  →</Text></Pressable>
      </View>
      <View style={styles.grid}>
        {monHienThi.map((monAn) => <TheMonAn key={monAn.ma} monAn={monAn} khiNhan={() => khiChonMon(monAn)} />)}
      </View>
      {monHienThi.length === 0 && <Text style={styles.empty}>Không tìm thấy món ăn phù hợp.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 1240, alignSelf: 'center', padding: 18, paddingBottom: 40 },
  welcome: { marginBottom: 16 },
  welcomeTitle: { color: '#20242A', fontSize: 19, fontWeight: '800' },
  welcomeText: { marginTop: 4, color: '#8A9099', fontSize: 13 },
  banner: { height: 250, justifyContent: 'center', overflow: 'hidden', borderRadius: 18 },
  bannerMobile: { height: 176 },
  bannerRadius: { borderRadius: 18 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(167, 57, 8, 0.53)' },
  bannerCopy: { maxWidth: 570, paddingHorizontal: 54 },
  bannerTitle: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  bannerTitleMobile: { fontSize: 25 },
  bannerSubtitle: { marginTop: 6, color: '#FFFFFF', fontSize: 25, fontWeight: '700' },
  bannerSubtitleMobile: { fontSize: 16 },
  bannerMeta: { marginTop: 14, color: '#FFF5EF', fontSize: 15 },
  bannerButton: { alignSelf: 'flex-start', marginTop: 18, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10, backgroundColor: '#FFFFFF' },
  bannerButtonText: { color: '#E9551C', fontWeight: '800' },
  tools: { marginTop: 16 },
  searchBox: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#DEE1E6', borderRadius: 24, backgroundColor: '#FFFFFF' },
  searchIcon: { marginRight: 10, color: '#20242A', fontSize: 25 },
  searchInput: { flex: 1, height: '100%', color: '#20242A', fontSize: 14, outlineStyle: 'none' } as never,
  categories: { gap: 10, paddingVertical: 14 },
  category: { minWidth: 82, alignItems: 'center', paddingHorizontal: 17, paddingVertical: 11, borderWidth: 1, borderColor: '#ECEEF1', borderRadius: 22, backgroundColor: '#F8F9FA' },
  categoryActive: { borderColor: '#FF6629', backgroundColor: '#FF6629' },
  categoryText: { color: '#3F454D', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  heading: { color: '#20242A', fontSize: 22, fontWeight: '900' },
  seeAll: { color: '#F15F24', fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: 16 },
  empty: { paddingVertical: 40, color: '#8A9099', textAlign: 'center' },
});
