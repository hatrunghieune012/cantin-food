import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { MonAn } from '../types';

interface ThuocTinhTheMonAn {
  monAn: MonAn;
  khiNhan: () => void;
  khiThemVaoGio?: () => void;
}

export default function TheMonAn({ monAn, khiNhan, khiThemVaoGio }: ThuocTinhTheMonAn) {
  const { width } = useWindowDimensions();
  const chieuRongThe = width >= 1100 ? '23.5%' : width >= 650 ? '48.5%' : '48%';
  const laMobile = width < 650;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: chieuRongThe, height: laMobile ? 270 : 310 },
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
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{monAn.ten}</Text>
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">{monAn.moTa}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{dinhDangGia(monAn.gia)}</Text>
          {khiThemVaoGio && (
            <Pressable style={styles.addButton} onPress={(event) => { event.stopPropagation(); khiThemVaoGio(); }}>
              <Text style={styles.addText}>Thêm vào giỏ</Text>
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
  name: { minHeight: 20, color: '#20242A', fontSize: 16, fontWeight: '800', lineHeight: 20 },
  description: { minHeight: 34, marginTop: 5, color: '#8A9099', fontSize: 12, lineHeight: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 10 },
  price: { color: '#F15F24', fontSize: 16, fontWeight: '800' },
  addButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 9, backgroundColor: '#FFF0E9' },
  addText: { color: '#F15F24', fontSize: 11, fontWeight: '800' },
});
