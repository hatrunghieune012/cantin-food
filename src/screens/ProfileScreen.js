import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '../data/foods';

export default function ProfileScreen({ currentUser, orders, onLogout }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profile}>
        <Image
          source={require('../../assets/images/cantin.jpg')}
          style={styles.avatar}
        />
        <Text style={styles.name}>{currentUser?.fullName || 'Sinh viên'}</Text>
        <Text style={styles.mssv}>
          MSSV: {currentUser?.studentId || 'Chưa cập nhật'}
        </Text>
        <Text style={styles.email}>
          {currentUser?.email || 'Chưa cập nhật'}
        </Text>
      </View>

      <Text style={styles.heading}>Đơn hàng gần đây</Text>

      {orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
          <Text style={styles.emptyText}>
            Đơn hàng sẽ xuất hiện ở đây sau khi bạn đặt món.
          </Text>
        </View>
      ) : (
        orders.map((order, index) => (
          <View style={styles.order} key={order.id}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>
                Đơn #{String(orders.length - index).padStart(3, '0')}
              </Text>
              <Text style={styles.date}>{order.createdAt}</Text>
            </View>
            {order.items.map((item) => (
              <Text style={styles.itemText} key={item.id}>
                {item.name} x{item.quantity}
              </Text>
            ))}
            <Text style={styles.total}>Tổng tiền: {formatPrice(order.total)}</Text>
            <Text style={styles.status}>Trạng thái: {order.status}</Text>
          </View>
        ))
      )}

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  profile: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  mssv: { color: '#656C76', marginTop: 5 },
  email: { color: '#858B94', marginTop: 4 },
  heading: { fontSize: 20, fontWeight: '800', marginTop: 26, marginBottom: 12 },
  emptyOrders: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
  },
  emptyIcon: { fontSize: 38 },
  emptyTitle: { fontWeight: '800', fontSize: 17, marginTop: 10 },
  emptyText: { color: '#858B94', textAlign: 'center', marginTop: 7 },
  order: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: { fontWeight: '800' },
  date: { color: '#858B94', fontSize: 12 },
  itemText: { marginBottom: 4, color: '#454A52' },
  total: { fontWeight: '700', marginTop: 7 },
  status: { color: '#E86A33', marginTop: 7 },
  logout: {
    borderWidth: 1,
    borderColor: '#E86A33',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: { color: '#D85624', fontWeight: '700' },
});
