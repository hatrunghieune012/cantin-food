// Đọc các biến cấu hình trong file .env.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

const app = express();

// Cho phép ứng dụng React Native gọi API và cho Express đọc JSON trong req.body.
app.use(cors());
app.use(express.json());

// Token stays on the backend so a client cannot grant itself the Admin role.
const sessions = new Map();

async function requireLogin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập' });
  }

  try {
    const [accounts] = await db.execute(
      'SELECT id, full_name, student_code, email, phone, role FROM accounts WHERE id = ?',
      [session.userId]
    );

    if (accounts.length === 0) {
      sessions.delete(token);
      return res.status(401).json({ message: 'Tài khoản không còn tồn tại' });
    }

    req.account = accounts[0];
    req.authToken = token;
    return next();
  } catch (error) {
    console.error('Lỗi xác thực:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
}

function requireAdmin(req, res, next) {
  if (req.account.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền Admin' });
  }

  return next();
}

function isValidPhone(phone) {
  return /^\+?[0-9]{8,15}$/.test(phone);
}

app.post('/api/register', async (req, res) => {
  const { full_name, student_code, email, phone, password } = req.body;

  const fullName = full_name?.trim();
  const studentCode = student_code?.trim();
  const normalizedEmail = email?.trim();
  const normalizedPhone = phone?.trim();

  if (!fullName || !studentCode || !normalizedEmail || !normalizedPhone || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  if (!isValidPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
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
      "INSERT INTO accounts (full_name, student_code, email, phone, password, role) VALUES (?, ?, ?, ?, ?, 'user')",
      [fullName, studentCode, normalizedEmail, normalizedPhone, passwordHash]
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
      'SELECT id, full_name, student_code, email, phone, password, role FROM accounts WHERE LOWER(email) = ?',
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

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId: account.id });

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: account.id,
        name: account.full_name,
        full_name: account.full_name,
        student_code: account.student_code,
        email: account.email,
        phone: account.phone,
        role: account.role,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Lấy danh sách sinh viên. Không chọn cột password để tránh trả password hash về client.
app.post('/api/logout', requireLogin, (req, res) => {
  sessions.delete(req.authToken);
  return res.json({ message: 'Đăng xuất thành công' });
});

app.get('/api/me', requireLogin, (req, res) => {
  return res.json({ user: req.account });
});

async function getOrders(whereSql = '', params = []) {
  const [orders] = await db.execute(
    `SELECT o.id, o.user_id, o.customer_name, o.phone,
            o.delivery_address, o.note, o.total_amount, o.status, o.created_at
     FROM orders o
     JOIN accounts a ON a.id = o.user_id
     ${whereSql}
     ORDER BY o.created_at DESC`,
    params
  );

  if (orders.length === 0) return [];

  const placeholders = orders.map(() => '?').join(', ');
  const [items] = await db.execute(
    `SELECT id, order_id, food_id, food_name, price, quantity
     FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
    orders.map((order) => order.id)
  );

  return orders.map((order) => ({
    ...order,
    total_amount: Number(order.total_amount),
    items: items
      .filter((item) => item.order_id === order.id)
      .map((item) => ({ ...item, price: Number(item.price) })),
  }));
}

app.post('/api/orders', requireLogin, async (req, res) => {
  const { items, phone, deliveryAddress, note } = req.body;
  const normalizedPhone = phone?.trim();
  const normalizedAddress = deliveryAddress?.trim();
  const normalizedNote = typeof note === 'string' ? note.trim() : '';

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Đơn hàng phải có ít nhất một món ăn' });
  }

  if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Số điện thoại nhận hàng không hợp lệ' });
  }

  if (!normalizedAddress) {
    return res.status(400).json({ message: 'Vui lòng nhập địa chỉ giao hàng' });
  }

  const validItems = items.every((item) =>
    Number.isInteger(item.foodId) && item.foodId > 0 &&
    typeof item.name === 'string' && item.name.trim() &&
    Number.isFinite(item.price) && item.price >= 0 &&
    Number.isInteger(item.quantity) && item.quantity > 0
  );

  if (!validItems) {
    return res.status(400).json({ message: 'Danh sách món ăn không hợp lệ' });
  }

  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO orders (user_id, customer_name, phone, delivery_address, note, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [req.account.id, req.account.full_name, normalizedPhone, normalizedAddress, normalizedNote || null, totalAmount]
    );

    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items (order_id, food_id, food_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, item.foodId, item.name.trim(), item.price, item.quantity]
      );
    }

    await connection.commit();
    const [order] = await getOrders('WHERE o.id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Đặt hàng thành công', order });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi tạo đơn hàng:', error.message);
    return res.status(500).json({ message: 'Không thể tạo đơn hàng' });
  } finally {
    connection.release();
  }
});

app.get('/api/orders', requireLogin, async (req, res) => {
  try {
    const orders = await getOrders('WHERE o.user_id = ?', [req.account.id]);
    return res.json({ orders });
  } catch (error) {
    console.error('Lỗi lấy đơn hàng:', error.message);
    return res.status(500).json({ message: 'Không thể lấy đơn hàng' });
  }
});

app.get('/api/orders/:id', requireLogin, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
  }

  try {
    const where = req.account.role === 'admin'
      ? 'WHERE o.id = ?'
      : 'WHERE o.id = ? AND o.user_id = ?';
    const params = req.account.role === 'admin' ? [orderId] : [orderId, req.account.id];
    const [order] = await getOrders(where, params);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    return res.json({ order });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error.message);
    return res.status(500).json({ message: 'Không thể lấy đơn hàng' });
  }
});

app.get('/api/admin/orders', requireLogin, requireAdmin, async (req, res) => {
  try {
    const orders = await getOrders();
    return res.json({ orders });
  } catch (error) {
    console.error('Lỗi lấy đơn hàng Admin:', error.message);
    return res.status(500).json({ message: 'Không thể lấy đơn hàng' });
  }
});

app.put('/api/admin/orders/:id/status', requireLogin, requireAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  const allowedStatuses = ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'];

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
  }

  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
  }

  try {
    const [result] = await db.execute('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, orderId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    const [order] = await getOrders('WHERE o.id = ?', [orderId]);
    return res.json({ message: 'Cập nhật trạng thái thành công', order });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error.message);
    return res.status(500).json({ message: 'Không thể cập nhật trạng thái' });
  }
});

app.get('/api/admin/users', requireLogin, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, full_name, student_code, email, phone, role FROM accounts ORDER BY id'
    );

    return res.json({ users });
  } catch (error) {
    console.error('Lỗi lấy danh sách sinh viên:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Lấy một sinh viên theo ID.
app.get('/api/admin/users/:id', requireLogin, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID sinh viên không hợp lệ' });
  }

  try {
    const [users] = await db.execute(
      'SELECT id, full_name, student_code, email, phone, role FROM accounts WHERE id = ?',
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
app.post('/api/admin/users', requireLogin, requireAdmin, async (req, res) => {
  const { full_name, student_code, email, phone, password } = req.body;

  const fullName = full_name?.trim();
  const studentCode = student_code?.trim();
  const normalizedEmail = email?.trim();
  const normalizedPhone = phone?.trim();

  if (!fullName || !studentCode || !normalizedEmail || !normalizedPhone || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  if (!isValidPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
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
      "INSERT INTO accounts (full_name, student_code, email, phone, password, role) VALUES (?, ?, ?, ?, ?, 'user')",
      [fullName, studentCode, normalizedEmail, normalizedPhone, passwordHash]
    );

    return res.status(201).json({
      message: 'Thêm sinh viên thành công',
      user: {
        id: result.insertId,
        full_name: fullName,
        student_code: studentCode,
        email: normalizedEmail,
        phone: normalizedPhone,
      },
    });
  } catch (error) {
    console.error('Lỗi thêm sinh viên:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Cập nhật thông tin sinh viên, không thay đổi mật khẩu.
app.put('/api/admin/users/:id', requireLogin, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  const { full_name, student_code, email, phone } = req.body;

  const fullName = full_name?.trim();
  const studentCode = student_code?.trim();
  const normalizedEmail = email?.trim();
  const normalizedPhone = phone?.trim();

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID sinh viên không hợp lệ' });
  }

  if (!fullName || !studentCode || !normalizedEmail || !normalizedPhone) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  if (!isValidPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
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
      'UPDATE accounts SET full_name = ?, student_code = ?, email = ?, phone = ? WHERE id = ?',
      [fullName, studentCode, normalizedEmail, normalizedPhone, userId]
    );

    return res.json({
      message: 'Cập nhật sinh viên thành công',
      user: {
        id: userId,
        full_name: fullName,
        student_code: studentCode,
        email: normalizedEmail,
        phone: normalizedPhone,
      },
    });
  } catch (error) {
    console.error('Lỗi cập nhật sinh viên:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Xóa tài khoản sinh viên theo ID.
app.delete('/api/admin/users/:id', requireLogin, requireAdmin, async (req, res) => {
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
