// Đọc các biến cấu hình trong file .env.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
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

    // Hash mật khẩu trước khi lưu. Database chỉ nhận chuỗi hash, không nhận mật khẩu gốc.
    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute(
      'INSERT INTO accounts (full_name, student_code, email, password) VALUES (?, ?, ?, ?)',
      [fullName, studentCode, normalizedEmail, passwordHash]
    );

    return res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi đăng ký tài khoản:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }

  try {
    // Chỉ tìm theo email để lấy password hash đã lưu trong database.
    const [accounts] = await db.execute(
      'SELECT id, full_name, student_code, email, password FROM accounts WHERE LOWER(email) = ?',
      [normalizedEmail]
    );

    if (accounts.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // bcrypt.compare tự kiểm tra mật khẩu nhập vào với hash, không giải mã hash.
    const account = accounts[0];
    const isPasswordCorrect = await bcrypt.compare(password, account.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    return res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: account.id,
        full_name: account.full_name,
        student_code: account.student_code,
        email: account.email,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Lấy danh sách sinh viên. Không chọn cột password để tránh trả password hash về client.
app.get('/api/admin/users', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, full_name, student_code, email FROM accounts ORDER BY id'
    );

    return res.json({ users });
  } catch (error) {
    console.error('Lỗi lấy danh sách sinh viên:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Lấy một sinh viên theo ID.
app.get('/api/admin/users/:id', async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID sinh viên không hợp lệ' });
  }

  try {
    const [users] = await db.execute(
      'SELECT id, full_name, student_code, email FROM accounts WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    }

    return res.json({ user: users[0] });
  } catch (error) {
    console.error('Lỗi lấy thông tin sinh viên:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Admin tạo tài khoản sinh viên mới.
app.post('/api/admin/users', async (req, res) => {
  const { full_name, student_code, email, password } = req.body;

  const fullName = full_name?.trim();
  const studentCode = student_code?.trim();
  const normalizedEmail = email?.trim();

  if (!fullName || !studentCode || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  try {
    const [existingUsers] = await db.execute(
      'SELECT student_code, email FROM accounts WHERE student_code = ? OR email = ?',
      [studentCode, normalizedEmail]
    );

    if (existingUsers.some((user) => user.student_code === studentCode)) {
      return res.status(409).json({ message: 'Mã sinh viên đã tồn tại' });
    }

    if (existingUsers.some((user) => user.email === normalizedEmail)) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO accounts (full_name, student_code, email, password) VALUES (?, ?, ?, ?)',
      [fullName, studentCode, normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: 'Thêm sinh viên thành công',
      user: {
        id: result.insertId,
        full_name: fullName,
        student_code: studentCode,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error('Lỗi thêm sinh viên:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Cập nhật thông tin sinh viên, không thay đổi mật khẩu.
app.put('/api/admin/users/:id', async (req, res) => {
  const userId = Number(req.params.id);
  const { full_name, student_code, email } = req.body;

  const fullName = full_name?.trim();
  const studentCode = student_code?.trim();
  const normalizedEmail = email?.trim();

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID sinh viên không hợp lệ' });
  }

  if (!fullName || !studentCode || !normalizedEmail) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  try {
    const [users] = await db.execute('SELECT id FROM accounts WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    }

    const [existingUsers] = await db.execute(
      'SELECT student_code, email FROM accounts WHERE (student_code = ? OR email = ?) AND id <> ?',
      [studentCode, normalizedEmail, userId]
    );

    if (existingUsers.some((user) => user.student_code === studentCode)) {
      return res.status(409).json({ message: 'Mã sinh viên đã tồn tại' });
    }

    if (existingUsers.some((user) => user.email === normalizedEmail)) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    await db.execute(
      'UPDATE accounts SET full_name = ?, student_code = ?, email = ? WHERE id = ?',
      [fullName, studentCode, normalizedEmail, userId]
    );

    return res.json({
      message: 'Cập nhật sinh viên thành công',
      user: {
        id: userId,
        full_name: fullName,
        student_code: studentCode,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error('Lỗi cập nhật sinh viên:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Xóa tài khoản sinh viên theo ID.
app.delete('/api/admin/users/:id', async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID sinh viên không hợp lệ' });
  }

  try {
    const [result] = await db.execute('DELETE FROM accounts WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    }

    return res.json({ message: 'Xóa sinh viên thành công' });
  } catch (error) {
    console.error('Lỗi xóa sinh viên:', error.message);
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
