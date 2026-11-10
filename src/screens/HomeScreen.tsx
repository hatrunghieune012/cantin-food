import { colors, pageLayout } from '../styles/theme';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import FoodCatalog, { CatalogState } from '../components/FoodCatalog';
import Interactive from '../components/Interactive';
import FoodImage from '../components/FoodImage';
import type { MonAn, MonTrongGioHang, NguoiDung } from '../types';

interface ThuocTinhTrangChu extends CatalogState {
  nguoiDungHienTai: NguoiDung | null;
  danhSachMonAn: MonAn[];
  khiChonMon: (monAn: MonAn) => void;
  khiXemThucDon: () => void;
  gioHang: MonTrongGioHang[];
  khiThemVaoGio: (monAn: MonAn) => void;
}

export default function ManHinhTrangChu({ nguoiDungHienTai, danhSachMonAn, khiChonMon, khiXemThucDon, gioHang, khiThemVaoGio, loading, error, onRetry }: ThuocTinhTrangChu) {
  const { width } = useWindowDimensions();
  const laMobile = width < 768;
  const heroFood = danhSachMonAn.find(food => food.conMon && food.dangBan !== false) || danhSachMonAn[0];
  const ten = nguoiDungHienTai?.hoTen || 'bạn';
  return <ScrollView contentContainerStyle={[styles.container, width >= 768 && { padding: 32 }]} keyboardShouldPersistTaps="handled">
    <View style={styles.welcome}>
      <Text style={styles.welcomeTitle}>Xin chào, {ten}!</Text>
      <Text style={styles.welcomeText}>Chọn bữa ăn yêu thích, nhận món tại căn tin.</Text>
    </View>
    <View style={[styles.banner, laMobile && styles.bannerMobile]}>
      <View style={[styles.bannerCopy, laMobile && styles.bannerCopyMobile]}>
        <Text style={styles.eyebrow}>TƯƠI NGON MỖI NGÀY</Text>
        <Text style={[styles.bannerTitle, laMobile && styles.bannerTitleMobile]}>Bữa ngon giữa giờ học</Text>
        <Text style={styles.bannerSubtitle}>Đặt trước. Đến quầy. Thưởng thức.</Text>
        <Text style={styles.bannerMeta}>Chọn món bạn yêu thích và tận hưởng giờ nghỉ trọn vẹn.</Text>
        <Interactive style={styles.bannerButton} onPress={khiXemThucDon}><Text style={styles.bannerButtonText}>Khám phá thực đơn →</Text></Interactive>
      </View>
      {heroFood && <View style={[styles.heroVisual, laMobile && styles.heroVisualMobile]}>
        <FoodImage source={heroFood.hinhAnh} name={heroFood.ten} drink={heroFood.danhMuc === 'Đồ uống'} style={styles.heroImage} />
        <View style={styles.heroCaption}><Text style={styles.heroLabel}>GỢI Ý CHO BỮA HÔM NAY</Text><Text style={styles.heroName}>{heroFood.ten}</Text></View>
      </View>}
    </View>
    <View style={{ marginTop: 24 }}><FoodCatalog foods={danhSachMonAn} cart={gioHang} onSelect={khiChonMon} onAdd={khiThemVaoGio} title="Món ăn nổi bật" onSeeAll={khiXemThucDon} loading={loading} error={error} onRetry={onRetry} /></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { ...pageLayout },
  welcome: { marginBottom: 16 },
  welcomeTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  welcomeText: { marginTop: 4, color: '#626D7B', fontSize: 13 },
  banner: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderRadius: 16, backgroundColor: colors.soft, padding: 32, gap: 32 },
  bannerMobile: { flexDirection: 'column', alignItems: 'stretch', padding: 24, gap: 24 },
  bannerCopy: { flex: 1, minWidth: 0, paddingVertical: 16 },
  bannerCopyMobile: { flex: 0, paddingVertical: 0 },
  eyebrow: { color: colors.primaryDark, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  bannerTitle: { marginTop: 12, color: colors.text, fontSize: 42, lineHeight: 50, fontWeight: '800' },
  bannerTitleMobile: { fontSize: 30, lineHeight: 38 },
  bannerSubtitle: { marginTop: 16, color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: '600' },
  bannerMeta: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 22 },
  bannerButton: { alignSelf: 'flex-start', marginTop: 24, minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary },
  bannerButtonText: { color: colors.surface, fontWeight: '700' },
  heroVisual: { flex: 1, minWidth: 0, maxWidth: 460, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  heroVisualMobile: { flex: 0, width: '100%', maxWidth: '100%' },
  heroImage: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surface },
  heroCaption: { padding: 16, gap: 4 },
  heroLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroName: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: '700' },
});
