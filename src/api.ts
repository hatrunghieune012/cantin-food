import { Platform } from 'react-native';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE = (configuredUrl || (Platform.OS === 'web' && typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : 'http://localhost:3000')).replace(/\/$/, '');
export const apiUrl = (path: string) => `${API_BASE}${path}`;

export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}
const expired = new Set<(token: string) => void>();
export function onUnauthorized(listener: (token: string) => void) { expired.add(listener); return () => { expired.delete(listener); }; }
const reads = new Map<string, Promise<Pick<Response, 'status' | 'ok' | 'json'>>>();
export function apiFetch(url: string, options: RequestInit = {}): Promise<Pick<Response, 'status' | 'ok' | 'json'>> {
  const headers = new Headers(options.headers);
  const token = (headers.get('Authorization') || '').replace(/^Bearer /, '');
  const key = `${url}:${token}`;
  const dedupe = (!options.method || options.method === 'GET') && !options.signal;
  if (dedupe && reads.has(key)) return reads.get(key)!;
  const run = async () => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort);
    if (options.signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 15000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (response.status === 401 && token) expired.forEach(listener => listener(token));
      const body = await response.text();
      return { ok: response.ok, status: response.status, json: async () => {
        try { return JSON.parse(body); } catch { throw new ApiError('Phản hồi máy chủ không hợp lệ. Vui lòng thử lại.', response.status >= 500 ? response.status : 0); }
      } };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(controller.signal.aborted ? 'Yêu cầu quá thời gian hoặc đã hủy. Vui lòng thử lại.' : 'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.');
    } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
  };
  const promise = run().finally(() => { if (dedupe) reads.delete(key); });
  if (dedupe) reads.set(key, promise);
  return promise;
}

export async function request<T = any>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(apiUrl(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.message || 'Không thể xử lý yêu cầu.', response.status);
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
  cancelled_at?: string | null;
  handled_by?: number | null;
  stock_restored: number;
  allowed_statuses: string[];
  is_terminal: boolean;
  items: { id: number; food_id: number; food_name: string; price: number; quantity: number }[];
}
