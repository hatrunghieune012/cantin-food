import type { MonAn } from '../types';
import { apiUrl } from '../api';

const hinhAnhTheoMa = {
  'com-ga': require('../../assets/images/com-ga.jpg'),
  'com-suon': require('../../assets/images/com-suon.jpg'),
  'mi-xao-bo': require('../../assets/images/mi-xao-bo.jpg'),
  'bun-thit-nuong': require('../../assets/images/bun-thit-nuong.jpg'),
  pepsi: require('../../assets/images/pepsi.jpg'),
  'pho-bo': require('../../assets/images/pho-bo.jpg'),
  'banh-mi': require('../../assets/images/banh-mi.jpg'),
  'com-tam-suon-bi-cha': require('../../assets/images/com-tam-suon-bi-cha.jpg'),
  'com-ga-xoi-mo': require('../../assets/images/com-ga-xoi-mo.jpg'),
  'com-chien-duong-chau': require('../../assets/images/com-chien-duong-chau.jpg'),
  'com-suon-nuong': require('../../assets/images/com-suon-nuong.jpg'),
  'com-bo-luc-lac': require('../../assets/images/com-bo-luc-lac.jpg'),
  'com-ca-kho-to': require('../../assets/images/com-ca-kho-to.jpg'),
  'com-thit-kho-trung': require('../../assets/images/com-thit-kho-trung.jpg'),
  'com-ga-ro-ti': require('../../assets/images/com-ga-ro-ti.jpg'),
};

export type MaHinhAnh = keyof typeof hinhAnhTheoMa;
export const danhSachHinhAnh: { ma: MaHinhAnh; ten: string }[] = [
  { ma: 'com-ga', ten: 'Cơm gà' },
  { ma: 'com-suon', ten: 'Cơm sườn' },
  { ma: 'mi-xao-bo', ten: 'Mì xào' },
  { ma: 'bun-thit-nuong', ten: 'Bún' },
  { ma: 'pepsi', ten: 'Đồ uống' },
  { ma: 'pho-bo', ten: 'Phở' },
  { ma: 'banh-mi', ten: 'Bánh mì' },
  { ma: 'com-tam-suon-bi-cha', ten: 'Cơm tấm sườn bì chả' },
  { ma: 'com-ga-xoi-mo', ten: 'Cơm gà xối mỡ' },
  { ma: 'com-chien-duong-chau', ten: 'Cơm chiên Dương Châu' },
  { ma: 'com-suon-nuong', ten: 'Cơm sườn nướng' },
  { ma: 'com-bo-luc-lac', ten: 'Cơm bò lúc lắc' },
  { ma: 'com-ca-kho-to', ten: 'Cơm cá kho tộ' },
  { ma: 'com-thit-kho-trung', ten: 'Cơm thịt kho trứng' },
  { ma: 'com-ga-ro-ti', ten: 'Cơm gà rô ti' },
];

export function layHinhAnhMonAn(maHinhAnh: string) {
  if (maHinhAnh.startsWith('uploads/foods/')) return { uri: apiUrl(`/${maHinhAnh}`) };
  return hinhAnhTheoMa[maHinhAnh as MaHinhAnh] || hinhAnhTheoMa['com-ga'];
}

export const danhSachMonAn: MonAn[] = [
  { ma: 1, ten: 'Cơm gà', gia: 30000, hinhAnh: require('../../assets/images/com-ga.jpg'), moTa: 'Cơm gà chiên kèm rau và nước sốt', conMon: true, soLuongTon: 20, danhMuc: 'Cơm' },
  { ma: 2, ten: 'Cơm sườn', gia: 35000, hinhAnh: require('../../assets/images/com-suon.jpg'), moTa: 'Sườn nướng thơm ngon cùng cơm nóng', conMon: true, soLuongTon: 12, danhMuc: 'Cơm' },
  { ma: 3, ten: 'Mì xào bò', gia: 30000, hinhAnh: require('../../assets/images/mi-xao-bo.jpg'), moTa: 'Mì xào bò và rau củ tươi', conMon: false, soLuongTon: 0, danhMuc: 'Mì' },
  { ma: 4, ten: 'Bún thịt nướng', gia: 30000, hinhAnh: require('../../assets/images/bun-thit-nuong.jpg'), moTa: 'Bún thịt nướng với rau sống', conMon: true, soLuongTon: 3, danhMuc: 'Món khác' },
  { ma: 5, ten: 'Pepsi', gia: 10000, hinhAnh: require('../../assets/images/pepsi.jpg'), moTa: 'Nước giải khát mát lạnh', conMon: true, soLuongTon: 50, danhMuc: 'Đồ uống' },
  { ma: 6, ten: 'Phở bò', gia: 40000, hinhAnh: require('../../assets/images/pho-bo.jpg'), moTa: 'Phở bò nước dùng thơm, ăn kèm rau tươi', conMon: true, soLuongTon: 8, danhMuc: 'Món khác' },
  { ma: 7, ten: 'Bánh mì thịt', gia: 20000, hinhAnh: require('../../assets/images/banh-mi.jpg'), moTa: 'Bánh mì giòn với thịt, rau và đồ chua', conMon: true, soLuongTon: 4, danhMuc: 'Ăn vặt' },
];
export function dinhDangGia(gia: number): string { return `${gia.toLocaleString('vi-VN')}đ`; }
