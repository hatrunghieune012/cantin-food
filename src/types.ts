import type { ImageSourcePropType } from 'react-native';

export type ScreenName = 'login' | 'register' | 'home' | 'detail' | 'cart' | 'profile';

export interface User {
  fullName: string;
  studentId: string;
  email: string;
  password: string;
}

export interface Food {
  id: number;
  name: string;
  price: number;
  image: ImageSourcePropType;
  description: string;
  available: boolean;
}

export interface CartItem extends Food {
  quantity: number;
}

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
}

export interface Order {
  id: number;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}
