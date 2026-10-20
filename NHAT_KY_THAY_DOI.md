# Nhật ký thay đổi dự án Smart Canteen

Tài liệu này ghi lại các công việc đã thực hiện cho chức năng đăng ký và đăng nhập tài khoản bằng React Native, Expo, Node.js, Express và MySQL.

## 1. Kiểm tra dự án ban đầu

- Xác định project React Native + Expo nằm tại thư mục `D:\cantin`.
- Màn hình đăng ký đang được sử dụng là `src/screens/RegisterScreen.tsx`.
- Màn hình đăng nhập là `src/screens/LoginScreen.tsx`.
- Backend nằm trong thư mục `backend`.
- Backend ban đầu chỉ có API CRUD món ăn lưu trong bộ nhớ, chưa kết nối MySQL.
- Form đăng ký đã có các trường:
  - Họ và tên
  - Mã sinh viên
  - Email
  - Mật khẩu
  - Xác nhận mật khẩu

## 2. Xây dựng backend kết nối MySQL

Đã cài và sử dụng các thư viện:

- `express`
- `mysql2`
- `cors`
- `dotenv`

Các file backend chính:

- `backend/server.js`: định nghĩa API đăng ký, đăng nhập và khởi động server.
- `backend/db.js`: tạo pool kết nối MySQL bằng `mysql2/promise`.
- `backend/.env`: chứa thông tin kết nối MySQL ở máy cá nhân.
- `backend/.gitignore`: không cho phép đưa `.env` và `node_modules` mới lên Git.

Cấu hình `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=hieu
DB_PASSWORD=mat_khau_mysql
DB_NAME=smart_canteen
PORT=3000
```

Mật khẩu thật không được ghi vào tài liệu hoặc đẩy lên GitHub.

Khi backend khởi động, chương trình kiểm tra kết nối MySQL trước. Nếu thành công, server lắng nghe tại:

```text
http://localhost:3000
```

## 3. Chức năng đăng ký

Đã tạo API:

```text
POST /api/register
```

React Native gửi JSON:

```json
{
  "full_name": "Nguyen Van A",
  "student_code": "23103047",
  "email": "test@gmail.com",
  "password": "123456"
}
```

Backend thực hiện:

- Kiểm tra họ tên, MSSV, email và mật khẩu không được trống.
- Kiểm tra MSSV đã tồn tại hay chưa.
- Kiểm tra email đã tồn tại hay chưa.
- Dùng parameterized query với dấu `?` để không nối trực tiếp dữ liệu người dùng vào SQL.
- Lưu tài khoản vào bảng `accounts`.

Câu SQL đăng ký:

```sql
INSERT INTO accounts
(full_name, student_code, email, password)
VALUES (?, ?, ?, ?)
```

Thứ tự dữ liệu truyền vào:

```text
[fullName, studentCode, normalizedEmail, password]
```

Nếu đăng ký thành công, API trả:

```json
{
  "message": "Đăng ký thành công"
}
```

Nếu MSSV hoặc email bị trùng, API trả mã HTTP `409` cùng thông báo phù hợp.

### Thay đổi tại màn hình đăng ký

- Giữ nguyên giao diện và năm trường nhập liệu đã có.
- Sử dụng lại state `hoTen` để lưu họ và tên.
- Kiểm tra mật khẩu và xác nhận mật khẩu giống nhau.
- Không gửi xác nhận mật khẩu lên backend.
- Dùng `fetch()` gửi dữ liệu tới `/api/register`.
- Hiển thị thông báo thành công hoặc lỗi từ backend.
- Sau khi đăng ký thành công, chờ một giây rồi quay lại màn hình đăng nhập.

Địa chỉ API:

- Expo Web: `http://localhost:3000/api/register`
- Điện thoại thật: `http://10.21.61.245:3000/api/register`

Nếu IP Wi-Fi của máy tính thay đổi, cần cập nhật IP trong `src/screens/RegisterScreen.tsx`.

## 4. Chức năng đăng nhập

Đã tạo API:

```text
POST /api/login
```

React Native gửi JSON:

```json
{
  "student_code": "23103047",
  "password": "123456"
}
```

Backend dùng câu truy vấn có tham số:

```sql
SELECT id, full_name, student_code, email
FROM accounts
WHERE student_code = ? AND password = ?
```

Nếu tài khoản đúng, API trả thông tin người dùng nhưng không trả mật khẩu:

```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": 1,
    "full_name": "Nguyen Van A",
    "student_code": "23103047",
    "email": "test@gmail.com"
  }
}
```

Nếu sai MSSV hoặc mật khẩu, API trả HTTP `401`:

```json
{
  "message": "Mã sinh viên hoặc mật khẩu không đúng"
}
```

### Thay đổi tại màn hình đăng nhập

- Giữ nguyên giao diện MSSV và mật khẩu.
- Không còn kiểm tra tài khoản trong mảng tạm của React Native.
- Dùng `fetch()` gọi `/api/login`.
- Khi đăng nhập đúng, lưu người dùng hiện tại và chuyển đến trang chủ.
- Khi đăng nhập sai hoặc không kết nối được server, hiển thị thông báo lỗi.

Địa chỉ API:

- Expo Web: `http://localhost:3000/api/login`
- Điện thoại thật: `http://10.21.61.245:3000/api/login`

## 5. Các file mã nguồn đã thay đổi hoặc tạo

- `App.tsx`
- `src/types.ts`
- `src/screens/RegisterScreen.tsx`
- `src/screens/LoginScreen.tsx`
- `backend/server.js`
- `backend/db.js`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/.gitignore`
- `backend/.env` chỉ tồn tại cục bộ và không được commit.

## 6. Kiểm thử đã thực hiện

- Kiểm tra cú pháp `backend/server.js` và `backend/db.js` bằng Node.js.
- Chạy `npm run typecheck`, không có lỗi TypeScript.
- Kết nối MySQL thành công.
- Kiểm tra đăng ký thành công và xác nhận dữ liệu xuất hiện trong bảng `accounts`.
- Kiểm tra dữ liệu đăng ký bị thiếu trả HTTP `400`.
- Kiểm tra MSSV hoặc email trùng trả HTTP `409`.
- Kiểm tra đăng nhập đúng trả HTTP `200`.
- Kiểm tra sai mật khẩu trả HTTP `401`.
- Kiểm tra backend không trả mật khẩu trong response đăng nhập.
- Kiểm tra Expo Web phục vụ trang thành công tại `http://localhost:8081`.

## 7. Cách chạy dự án

### Terminal 1: chạy backend

```powershell
cd D:\cantin\backend
npm install
npm start
```

Kết quả mong đợi:

```text
Kết nối MySQL thành công
Server đang chạy tại http://localhost:3000
```

### Terminal 2: chạy Expo

```powershell
cd D:\cantin
npm install
npm start
```

Sau đó:

- Nhấn `w` để chạy trên web.
- Nhấn `a` để chạy Android Emulator.
- Quét QR bằng Expo Go để chạy trên điện thoại thật.

Có thể chạy web trực tiếp bằng:

```powershell
npm run web
```

## 8. Cách thành viên trong nhóm cập nhật code

Nếu đã clone project trước đó:

```powershell
git pull origin main
npm install
cd backend
npm install
```

Mỗi thành viên phải tự tạo `backend/.env` và nhập cấu hình MySQL của máy mình.

## 9. GitHub

Code đã được đẩy lên:

```text
https://github.com/hatrunghieune012/cantin-food
```

Nhánh:

```text
main
```

Commit chức năng đăng ký và đăng nhập:

```text
65c4aecb Add MySQL account registration and login
```

## 10. Giải thích luồng dữ liệu

Luồng đăng ký:

```text
TextInput Họ tên
→ state hoTen
→ fetch()
→ JSON full_name
→ Express đọc req.body
→ mysql2 chạy INSERT INTO accounts
→ dữ liệu được lưu vào cột full_name trong MySQL
```

Luồng đăng nhập:

```text
TextInput MSSV và mật khẩu
→ state React Native
→ fetch()
→ POST /api/login
→ Express đọc req.body
→ mysql2 tìm tài khoản trong accounts
→ backend trả JSON
→ React Native chuyển đến trang chủ
```

## 11. Lưu ý bảo mật

Đã nâng cấp chức năng đăng ký và đăng nhập để không còn lưu hoặc so sánh mật khẩu dạng văn bản thuần.

