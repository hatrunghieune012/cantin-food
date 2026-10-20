import type { ImageSourcePropType } from 'react-native';

export type TenManHinh = 'dangNhap' | 'dangKy' | 'trangChu' | 'thucDon' | 'chiTiet' | 'gioHang' | 'caNhan' | 'admin' | 'staff' | 'choNgoi';

export interface NguoiDung {
  id: number;
  hoTen: string;
  maSinhVien: string;
  email: string;
  phone: string;
  defaultAddress: string;
  role: 'user' | 'staff' | 'admin';
  token: string;
}

export interface MonAn {
  dangBan?: boolean;
  maHinhAnh?: string;
  ma: number;
  ten: string;
  gia: number;
  hinhAnh: ImageSourcePropType;
  moTa: string;
  conMon: boolean;
  soLuongTon: number;
  danhMuc: 'Cơm' | 'Mì' | 'Đồ uống' | 'Ăn vặt' | 'Món khác';
}

export interface MonTrongGioHang extends MonAn {
  soLuong: number;
}

export interface MonTrongDon {
  ma: number;
  ten: string;
  gia: number;
  soLuong: number;
}

export interface DonHang {
  ma: number;
  cacMon: MonTrongDon[];
  tongTien: number;
  phone: string;
  diaChiGiaoHang: string;
  ghiChu: string;
  trangThai: string;
  ngayTao: string;
}
