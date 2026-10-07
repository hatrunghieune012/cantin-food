import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import TheMonAn from '../components/FoodCard';
import { danhSachMonAn } from '../data/foods';
import type { MonAn, MonTrongGioHang } from '../types';

interface ThuocTinhThucDon {
  khiChonMon: (monAn: MonAn) => void;
  gioHang: MonTrongGioHang[];
  setGioHang: (gioHangMoi: MonTrongGioHang[]) => void;
}
const danhMuc = ['Tất cả', 'Cơm', 'Mì', 'Đồ uống', 'Ăn vặt', 'Món khác'] as const;

export default function ManHinhThucDon({ khiChonMon, gioHang, setGioHang }: ThuocTinhThucDon) {
  const [muc, setMuc] = useState<(typeof danhMuc)[number]>('Tất cả');
  const [tuKhoa, setTuKhoa] = useState('');
  const monAn = useMemo(() => danhSachMonAn.filter((mon) => (muc === 'Tất cả' || mon.danhMuc === muc) && mon.ten.toLowerCase().includes(tuKhoa.toLowerCase().trim())), [muc, tuKhoa]);

  function themVaoGio(mon: MonAn) {
    const monDaCo = gioHang.find((item) => item.ma === mon.ma);
    if (monDaCo) {
      setGioHang(gioHang.map((item) => item.ma === mon.ma ? { ...item, soLuong: item.soLuong + 1 } : item));
    } else {
      setGioHang([...gioHang, { ...mon, soLuong: 1 }]);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>SMART CANTEEN</Text>
      <Text style={styles.title}>Thực đơn hôm nay</Text>
      <Text style={styles.subtitle}>Chọn món ngon, đặt nhanh và nhận tại căng tin.</Text>
      <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.input} value={tuKhoa} onChangeText={setTuKhoa} placeholder="Tìm trong thực đơn..." placeholderTextColor="#9AA0A9" /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {danhMuc.map((item) => <Pressable key={item} style={[styles.category, muc === item && styles.active]} onPress={() => setMuc(item)}><Text style={[styles.categoryText, muc === item && styles.activeText]}>{item}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.count}>{monAn.length} món đang phục vụ</Text>
      <View style={styles.grid}>{monAn.map((mon) => <TheMonAn key={mon.ma} monAn={mon} khiNhan={() => khiChonMon(mon)} khiThemVaoGio={() => themVaoGio(mon)} />)}</View>
      {monAn.length === 0 && <Text style={styles.empty}>Không tìm thấy món ăn phù hợp.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 1240, alignSelf: 'center', padding: 20, paddingBottom: 40 },
  eyebrow: { color: '#F15F24', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 6, color: '#20242A', fontSize: 32, fontWeight: '900' },
  subtitle: { marginTop: 7, color: '#7A818B', fontSize: 15 },
  search: { height: 50, flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: '#DEE1E6', borderRadius: 14, backgroundColor: '#FFFFFF' },
  searchIcon: { marginRight: 10, fontSize: 24 },
  input: { flex: 1, height: '100%', color: '#20242A', outlineStyle: 'none' } as never,
  categories: { gap: 10, paddingVertical: 16 },
  category: { paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1, borderColor: '#E6E8EB', borderRadius: 22, backgroundColor: '#FFFFFF' },
  active: { borderColor: '#FF6629', backgroundColor: '#FF6629' },
  categoryText: { color: '#444A52', fontWeight: '700' },
  activeText: { color: '#FFFFFF' },
  count: { marginBottom: 14, color: '#7A818B', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: 16 },
  empty: { padding: 40, color: '#8A9099', textAlign: 'center' },
});