### Các file đã thay đổi

- `backend/server.js`: hash mật khẩu khi đăng ký, kiểm tra hash khi đăng nhập và loại bỏ trường mật khẩu khỏi response.
- `backend/package.json`: thêm thư viện `bcrypt`.
- `backend/package-lock.json`: cập nhật thông tin dependency sau khi cài đặt.

### Cài đặt bcrypt

Chạy lệnh sau trong thư mục backend:

```powershell
cd D:\cantin\backend
npm install bcrypt
```

Phiên bản được thêm vào dependencies:

```json
"bcrypt": "^6.0.0"
```

### Đăng ký tài khoản

Trước khi lưu tài khoản, backend hash mật khẩu với cost factor là `10`:

```js
const passwordHash = await bcrypt.hash(password, 10);
```

Sau đó chỉ `passwordHash` được truyền vào câu lệnh `INSERT`. Database không nhận mật khẩu gốc.

Luồng đăng ký mới:

```text
React Native
→ POST /api/register
→ Backend kiểm tra dữ liệu
→ bcrypt.hash(password, 10)
→ INSERT password hash vào database
```

### Đăng nhập tài khoản

Backend tìm tài khoản chỉ theo MSSV, lấy password hash từ database rồi kiểm tra bằng:

```js
const isPasswordCorrect = await bcrypt.compare(password, account.password);
```

`bcrypt.compare()` dùng mật khẩu người dùng vừa nhập để kiểm tra với hash đã lưu. Password hash không được giải mã.

Luồng đăng nhập mới:

```text
React Native gửi MSSV và mật khẩu
→ POST /api/login
→ Backend tìm tài khoản theo MSSV
→ Lấy password hash trong database
→ bcrypt.compare()
→ Trả kết quả đăng nhập
```

Response đăng nhập thành công chỉ trả `id`, `full_name`, `student_code` và `email`. Không trả trường `password` hoặc password hash về React Native.

Hiện tại backend không có API GET danh sách người dùng hoặc sinh viên. Khi bổ sung API này, không được chọn hoặc trả trường `password` về phía client hay Admin.

### Kết quả kiểm tra

- `bcrypt.hash()` tạo hash có dạng bắt đầu bằng `$2b$10$`.
- `bcrypt.compare()` trả `true` với mật khẩu đúng và `false` với mật khẩu sai.
- Cột `accounts.password` hiện có kiểu `VARCHAR(255)`, đủ để lưu bcrypt hash.
- `node --check backend/server.js` chạy thành công.
- `npm run typecheck` chạy thành công.

Lưu ý: tài khoản cũ đã lưu mật khẩu dạng plain text sẽ không đăng nhập được bằng luồng bcrypt mới. Các tài khoản này cần đăng ký lại, đặt lại mật khẩu hoặc được chuyển đổi dữ liệu sang bcrypt hash.

## 12. Kiểm tra bằng Postman sau khi nâng cấp bcrypt

### Đăng ký tài khoản

```http
POST http://localhost:3000/api/register
Content-Type: application/json
```

```json
{
  "full_name": "Nguyễn Văn A",
  "student_code": "23103047",
  "email": "sinhvien@example.com",
  "password": "123456"
}
```

Kết quả mong đợi: HTTP `201` và thông báo `Đăng ký thành công`.

### Kiểm tra password hash trong database

```sql
SELECT id, full_name, student_code, email, password
FROM accounts
WHERE student_code = '23103047';
```

Giá trị cột `password` phải là một hash tương tự `$2b$10$...`, không phải `123456`.

### Đăng nhập đúng mật khẩu

```http
POST http://localhost:3000/api/login
Content-Type: application/json
```

```json
{
  "student_code": "23103047",
  "password": "123456"
}
```

Kết quả mong đợi: HTTP `200`, thông báo `Đăng nhập thành công` và thông tin người dùng không chứa trường `password`.

### Đăng nhập sai mật khẩu

```json
{
  "student_code": "23103047",
  "password": "sai-mat-khau"
}
```

Kết quả mong đợi: HTTP `401`.

```json
{
  "message": "Mã sinh viên hoặc mật khẩu không đúng"
}
```
