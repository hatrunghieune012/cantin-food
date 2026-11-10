import { colors, pageLayout } from '../styles/theme';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import FoodCatalog, { CatalogState } from '../components/FoodCatalog';
import type { MonAn, MonTrongGioHang } from '../types';

interface ThuocTinhThucDon extends CatalogState {
  khiChonMon: (monAn: MonAn) => void;
  danhSachMonAn: MonAn[];
  gioHang: MonTrongGioHang[];
  khiThemVaoGio: (monAn: MonAn) => void;
}
export default function ManHinhThucDon({ khiChonMon, danhSachMonAn, gioHang, khiThemVaoGio, loading, error, onRetry }: ThuocTinhThucDon) {
  const { width } = useWindowDimensions();
  return <ScrollView contentContainerStyle={[styles.container, width >= 768 && { padding: 32 }]} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>MỖI NGÀY MỘT BỮA NGON</Text>
    <Text style={styles.title}>Thực đơn hôm nay</Text>
    <Text style={styles.subtitle}>Chọn món bạn thích, nhận tại quầy vào giờ phù hợp.</Text>
    <View style={{ marginTop: 24 }}><FoodCatalog foods={danhSachMonAn} cart={gioHang} onSelect={khiChonMon} onAdd={khiThemVaoGio} title="Khám phá món ăn" loading={loading} error={error} onRetry={onRetry} /></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { ...pageLayout },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 6, color: colors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { marginTop: 7, color: '#7A818B', fontSize: 15 },
});
