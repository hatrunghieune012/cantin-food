import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { MonAn } from '../types';

interface ThuocTinhTheMonAn {
  monAn: MonAn;
  khiNhan: () => void;
  khiThemVaoGio?: () => void;
  soLuongTrongGio?: number;
}

export default function TheMonAn({ monAn, khiNhan, khiThemVaoGio, soLuongTrongGio = 0 }: ThuocTinhTheMonAn) {
  const { width } = useWindowDimensions();
  const chieuRongThe = width >= 1100 ? '23.5%' : width >= 650 ? '48.5%' : '48%';
  const laMobile = width < 650;
  const hetMon = !monAn.conMon || monAn.dangBan === false || monAn.soLuongTon <= 0;
  const khongTheThem = hetMon || soLuongTrongGio >= monAn.soLuongTon;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: chieuRongThe, minHeight: laMobile ? 290 : 310 },
        pressed && styles.pressed,
      ]}
      onPress={khiNhan}
    >
      <Image
        source={monAn.hinhAnh}
        style={[styles.image, { height: laMobile ? 116 : 154 }]}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{monAn.ten}</Text>
          <Text style={[styles.stockBadge, !monAn.conMon && styles.outBadge]}>{monAn.conMon ? 'Còn hàng' : 'Hết hàng'}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">{monAn.moTa}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{dinhDangGia(monAn.gia)}</Text>
          {khiThemVaoGio && (
            <Pressable accessibilityRole="button" accessibilityLabel={`Thêm ${monAn.ten} vào giỏ hàng`} disabled={khongTheThem} style={[styles.addButton, khongTheThem && styles.addDisabled]} onPress={(event) => { event.stopPropagation(); khiThemVaoGio(); }}>
              <Text style={[styles.addText, khongTheThem && styles.addTextDisabled]}>{hetMon ? 'Hết hàng' : khongTheThem ? 'Đã đủ số lượng' : 'Thêm vào giỏ'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEEF1', borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#20242A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
  image: { width: '100%', backgroundColor: '#F1F2F4' },
  info: { flex: 1, minHeight: 140, padding: 13 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  name: { flex: 1, minHeight: 20, color: '#20242A', fontSize: 16, fontWeight: '800', lineHeight: 20 },
  stockBadge: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, color: '#168A45', backgroundColor: '#E5F8EB', fontSize: 8, fontWeight: '800' },
  outBadge: { color: '#D73545', backgroundColor: '#FFE9EC' },
  description: { minHeight: 34, marginTop: 5, color: '#8A9099', fontSize: 12, lineHeight: 17 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 10 },
  price: { color: '#F15F24', fontSize: 16, fontWeight: '800' },
  addButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 9, backgroundColor: '#FFF0E9' },
  addText: { color: '#F15F24', fontSize: 11, fontWeight: '800' },
  addDisabled: { backgroundColor: '#F1F2F4' },
  addTextDisabled: { color: '#8A9099' },
});
