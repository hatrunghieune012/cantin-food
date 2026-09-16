import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import FoodDetailScreen from './src/screens/FoodDetailScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import type { CartItem, Food, Order, ScreenName, User } from './src/types';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('login');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  if (screen === 'login') return <><StatusBar style="dark" /><LoginScreen users={users} onLogin={(account) => { setCurrentUser(account); setScreen('home'); }} onRegister={() => setScreen('register')} /></>;
  if (screen === 'register') return <><StatusBar style="dark" /><RegisterScreen users={users} setUsers={setUsers} onBack={() => setScreen('login')} /></>;
  function renderScreen() {
    if (screen === 'home') return <HomeScreen currentUser={currentUser} onSelectFood={(food) => { setSelectedFood(food); setScreen('detail'); }} />;
    if (screen === 'detail') return <FoodDetailScreen food={selectedFood} cart={cart} setCart={setCart} onBack={() => setScreen('home')} onCart={() => setScreen('cart')} />;
    if (screen === 'cart') return <CartScreen cart={cart} setCart={setCart} setOrders={setOrders} onHome={() => setScreen('home')} />;
    return <ProfileScreen currentUser={currentUser} orders={orders} onLogout={() => { setCurrentUser(null); setCart([]); setOrders([]); setScreen('login'); }} />;
  }
  return <View style={styles.app}><StatusBar style="dark" />{renderScreen()}<View style={styles.menu}>
    <MenuButton label={'⌂\nTrang chủ'} active={screen === 'home' || screen === 'detail'} onPress={() => setScreen('home')} />
    <MenuButton label={'🛒\nGiỏ hàng'} active={screen === 'cart'} onPress={() => setScreen('cart')} />
    <MenuButton label={'♙\nCá nhân'} active={screen === 'profile'} onPress={() => setScreen('profile')} />
  </View></View>;
}
interface MenuButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function MenuButton({ label, active, onPress }: MenuButtonProps) { return <Pressable style={styles.menuButton} onPress={onPress}><Text style={[styles.menuText, active && styles.active]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ app: { flex: 1, backgroundColor: '#F7F8FA' }, menu: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 10 }, menuButton: { flex: 1, alignItems: 'center' }, menuText: { color: '#8A9099', fontSize: 12, lineHeight: 20, textAlign: 'center' }, active: { color: '#E86A33', fontWeight: '700' } });
