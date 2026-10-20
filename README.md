# App Canteen

Ứng dụng căn tin trường học: sinh viên đặt trước và nhận tại quầy; nhân viên xử lý đơn, bán trực tiếp bằng tiền mặt và cập nhật bàn; quản trị viên quản lý món, tài khoản và thống kê.

Stack giữ nguyên: Expo SDK 54, React 19, React Native 0.81, TypeScript, Node.js/Express 5, MySQL/mysql2. Không thêm thư viện.

## Chạy trên máy hiện tại

Migration `007_canteen_operations.sql` đã được áp dụng vào database cấu hình trong `backend/.env` trong lần triển khai này. Đối chiếu trước/sau xác nhận toàn bộ cột cũ của 2 tài khoản, 7 món, 1 đơn, 1 chi tiết đơn và 3 phiên đăng nhập không thay đổi.

Mở terminal backend:

```powershell
cd D:\app_canteen\backend
npm install
npm run migrate
npm start
```

Mở terminal frontend:

```powershell
cd D:\app_canteen
npm install
npm run web
```

Nếu backend cũ đang chạy, dừng bằng Ctrl+C tại terminal đó rồi chạy lại. Frontend và backend mới phải được chạy cùng nhau: API tạo đơn mới yêu cầu giờ nhận và mã chống gửi trùng, không còn nhận đơn giao hàng mới.

Chạy điện thoại:

```powershell
cd D:\app_canteen
$env:EXPO_PUBLIC_API_URL="http://IP_LAN_MAY_BACKEND:3000"
npm start
```

Thay `IP_LAN_MAY_BACKEND` bằng IP thật; điện thoại và máy backend phải kết nối được với nhau. Không dùng `localhost` trên điện thoại để gọi máy tính. Cũng có thể đặt `EXPO_PUBLIC_API_URL` trong `.env` ở thư mục gốc và khởi động lại Expo.

## Cài cho môi trường MySQL mới

1. Tạo database rỗng bằng tài khoản có quyền phù hợp:

   ```sql
   CREATE DATABASE app_canteen CHARACTER SET utf8mb4;
   ```

2. Sao chép `backend/.env.example` thành `backend/.env`, điền kết nối thật. Không ghi đè `.env` đã có.
3. Chạy `npm install` và `npm run migrate` trong `backend`.
4. Điền các biến `ADMIN_*` trong `.env` cục bộ rồi chạy `npm run create-admin`. Không có mật khẩu quản trị mặc định.
5. Đăng ký tài khoản sinh viên qua ứng dụng. Quản trị viên vào **Người dùng → Phân quyền / vô hiệu hóa** để đổi tài khoản phù hợp thành nhân viên.

`000_create_accounts.sql` bổ sung bảng gốc còn thiếu. Runner áp dụng 000–007 cho database mới. Migration 005 có 7 món ban đầu từ mã nguồn cũ; chỉnh giá và tồn kho trước khi vận hành thật.

Đối với database cũ, runner kiểm tra các cột/bảng để ghi nhận những migration 000–006 đã có, không chạy lại dữ liệu mẫu. `schema_migrations` lưu lịch sử; chạy lại `npm run migrate` không áp dụng lại migration đã hoàn tất. Runner dùng khóa MySQL để ngăn hai tiến trình migration chạy đồng thời.

MySQL DDL tự commit. Nếu migration lỗi giữa chừng, dừng triển khai và đối chiếu schema với câu lệnh lỗi; không xóa bảng, không tự đánh dấu migration hoàn tất và không chạy lại mù quáng. Nên sao lưu bằng công cụ MySQL trước khi nâng cấp ở môi trường vận hành. Các migration dùng CHECK constraint, cần MySQL 8.0.16 trở lên để thực thi ràng buộc này.

## Chức năng

### Sinh viên

- Đăng ký, đăng nhập, đăng xuất; sửa họ tên và số điện thoại.
- Tìm/lọc món, xem chi tiết, quản lý giỏ.
- Chọn khung giờ nhận trong 3 ngày, thêm ghi chú, đặt trước, nhận mã đơn.
- Xem lịch sử và trạng thái đơn; tự hủy khi đơn còn chờ xác nhận.
- Xem bàn và thời điểm cập nhật; tải lại mỗi 30 giây hoặc bấm Làm mới.

### Nhân viên

- Xem đơn, chuyển trạng thái hợp lệ và xác nhận thu tiền mặt khi giao món.
- Ghi nhận khách không đến nhận sau giờ hẹn ít nhất 30 phút.
- Tìm món, chọn số lượng, xác nhận tiền mặt và hoàn thành đơn tại quầy; khách không cần tài khoản.
- Xem lịch sử bán hàng tại quầy.
- Thêm/sửa/ngừng sử dụng bàn, cập nhật trạng thái thủ công.

