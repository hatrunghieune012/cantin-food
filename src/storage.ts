import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE } from './api';
import type { NguoiDung } from './types';

const prefix = `canteen:${API_BASE}:`;
let writes = Promise.resolve();
// Serialize writes so rapid cart changes cannot finish out of order.
export function saveLocal(key: string, value: unknown): Promise<void> {
  const text = JSON.stringify(value);
  const write = writes.catch(() => undefined).then(async () => {
    if (Platform.OS === 'web') window.localStorage.setItem(prefix + key, text);
    else await AsyncStorage.setItem(prefix + key, text);
  });
  writes = write;
  return write;
}
export async function readLocal<T>(key: string): Promise<T | null> {
  await writes.catch(() => undefined);
  const text = Platform.OS === 'web' ? window.localStorage.getItem(prefix + key) : await AsyncStorage.getItem(prefix + key);
  return text ? JSON.parse(text) as T : null;
}
const sessionKey = 'smart-canteen-session';
export async function saveSession(user: NguoiDung | null) {
  const value = JSON.stringify({ server: API_BASE, user });
  if (Platform.OS === 'web') {
    window.sessionStorage.setItem(sessionKey, value);
    window.sessionStorage.removeItem('smart-canteen-user');
  } else await SecureStore.setItemAsync(sessionKey, value);
}
export async function readSession(): Promise<NguoiDung | null> {
  const text = Platform.OS === 'web' ? window.sessionStorage.getItem(sessionKey) : await SecureStore.getItemAsync(sessionKey);
  if (!text) return null;
  const data = JSON.parse(text);
  const user = data.server === API_BASE ? data.user : null;
  return user?.id && user?.token && ['user', 'staff', 'admin'].includes(user.role) ? user : null;
}
