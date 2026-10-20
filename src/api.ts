import { Platform } from 'react-native';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE = (configuredUrl || (Platform.OS === 'web' && typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : 'http://localhost:3000')).replace(/\/$/, '');
export const apiUrl = (path: string) => `${API_BASE}${path}`;

export async function request<T = any>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể xử lý yêu cầu.');
  return data;
}

export const requestKey = () => `order-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export const localTime = (value: string) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
export const statusNames: Record<string, string> = {
  pending: 'Chờ xác nhận', preparing: 'Đang chuẩn bị', ready: 'Sẵn sàng nhận',
  delivering: 'Đang giao (đơn cũ)', completed: 'Hoàn thành', cancelled: 'Đã hủy',
};

export interface ApiOrder {
  id: number;
  customer_name: string;
  phone: string | null;
  delivery_address: string | null;
  note: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  order_type: 'online' | 'counter' | 'legacy_delivery';
  pickup_at: string | null;
  payment_status: string;
  cancellation_reason: string | null;
  stock_restored: number;
  allowed_statuses: string[];
  items: { id: number; food_id: number; food_name: string; price: number; quantity: number }[];
}
