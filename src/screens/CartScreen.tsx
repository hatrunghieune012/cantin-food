import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Dispatch, SetStateAction } from 'react';
import { formatPrice } from '../data/foods';
import type { CartItem, Order } from '../types';

interface CartScreenProps {
  cart: CartItem[];
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  setOrders: Dispatch<SetStateAction<Order[]>>;
  onHome: () => void;
}

export default function CartScreen({ cart, setCart, setOrders, onHome }: CartScreenProps) {
  function changeQuantity(id: number, amount: number) {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id: number) {
    setCart(cart.filter((item) => item.id !== id));
  }

  function clearAll() {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa toàn bộ giỏ hàng không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => setCart([]) },
      ]
    );
  }

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
        <Text style={styles.emptyText}>Hãy chọn món ăn yêu thích của bạn.</Text>
        <Pressable style={styles.orderButton} onPress={onHome}>
          <Text style={styles.orderText}>Xem thực đơn</Text>
        </Pressable>
      </View>
    );
  }

  let total = 0;
  for (let i = 0; i < cart.length; i++) {
    total = total + cart[i].price * cart[i].quantity;
  }

  function placeOrder() {
    const newOrder: Order = {
      id: Date.now(),
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
      })),
      total,
      status: 'Đang chuẩn bị',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    // Đơn hàng chỉ được tạo sau khi người dùng bấm Đặt suất ăn.
    setOrders((oldOrders) => [newOrder, ...oldOrders]);
    setCart([]);
    Alert.alert('Thành công', 'Đặt suất ăn thành công.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Giỏ hàng</Text>
          <Text style={styles.subtitle}>{cart.length} món ăn trong giỏ</Text>
        </View>
        <Pressable onPress={clearAll}>
          <Text style={styles.clear}>Xóa tất cả</Text>
        </Pressable>
      </View>

      {cart.map((item) => (
        <View style={styles.item} key={item.id}>
          <Image source={item.image} resizeMode="cover" style={styles.image} />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              <Pressable onPress={() => removeItem(item.id)}>
                <Text style={styles.delete}>🗑 Xóa</Text>
              </Pressable>
            </View>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.smallButton}
                onPress={() => changeQuantity(item.id, -1)}
              >
                <Text>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Pressable
                style={styles.smallButton}
                onPress={() => changeQuantity(item.id, 1)}
              >
                <Text>+</Text>
              </Pressable>
              <Text style={styles.subtotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng cộng</Text>
        <Text style={styles.total}>{formatPrice(total)}</Text>
      </View>
      <Pressable style={styles.orderButton} onPress={placeOrder}>
        <Text style={styles.orderText}>Đặt suất ăn</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#25282D' },
  subtitle: { color: '#858B94', marginTop: 5 },
  clear: { color: '#D85624', fontWeight: '700' },
  item: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 12,
  },
  image: { width: 76, height: 76, borderRadius: 11 },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700', fontSize: 16 },
  delete: { color: '#D85624', fontSize: 12 },
  price: { color: '#E86A33', marginTop: 5 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  smallButton: {
    width: 27,
    height: 27,
    borderRadius: 7,
    backgroundColor: '#FFF0E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: { width: 28, textAlign: 'center', fontWeight: '700' },
  subtotal: { marginLeft: 'auto', fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 18,
    marginTop: 12,
  },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  total: { fontSize: 20, fontWeight: '800', color: '#E86A33' },
  orderButton: {
    backgroundColor: '#E86A33',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 22,
  },
  orderText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: { fontSize: 58 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginTop: 14 },
  emptyText: { color: '#858B94', marginTop: 7 },
});
