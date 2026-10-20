// Đọc các biến cấu hình trong file .env.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./db');

const { nextStatuses, validateFood } = require('./canteen');
const app = express();

// Cho phép ứng dụng React Native gọi API và cho Express đọc JSON trong req.body.
app.use(cors());
app.use(express.json());

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function requireLogin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập' });
  }

  try {
    const [accounts] = await db.execute(
      `SELECT a.id, a.full_name, a.student_code, a.email, a.phone, a.default_address, a.role
       FROM auth_sessions s
       JOIN accounts a ON a.id = s.account_id
       WHERE s.token_hash = ? AND s.expires_at > NOW() AND a.is_active = 1`,
      [hashToken(token)]
    );

    if (accounts.length === 0) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại' });
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

  const fullName = (typeof full_name === 'string' ? full_name.trim() : '');
  const studentCode = (typeof student_code === 'string' ? student_code.trim() : '');
  const normalizedEmail = (typeof email === 'string' ? email.trim().toLowerCase() : '');
  const normalizedPhone = (typeof phone === 'string' ? phone.trim() : '');

  if (!fullName || !studentCode || !normalizedEmail || !normalizedPhone || typeof password !== 'string') {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ message: 'Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte UTF-8.' });
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
  const normalizedEmail = (typeof email === 'string' ? email.trim().toLowerCase() : '');

  if (!normalizedEmail || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }

  try {
    // Chỉ tìm theo email để lấy password hash đã lưu trong database.
    const [accounts] = await db.execute(
      'SELECT id, full_name, student_code, email, phone, default_address, password, role FROM accounts WHERE LOWER(email) = ? AND is_active = 1',
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
    await db.execute(
      'INSERT INTO auth_sessions (account_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [account.id, hashToken(token)]
    );

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
        default_address: account.default_address,
        role: account.role,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return res.status(500).json({ message: 'Lỗi server hoặc cơ sở dữ liệu' });
  }
});

// Lấy danh sách sinh viên. Không chọn cột password để tránh trả password hash về client.
app.post('/api/logout', requireLogin, async (req, res) => {
  try {
    await db.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [hashToken(req.authToken)]);
    return res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Lỗi đăng xuất:', error.message);
    return res.status(500).json({ message: 'Không thể đăng xuất' });
  }
});

app.get('/api/me', requireLogin, (req, res) => {
  return res.json({ user: req.account });
});

app.get('/api/foods', async (req, res) => {
  try {
    const [foods] = await db.execute(
      'SELECT id, name, category, price, description, stock_quantity, image_key, is_active FROM foods WHERE is_active=1 ORDER BY id'
    );
    return res.json({ foods: foods.map((food) => ({ ...food, price: Number(food.price) })) });
  } catch (error) {
    console.error('Lỗi lấy món ăn:', error.message);
    return res.status(500).json({ message: 'Không thể lấy danh sách món ăn' });
  }
});

app.post('/api/admin/foods', requireLogin, requireAdmin, async (req, res) => {
  validateFood(req.body, true);
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const price = Number(req.body.price);
  const stockQuantity = Number(req.body.stock_quantity);
  const imageKey = typeof req.body.image_key === 'string' ? req.body.image_key.trim() : '';
  const allowedCategories = ['Cơm', 'Mì', 'Đồ uống', 'Ăn vặt', 'Món khác'];
  const allowedImageKeys = ['com-ga', 'com-suon', 'mi-xao-bo', 'bun-thit-nuong', 'pepsi', 'pho-bo', 'banh-mi'];

  if (!name || !description || !allowedCategories.includes(category)) {
    return res.status(400).json({ message: 'Tên món, danh mục và mô tả không hợp lệ' });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'Giá món ăn phải lớn hơn 0' });
  }
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return res.status(400).json({ message: 'Số lượng món ăn phải là số nguyên không âm' });
  }
  if (!allowedImageKeys.includes(imageKey)) {
    return res.status(400).json({ message: 'Ảnh món ăn không hợp lệ' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO foods (name, category, price, description, stock_quantity, image_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category, price, description, stockQuantity, imageKey]
    );
    const [foods] = await db.execute(
      'SELECT id, name, category, price, description, stock_quantity, image_key FROM foods WHERE id = ?',
      [result.insertId]
    );
    return res.status(201).json({
      message: 'Thêm món ăn thành công',
      food: { ...foods[0], price: Number(foods[0].price) },
    });
  } catch (error) {
    console.error('Lỗi thêm món ăn:', error.message);
    return res.status(500).json({ message: 'Không thể thêm món ăn' });
  }
});

app.put('/api/users/me', requireLogin, async (req, res) => {
  const fullName = (typeof req.body.full_name === 'string' ? req.body.full_name.trim() : '');
  const phone = (typeof req.body.phone === 'string' ? req.body.phone.trim() : '');
  const defaultAddress = typeof req.body.defaultAddress === 'string' ? req.body.defaultAddress.trim() : '';

  if (!fullName) {
    return res.status(400).json({ message: 'Họ tên không được để trống' });
  }

  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  }

  try {
    await db.execute(
      'UPDATE accounts SET full_name = ?, phone = ?, default_address = ? WHERE id = ?',
      [fullName, phone, defaultAddress || null, req.account.id]
    );
    const [users] = await db.execute(
      'SELECT id, full_name, student_code, email, phone, default_address, role, is_active FROM accounts WHERE id = ?',
      [req.account.id]
    );
    return res.json({ message: 'Cập nhật thông tin thành công', user: users[0] });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error.message);
    return res.status(500).json({ message: 'Không thể cập nhật thông tin' });
  }
});

