# App Canteen

Ứng dụng căn tin trường học để sinh viên đặt món trước, nhân viên xử lý đơn và bán tại quầy, quản trị viên quản lý thực đơn, tài khoản và thống kê.

## Công nghệ

- Ứng dụng: Expo SDK 54, React 19, React Native 0.81, TypeScript.
- API: Node.js, Express 5.
- Cơ sở dữ liệu: MySQL 8.0.16 trở lên, kết nối qua `mysql2`.
- Giao diện hỗ trợ web và ứng dụng di động qua Expo.

## Yêu cầu

- Node.js và npm.
- MySQL 8.0.16 trở lên; tài khoản MySQL có quyền tạo bảng và áp dụng migration.
- Tạo database rỗng trước khi chạy migration:

```sql
CREATE DATABASE app_canteen CHARACTER SET utf8mb4;
```

## Cài đặt và chạy

### 1. Cấu hình backend

Trong thư mục `backend`, sao chép `backend/.env.example` thành `backend/.env`, sau đó điền thông tin kết nối MySQL. Không commit tệp `.env` hoặc mật khẩu thật.

Các biến cấu hình chính:

| Biến | Mặc định / mục đích |
|---|---|
| `DB_HOST`, `DB_PORT` | Máy chủ và cổng MySQL (`127.0.0.1`, `3306`) |
| `DB_USER`, `DB_PASSWORD` | Tài khoản MySQL |
| `DB_NAME` | Tên database (`app_canteen`) |
| `PORT` | Cổng API (`3000`) |
| `CANTEEN_OPEN`, `CANTEEN_CLOSE` | Giờ mở và đóng cửa (`07:00`, `18:00`) |
| `PICKUP_SLOT_MINUTES`, `PICKUP_LEAD_MINUTES` | Độ dài khung nhận và thời gian báo trước (phút) |
| `ADMIN_NAME`, `ADMIN_STUDENT_CODE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Thông tin admin, chỉ cần khi tạo tài khoản admin |

Cài dependencies, tạo/cập nhật schema rồi khởi chạy API:

```powershell
cd backend
npm install
npm run migrate
npm start
```

API mặc định chạy tại `http://localhost:3000`. Migration được lưu trong `backend/migrations` và có thể chạy lại an toàn để áp dụng các migration chưa thực hiện.

Để tạo tài khoản admin đầu tiên, điền đủ các biến `ADMIN_*` trong `backend/.env`, rồi chạy lệnh sau trong `backend`:

```powershell
npm run create-admin
```

Xóa các giá trị `ADMIN_*` khỏi môi trường sau khi tạo tài khoản. Người dùng khác có thể đăng ký trong ứng dụng; admin có thể đổi vai trò tài khoản thành nhân viên.

### 2. Chạy ứng dụng

Mở terminal mới tại thư mục gốc:

```powershell
npm install
npm run web
```

Expo cũng hỗ trợ các lệnh `npm start`, `npm run android` và `npm run ios`.

Khi chạy trên điện thoại, đặt địa chỉ máy chạy backend trước khi khởi động Expo. Thay địa chỉ IP bằng IPv4 của máy tính trong mạng LAN:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:3000"
npm start
```

Điện thoại và máy chủ cần truy cập được nhau qua mạng. Không dùng `localhost` làm địa chỉ backend trên điện thoại. Khi chạy web trên cùng máy, ứng dụng mặc định gọi API tại hostname của trang trên cổng `3000`.

## Chức năng

- **Sinh viên:** đăng ký/đăng nhập, cập nhật hồ sơ, tìm và xem món, quản lý giỏ, chọn giờ nhận, đặt món, xem lịch sử và hủy đơn đang chờ.
- **Nhân viên:** theo dõi đơn, cập nhật trạng thái, ghi nhận không đến nhận theo quy định, bán hàng tại quầy và xem lịch sử bán.
- **Quản trị viên:** quản lý món, giá, ảnh, tình trạng bán và tồn kho; quản lý tài khoản và vai trò; xem thống kê hoạt động.
- **Đơn hàng:** đặt trước và bán tại quầy dùng chung quy trình kiểm kho; thao tác tạo đơn có khóa chống gửi lặp. Hủy đơn hoàn kho theo trạng thái và quy tắc nghiệp vụ.

## Kiểm tra

Chạy lệnh từ thư mục gốc:

```powershell
npm run typecheck
npm test
```

Chạy kiểm tra backend từ `backend`:

```powershell
npm test
```

Bộ kiểm thử backend cần kết nối MySQL theo `backend/.env` và quyền `CREATE DATABASE`. Bộ kiểm thử tạo database riêng có tiền tố `canteen_test_`; không dùng database nghiệp vụ để chạy kiểm thử.

## Cấu trúc thư mục

```text
App.tsx                 Điểm vào và điều hướng ứng dụng
src/screens/            Các màn hình sinh viên, nhân viên và quản trị
src/components/         Thành phần giao diện dùng chung
src/api.ts              Cấu hình URL và giao tiếp với API
backend/server.js       Express API và xác thực
backend/canteen.js      Quy tắc nghiệp vụ đơn hàng
backend/migrations/     Các migration MySQL
backend/test/           Kiểm thử tích hợp API và migration
test/                   Kiểm thử frontend
assets/images/          Ảnh món ăn
```

## Lưu ý vận hành

- Sao lưu MySQL trước khi nâng cấp môi trường đang sử dụng. Nếu migration gặp lỗi, kiểm tra schema và thông báo lỗi trước khi tiếp tục.
- Đơn hàng và tồn kho được xử lý trong transaction; giá lấy từ database thay vì tin vào giá gửi từ ứng dụng.
- Không có mật khẩu admin mặc định. Không đưa `backend/.env`, khóa, mật khẩu hoặc dữ liệu cá nhân vào Git.
- Ảnh tải lên được lưu trong `backend/uploads` theo mặc định; thư mục này không được commit.