### Quản trị viên

- Các chức năng vận hành của nhân viên.
- Thêm/sửa món, giá, mô tả, danh mục, ảnh có sẵn; ngừng bán hoặc bán lại.
- Tìm kiếm/lọc món; điều chỉnh tồn kho tăng/giảm bằng API atomic.
- Tìm/lọc tài khoản; xem chi tiết, sửa thông tin, vô hiệu hóa/kích hoạt, đổi vai trò user/staff.
- Không tự sửa quyền của chính mình; không đổi quyền/vô hiệu hóa tài khoản admin qua giao diện này.
- Xem tổng quan, món bán nhiều theo đơn hoàn thành, số đơn và tiền mặt thu hôm nay.

## Quy tắc đơn hàng và tồn kho

Đơn mới:

```text
online: pending → preparing → ready → completed
counter: completed ngay sau khi nhân viên xác nhận đã nhận tiền mặt
```

- Online chưa thanh toán cho đến khi giao món và xác nhận tiền mặt.
- Hủy `pending`: hoàn kho trong cùng transaction với đổi trạng thái.
- Hủy `preparing`: phải nhập lý do, không hoàn món đã chuẩn bị vào kho.
- Hủy `ready`: chỉ cho `no_show` sau giờ hẹn ít nhất 30 phút; không hoàn kho.
- Sinh viên chỉ hủy đơn online của mình ở `pending`.
- `completed` và `cancelled` không thể mở lại.
- Gửi lại đúng trạng thái hiện tại không trừ/hoàn kho lần nữa.
- Không tự hủy hàng loạt; nhân viên xác nhận trường hợp không đến nhận.

Tạo đơn khóa từng dòng món bằng `SELECT ... FOR UPDATE`, theo thứ tự ID, rồi trừ kho và lưu đơn/chi tiết trong transaction. Cả online và counter dùng chung xử lý. Số lượng trùng món trong request được gộp. Giá lấy từ MySQL, không tin giá do client gửi.

Mỗi request tạo đơn có `requestKey`, kết hợp ID người thao tác và UNIQUE key trong MySQL để chống gửi trùng. Dùng lại cùng key với nội dung khác bị từ chối. Bán tại quầy phải gửi tổng tiền đã xác nhận; nếu giá đã đổi, transaction bị rollback và nhân viên cần làm mới giá, xác nhận lại tiền.

Đơn trước migration được đánh dấu `legacy_delivery`, giữ nguyên địa chỉ và trạng thái `delivering`, không đổi thành `ready`. Vẫn có thể xử lý tiếp theo luồng giao cũ. Thanh toán đơn cũ là `unknown`, không mặc định đã thu tiền và không đưa vào doanh thu tiền mặt mới. Đơn đã hủy cũ không tự động hoàn kho.

Giờ nhận/thu tiền ghi trong DATETIME theo UTC+07:00. Connection MySQL và mysql2 cùng dùng UTC+07:00; API trả ISO timestamp và frontend hiển thị giờ Việt Nam. Giờ mở/đóng cửa và độ dài khung giờ cấu hình qua `CANTEEN_OPEN`, `CANTEEN_CLOSE`, `PICKUP_SLOT_MINUTES`, `PICKUP_LEAD_MINUTES`. Hiện hỗ trợ một khoảng mở cửa mỗi ngày, chưa có lịch nghỉ lễ.

## Database bổ sung

Migration 007:

- `accounts`: thêm vai trò `staff`, cột `is_active`.
- `foods`: `is_active`, ràng buộc giá dương và tồn kho không âm.
- `orders`: cho phép khách tại quầy không có `user_id`, địa chỉ/điện thoại nullable; thêm `order_type`, `pickup_at`, `payment_method`, `payment_status`, `paid_at`, `handled_by`, `cancellation_reason`, `stock_restored`, `request_key`, `request_hash`; chỉ mục trạng thái/giờ nhận/thanh toán và khóa ngoại nhân viên.
- `canteen_tables`: mã bàn duy nhất, khu vực, số ghế, trạng thái, cờ hoạt động, thời điểm và người cập nhật.
- `schema_migrations`: do migration runner quản lý.

Không xóa tài khoản, đơn hàng hay món cũ. Route DELETE tài khoản trả 405, hướng dẫn vô hiệu hóa. Ngừng bán món không làm thay đổi tên/giá đã chụp trong `order_items`.

## Các API chính

