import type { Food } from '../types';

export const foods: Food[] = [
  { id: 1, name: 'Cơm gà', price: 30000, image: require('../../assets/images/com-ga.jpg'), description: 'Cơm gà chiên kèm rau và nước sốt', available: true },
  { id: 2, name: 'Cơm sườn', price: 35000, image: require('../../assets/images/com-suon.jpg'), description: 'Sườn nướng thơm ngon cùng cơm nóng', available: true },
  { id: 3, name: 'Mì xào bò', price: 30000, image: require('../../assets/images/mi-xao-bo.jpg'), description: 'Mì xào bò và rau củ tươi', available: true },
  { id: 4, name: 'Bún thịt nướng', price: 30000, image: require('../../assets/images/bun-thit-nuong.jpg'), description: 'Bún thịt nướng với rau sống', available: true },
  { id: 5, name: 'Pepsi', price: 10000, image: require('../../assets/images/pepsi.jpg'), description: 'Nước giải khát mát lạnh', available: true },
  { id: 6, name: 'Phở bò', price: 40000, image: require('../../assets/images/pho-bo.jpg'), description: 'Phở bò nước dùng thơm, ăn kèm rau tươi', available: true },
  { id: 7, name: 'Bánh mì thịt', price: 20000, image: require('../../assets/images/banh-mi.jpg'), description: 'Bánh mì giòn với thịt, rau và đồ chua', available: true },
];
export function formatPrice(price: number): string { return `${price.toLocaleString('vi-VN')}đ`; }