async function getOrders(whereSql = '', params = []) {
  const [orders] = await db.execute(
    `SELECT o.id, o.user_id, o.customer_name, o.phone,
            o.delivery_address, o.note, o.total_amount, o.status, o.created_at,
            o.order_type, o.pickup_at, o.payment_method, o.payment_status, o.paid_at,
            o.cancellation_reason, o.stock_restored, o.handled_by
     FROM orders o
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
    allowed_statuses: nextStatuses(order),
    items: items
      .filter((item) => item.order_id === order.id)
      .map((item) => ({ ...item, price: Number(item.price) })),
  }));
}

require('./canteen')(app, db, requireLogin, requireAdmin, getOrders);

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
    const where = ['admin', 'staff'].includes(req.account.role)
      ? 'WHERE o.id = ?'
      : 'WHERE o.id = ? AND o.user_id = ?';
    const params = ['admin', 'staff'].includes(req.account.role) ? [orderId] : [orderId, req.account.id];
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

app.get('/api/admin/dashboard', requireLogin, requireAdmin, async (req, res) => {
  try {
    const [[foodCount], [userCount], [todayOrderCount]] = await Promise.all([
      db.execute('SELECT COUNT(*) AS total FROM foods'),
      db.execute("SELECT COUNT(*) AS total FROM accounts WHERE role = 'user'"),
      db.execute('SELECT COUNT(*) AS total FROM orders WHERE DATE(created_at) = CURDATE()'),
    ]);
    const [popularFoods] = await db.execute(
      `SELECT f.id, f.name, f.price, COALESCE(SUM(CASE WHEN o.status='completed' THEN oi.quantity ELSE 0 END), 0) AS sold_quantity
       FROM foods f LEFT JOIN order_items oi ON oi.food_id = f.id LEFT JOIN orders o ON o.id=oi.order_id
       GROUP BY f.id, f.name, f.price ORDER BY sold_quantity DESC, f.id LIMIT 4`
    );
    const [recentOrders] = await db.execute(
      `SELECT id, customer_name, total_amount, status, created_at
       FROM orders ORDER BY created_at DESC LIMIT 3`
    );
    const [ordersByDay] = await db.execute(
      `SELECT DATE_FORMAT(created_at, '%d/%m') AS order_date, COUNT(*) AS total
       FROM orders WHERE created_at >= CURDATE() - INTERVAL 6 DAY
       GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%d/%m') ORDER BY DATE(created_at)`
    );
    const [[revenue]] = await db.query("SELECT COALESCE(SUM(total_amount),0) total FROM orders WHERE payment_status='paid' AND DATE(paid_at)=CURDATE()");
    return res.json({
      todayRevenue: Number(revenue.total),
      totalFoods: foodCount[0].total,
      totalUsers: userCount[0].total,
      todayOrders: todayOrderCount[0].total,
      popularFoods: popularFoods.map((food) => ({ ...food, price: Number(food.price), sold_quantity: Number(food.sold_quantity) })),
      recentOrders: recentOrders.map((order) => ({ ...order, total_amount: Number(order.total_amount) })),
      ordersByDay: ordersByDay.map((day) => ({ ...day, total: Number(day.total) })),
    });
  } catch (error) {
    console.error('Lỗi lấy tổng quan Admin:', error.message);
    return res.status(500).json({ message: 'Không thể lấy dữ liệu tổng quan' });
  }
});

app.get('/api/admin/users', requireLogin, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, full_name, student_code, email, phone, default_address, role, is_active FROM accounts ORDER BY id'
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
      'SELECT id, full_name, student_code, email, phone, default_address, role, is_active FROM accounts WHERE id = ?',
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

  const fullName = (typeof full_name === 'string' ? full_name.trim() : '');
  const studentCode = (typeof student_code === 'string' ? student_code.trim() : '');
  const normalizedEmail = (typeof email === 'string' ? email.trim().toLowerCase() : '');
  const normalizedPhone = (typeof phone === 'string' ? phone.trim() : '');

  if (!fullName || !studentCode || !normalizedEmail || !normalizedPhone || typeof password !== 'string' || Buffer.byteLength(password) < 8 || Buffer.byteLength(password) > 72) {
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

  const fullName = (typeof full_name === 'string' ? full_name.trim() : '');
  const studentCode = (typeof student_code === 'string' ? student_code.trim() : '');
  const normalizedEmail = (typeof email === 'string' ? email.trim().toLowerCase() : '');
  const normalizedPhone = (typeof phone === 'string' ? phone.trim() : '');

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
    const [users] = await db.execute("SELECT id FROM accounts WHERE id = ? AND role <> 'admin'", [userId]);

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
app.delete('/api/admin/users/:id', requireLogin, requireAdmin, (req, res) => {
  res.status(405).json({ message: 'Hãy vô hiệu hóa tài khoản qua chức năng phân quyền.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
  res.status(status).json({ message: error.status ? error.message : status === 409 ? 'Dữ liệu đã tồn tại.' : 'Không thể xử lý yêu cầu. Vui lòng thử lại.' });
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

if (require.main === module) startServer();
module.exports = { app, db };
