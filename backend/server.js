// Đọc các biến cấu hình trong file .env.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

// Cho phép ứng dụng React Native gọi API và cho Express đọc JSON trong req.body.
app.use(cors());
app.use(express.json());

app.post('/api/register', async (req, res) => {
  const { full_name, student_code, email, password } = req.body;

  const fullName = full_name?.trim();
  const studentCode = student_code?.trim();
  const normalizedEmail = email?.trim();

  if (!fullName || !studentCode || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  try {
    // Dấu ? giúp truyền dữ liệu an toàn, không nối trực tiếp dữ liệu vào SQL.
    const [existingAccounts] = await db.execute(
      'SELECT student_code, email FROM accounts WHERE student_code = ? OR email = ?',
      [studentCode, normalizedEmail]
    );

    if (existingAccounts.some((account) => account.student_code === studentCode)) {
      return res.status(409).json({ message: 'Mã sinh viên đã tồn tại' });
    }

    if (existingAccounts.some((account) => account.email === normalizedEmail)) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    await db.execute(
      'INSERT INTO accounts (full_name, student_code, email, password) VALUES (?, ?, ?, ?)',
      [fullName, studentCode, normalizedEmail, password]
    );

    return res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi đăng ký tài khoản:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

app.post('/api/login', async (req, res) => {
  const { student_code, password } = req.body;
  const studentCode = student_code?.trim();

  if (!studentCode || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập mã sinh viên và mật khẩu' });
  }

  try {
    // Tìm đúng tài khoản bằng MSSV và mật khẩu người dùng đã nhập.
    const [accounts] = await db.execute(
      'SELECT id, full_name, student_code, email FROM accounts WHERE student_code = ? AND password = ?',
      [studentCode, password]
    );

    if (accounts.length === 0) {
      return res.status(401).json({ message: 'Mã sinh viên hoặc mật khẩu không đúng' });
    }

    return res.json({
      message: 'Đăng nhập thành công',
      user: accounts[0],
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

const PORT = process.env.PORT || 3000;

// Kiểm tra MySQL trước; chỉ mở API khi kết nối database thành công.
async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log('Kết nối MySQL thành công');
    connection.release();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Kết nối MySQL thất bại:', error.message);
    process.exit(1);
  }
}

startServer();
