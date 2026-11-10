import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Interactive from './Interactive';
import FoodImage from './FoodImage';
import { cardShadow, colors } from '../styles/theme';
import { dinhDangGia } from '../data/foods';
import type { MonAn } from '../types';

interface ThuocTinhTheMonAn {
  monAn: MonAn;
  khiNhan: () => void;
  khiThemVaoGio?: () => void;
  soLuongTrongGio?: number;
  cardWidth?: number;
}

export default function TheMonAn({ monAn, khiNhan, khiThemVaoGio, soLuongTrongGio = 0, cardWidth }: ThuocTinhTheMonAn) {
  const [hovered, setHovered] = useState(false);
  const { width } = useWindowDimensions();
  const chieuRongThe = width >= 1200 ? '23.5%' : width >= 600 ? '48.5%' : '100%';
  const laMobile = width < 552;
  const hetMon = !monAn.conMon || monAn.dangBan === false || monAn.soLuongTon <= 0;
  const khongTheThem = hetMon || soLuongTrongGio >= monAn.soLuongTon;

  return (
    <Interactive
      accessibilityLabel={`Xem chi tiết ${monAn.ten}`}
      onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth ?? chieuRongThe },
        hovered && { borderColor: colors.border, transform: [{ translateY: -2 }] },
        laMobile && styles.mobileCard,
        pressed && styles.pressed,
      ]}
      onPress={khiNhan}
    >
      <FoodImage
        source={monAn.hinhAnh}
        name={monAn.ten}
        drink={monAn.danhMuc === 'Đồ uống'}
        style={[styles.image, laMobile && styles.mobileImage]}
      />
      <View style={[styles.info, laMobile && styles.mobileInfo]}>
        <View style={[styles.nameRow, laMobile && styles.mobileNameRow]}>
          <Text style={[styles.name, laMobile && styles.mobileName]} numberOfLines={2} ellipsizeMode="tail">{monAn.ten}</Text>
          <Text style={[styles.stockBadge, hetMon && styles.outBadge]}>{hetMon ? 'Hết hàng' : 'Còn hàng'}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">{monAn.moTa}</Text>
        {soLuongTrongGio > 0 && <Text style={styles.cartCount}>Trong giỏ: {soLuongTrongGio}</Text>}
        <View style={styles.footer}>
          <Text style={styles.price}>{dinhDangGia(monAn.gia)}</Text>
          {khiThemVaoGio && (
            <Interactive accessibilityRole="button" accessibilityLabel={`Thêm ${monAn.ten} vào giỏ hàng`} disabled={khongTheThem} style={[styles.addButton, laMobile && styles.mobileAddButton, khongTheThem && styles.addDisabled]} onPress={(event) => { event.stopPropagation(); khiThemVaoGio(); }}>
              <Text style={[styles.addText, khongTheThem && styles.addTextDisabled]}>{hetMon ? 'Hết hàng' : khongTheThem ? 'Đã đủ số lượng' : 'Thêm vào giỏ'}</Text>
            </Interactive>
          )}
        </View>
      </View>
    </Interactive>
  );
}

const styles = StyleSheet.create({
  card: { ...cardShadow, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
  mobileCard: { flexDirection: 'column' },
  mobileImage: { width: '100%', aspectRatio: 16 / 9 },
  mobileInfo: { minWidth: 0, minHeight: 200, padding: 16 },
  mobileNameRow: { alignItems: 'flex-start' },
  mobileName: { minHeight: 24 },
  mobileAddButton: { minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.background },
  info: { flex: 1, minHeight: 240, padding: 16, minWidth: 0 },
  nameRow: { alignItems: 'flex-start', gap: 8 },
  name: { minHeight: 40, color: colors.text, fontSize: 16, fontWeight: '800', lineHeight: 20 },
  stockBadge: { overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 5, borderRadius: 6, color: colors.green, backgroundColor: colors.greenSoft, fontSize: 10, fontWeight: '700' },
  outBadge: { color: colors.red, backgroundColor: colors.redSoft },
  description: { minHeight: 36, marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 18 },
  cartCount: { marginTop: 8, color: colors.primary, fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 16 },
  price: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  addButton: { width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary },
  addText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addDisabled: { backgroundColor: '#F1F2F4' },
  addTextDisabled: { color: '#8A9099' },
});
