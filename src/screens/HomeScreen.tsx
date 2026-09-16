import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import FoodCard from '../components/FoodCard';
import { foods } from '../data/foods';
import type { Food, User } from '../types';

interface HomeScreenProps {
  currentUser: User | null;
  onSelectFood: (food: Food) => void;
}

export default function HomeScreen({ currentUser, onSelectFood }: HomeScreenProps) {
  const name = currentUser ? currentUser.fullName : 'Sinh viên';
  return <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.header}><View><Text style={styles.small}>Thứ hai, 15 tháng 9</Text><Text style={styles.greeting}>Xin chào, {name} 👋</Text></View><Text style={styles.avatar}>SV</Text></View>
    <View style={styles.banner}><Image source={require('../../assets/images/cantin.jpg')} style={styles.bannerImage} /><View style={styles.bannerText}><Text style={styles.bannerTitle}>Bữa trưa ngon miệng</Text><Text style={styles.bannerSubtitle}>Nạp năng lượng cho ngày học mới 🍱</Text></View></View>
    <View style={styles.titleRow}><Text style={styles.heading}>Hôm nay ăn gì?</Text><Text style={styles.bowl}>🍜</Text></View><Text style={styles.subheading}>Món ngon đang chờ bạn</Text>
    <View style={styles.chips}><Text style={styles.chip}>🍚 Cơm</Text><Text style={styles.chip}>🍜 Mì & bún</Text><Text style={styles.chip}>🥤 Nước</Text></View>
    {foods.map((food) => <FoodCard key={food.id} food={food} onPress={() => onSelectFood(food)} />)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 30 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, small: { color: '#8A9099', fontSize: 12 }, greeting: { fontSize: 20, fontWeight: '700', marginTop: 5, color: '#25282D' }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFE0D1', color: '#D85624', textAlign: 'center', paddingTop: 12, fontWeight: '700' }, banner: { height: 125, borderRadius: 18, overflow: 'hidden', marginBottom: 24, backgroundColor: '#E86A33' }, bannerImage: { width: '100%', height: '100%', opacity: 0.42 }, bannerText: { position: 'absolute', left: 18, top: 25 }, bannerTitle: { color: '#FFF', fontSize: 21, fontWeight: '800' }, bannerSubtitle: { color: '#FFF', marginTop: 7, fontSize: 13 }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heading: { fontSize: 28, fontWeight: '800', color: '#25282D' }, bowl: { fontSize: 30 }, subheading: { color: '#858B94', marginTop: 5, marginBottom: 12 }, chips: { flexDirection: 'row', marginBottom: 16 }, chip: { backgroundColor: '#FFF0E9', color: '#D85624', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, fontSize: 12, fontWeight: '700' }
});