| Nhóm | API |
|---|---|
| Tài khoản | `POST /api/register`, `/api/login`, `/api/logout`; `GET /api/me`; `PUT /api/users/me` |
| Món công khai | `GET /api/foods` (chỉ món đang bán) |
| Món quản trị | `GET/POST /api/admin/foods`, `PUT /api/admin/foods/:id`, `PUT /api/admin/foods/:id/stock` với `{delta}` |
| Giờ nhận | `GET /api/pickup-slots` |
| Đơn | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id` |
| Trạng thái | `PUT /api/orders/:id/status` cho đơn của sinh viên; `/api/staff/orders/:id/status` cho nhân viên/admin; route admin cũ được giữ |
| Vận hành | `GET /api/staff/orders`; `GET /api/admin/dashboard` |
| Tài khoản quản trị | `GET/POST /api/admin/users`, `GET/PUT /api/admin/users/:id`, `PUT /api/admin/users/:id/access` |
| Bàn | `GET /api/tables`; `POST /api/tables`, `PUT /api/tables/:id` dành cho staff/admin |

Bearer token giữ cơ chế hiện có. Mỗi request xác thực lại quyền và trạng thái hoạt động từ MySQL. Thay đổi quyền/vô hiệu hóa xóa các phiên cũ. Không dùng JWT.

## Kiểm thử

```powershell
cd D:\app_canteen
npm run typecheck
npx expo config --type public
npx expo export --platform web --output-dir dist

cd D:\app_canteen\backend
node --check server.js
node --check canteen.js
node --check scripts/migrate.js
npm test
```

`npm test` dùng kết nối MySQL trong `.env` để **tạo database riêng tên `canteen_test_*`**, không chạy nghiệp vụ thử lên DB_NAME hiện tại. Cần quyền CREATE DATABASE. Database kiểm thử được giữ lại, tên được in ra; bộ test không tự DROP database.

Đã chạy thành công các kiểm thử tích hợp HTTP/MySQL: phân quyền, giá do backend quyết định, giờ nhận, chống gửi trùng, cạnh tranh tồn kho online/counter, rollback khi giá tiền mặt thay đổi, hủy/hoàn kho đúng một lần, trạng thái hợp lệ, không đến nhận, bàn, ngừng bán món, tài khoản vô hiệu hóa, bảo toàn đơn cũ, migration mới và chạy migration lặp lại.

Đã kiểm tra TypeScript, cú pháp backend, cấu hình Expo và xuất bundle web. **Chưa kiểm thử thao tác giao diện trong trình duyệt hoặc trên Android/iOS:** công cụ trình duyệt không có phiên khả dụng. Không coi typecheck/export là bằng chứng mọi thao tác UI đã chạy thành công.

## Giới hạn và việc tiếp theo

- Chưa có tải ảnh lên, thanh toán trực tuyến, hóa đơn in hoặc hoàn tiền.
- Bàn cập nhật thủ công; trạng thái chỉ phản ánh lần nhân viên cập nhật, không giữ chỗ.
- Giỏ và lựa chọn chưa lưu bền vững khi đóng ứng dụng; chống gửi trùng dựa trên request key của lượt thao tác hiện tại.
- Chưa có phân trang dữ liệu lớn hoặc sổ nhật ký đầy đủ cho mọi thay đổi kho.
- Chưa có lịch mở cửa riêng theo từng ngày/ngày nghỉ.
- Nên kiểm thử UI trên trình duyệt và điện thoại, nhất là chọn giờ, xác nhận tiền mặt, form sửa món và điều hướng trên màn hình nhỏ.
- `src/screens/DangKy.tsx` là màn hình thử cũ không được App.tsx sử dụng; luồng thực dùng `RegisterScreen.tsx`.

## Mã nguồn thay đổi chính

- `backend/canteen.js`: nghiệp vụ mới, transaction, phân quyền vận hành.
- `backend/server.js`, `backend/db.js`: tích hợp routes, xác thực tài khoản hoạt động, thống kê, múi giờ.
- `backend/migrations/000_create_accounts.sql`, `007_canteen_operations.sql`, `backend/scripts/migrate.js`.
- `backend/test/integration.test.js`, `backend/test/upgrade.test.js`.
- `src/api.ts`: URL cấu hình tập trung, request helper, kiểu đơn và định dạng giờ.
- `src/components/OperationsUI.tsx`, `OrdersPanel.tsx`, `AccountsPanel.tsx`.
- `src/screens/StaffScreen.tsx`, `CounterScreen.tsx`, `TablesScreen.tsx`.
- `App.tsx`, `src/types.ts`, các màn hình Admin/Cart/Profile/Login/Register/Home/Menu/FoodDetail.
- `.env.example`, `backend/.env.example`, `backend/package.json`, tài liệu này.
