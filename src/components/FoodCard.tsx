import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { dinhDangGia } from '../data/foods';
import type { MonAn } from '../types';

interface ThuocTinhTheMonAn {
  monAn: MonAn;
  khiNhan: () => void;
}

export default function TheMonAn({ monAn, khiNhan }: ThuocTinhTheMonAn) {
  return (
    <View style={styles.card}>
      <Image source={monAn.hinhAnh} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name}>{monAn.ten}</Text>
        <Text style={styles.price}>{dinhDangGia(monAn.gia)}</Text>
        <Text style={styles.description}>{monAn.moTa}</Text>

        <Pressable style={styles.button} onPress={khiNhan}>
          <Text style={styles.buttonText}>Xem món</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  image: { width: 92, height: 92, borderRadius: 12 },
  info: { flex: 1, marginLeft: 13 },
  name: { color: '#25282D', fontSize: 17, fontWeight: '700' },
  price: { marginTop: 4, color: '#E86A33', fontWeight: '700' },
  description: { marginTop: 4, color: '#858B94', fontSize: 12 },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#FFF0E9',
  },
  buttonText: { color: '#D85624', fontSize: 12, fontWeight: '700' },
});
