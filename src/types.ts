import type { ImageSourcePropType } from 'react-native';

export type TenManHinh = 'dangNhap' | 'dangKy' | 'trangChu' | 'chiTiet' | 'gioHang' | 'caNhan';

export interface NguoiDung {
  hoTen: string;
  maSinhVien: string;
  email: string;
  matKhau: string;
}

export interface MonAn {
  ma: number;
  ten: string;
  gia: number;
  hinhAnh: ImageSourcePropType;
  moTa: string;
  conMon: boolean;
}

export interface MonTrongGioHang extends MonAn {
  soLuong: number;
}

export interface MonTrongDon {
  ma: number;
  ten: string;
  soLuong: number;
}

export interface DonHang {
  ma: number;
  cacMon: MonTrongDon[];
  tongTien: number;
  trangThai: string;
  ngayTao: string;
}
