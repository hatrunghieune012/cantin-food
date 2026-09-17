import type { MonAn } from '../types';

export const danhSachMonAn: MonAn[] = [
  { ma: 1, ten: 'Cơm gà', gia: 30000, hinhAnh: require('../../assets/images/com-ga.jpg'), moTa: 'Cơm gà chiên kèm rau và nước sốt', conMon: true },
  { ma: 2, ten: 'Cơm sườn', gia: 35000, hinhAnh: require('../../assets/images/com-suon.jpg'), moTa: 'Sườn nướng thơm ngon cùng cơm nóng', conMon: true },
  { ma: 3, ten: 'Mì xào bò', gia: 30000, hinhAnh: require('../../assets/images/mi-xao-bo.jpg'), moTa: 'Mì xào bò và rau củ tươi', conMon: true },
  { ma: 4, ten: 'Bún thịt nướng', gia: 30000, hinhAnh: require('../../assets/images/bun-thit-nuong.jpg'), moTa: 'Bún thịt nướng với rau sống', conMon: true },
  { ma: 5, ten: 'Pepsi', gia: 10000, hinhAnh: require('../../assets/images/pepsi.jpg'), moTa: 'Nước giải khát mát lạnh', conMon: true },
  { ma: 6, ten: 'Phở bò', gia: 40000, hinhAnh: require('../../assets/images/pho-bo.jpg'), moTa: 'Phở bò nước dùng thơm, ăn kèm rau tươi', conMon: true },
  { ma: 7, ten: 'Bánh mì thịt', gia: 20000, hinhAnh: require('../../assets/images/banh-mi.jpg'), moTa: 'Bánh mì giòn với thịt, rau và đồ chua', conMon: true },
];
export function dinhDangGia(gia: number): string { return `${gia.toLocaleString('vi-VN')}đ`; }
