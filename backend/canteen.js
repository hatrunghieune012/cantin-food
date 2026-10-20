const crypto = require('node:crypto');

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (message, status = 400) => { throw new ApiError(status, message); };
const integer = (value, min = 1, max = 2147483647) => Number.isSafeInteger(value) && value >= min && value <= max;
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const categories = ['Cơm', 'Mì', 'Đồ uống', 'Ăn vặt', 'Món khác'];
const imageKeys = ['com-ga', 'com-suon', 'mi-xao-bo', 'bun-thit-nuong', 'pepsi', 'pho-bo', 'banh-mi'];

function validateFood(body, creating = false) {
  if (!text(body.name, 150) || !text(body.description, 500) || !categories.includes(body.category)
    || !imageKeys.includes(body.image_key) || !integer(body.price, 1, 999999999999)
    || (creating && !integer(body.stock_quantity, 0))
    || (!creating && typeof body.is_active !== 'boolean')) fail('Thông tin món ăn không hợp lệ.');
}

function pickupSettings() {
  const open = process.env.CANTEEN_OPEN || '07:00';
  const close = process.env.CANTEEN_CLOSE || '18:00';
  const minutes = s => /^\d{2}:\d{2}$/.test(s) && Number(s.slice(0, 2)) < 24 && Number(s.slice(3)) < 60
    ? Number(s.slice(0, 2)) * 60 + Number(s.slice(3)) : NaN;
  const start = minutes(open), end = minutes(close);
  const interval = Number(process.env.PICKUP_SLOT_MINUTES || 15);
  const lead = Number(process.env.PICKUP_LEAD_MINUTES || 15);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || !integer(interval, 5, 120) || !integer(lead, 1, 240)) {
    throw new Error('Cấu hình giờ nhận món không hợp lệ.');
  }
  return { open, close, start, end, interval, lead, timezone: 'Asia/Ho_Chi_Minh' };
}

function pickupSlots(now = new Date()) {
  const config = pickupSettings();
  const local = new Date(now.getTime() + 7 * 3600000);
  const slots = [];
  for (let day = 0; day < 3; day++) {
    const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + day) - 7 * 3600000;
    for (let minute = config.start; minute < config.end; minute += config.interval) {
      const instant = midnight + minute * 60000;
      if (instant >= now.getTime() + config.lead * 60000) slots.push(new Date(instant).toISOString());
    }
  }
  return { ...config, slots };
}

function nextStatuses(order) {
  if (order.order_type === 'counter') return [];
  if (order.order_type === 'legacy_delivery') {
    return { pending: ['preparing', 'cancelled'], preparing: ['delivering', 'cancelled'], delivering: ['completed'] }[order.status] || [];
  }
  return { pending: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: ['completed', 'cancelled'] }[order.status] || [];
}

module.exports = function installCanteen(app, db, requireLogin, requireAdmin, getOrders) {
  const staff = (req, res, next) => ['admin', 'staff'].includes(req.account.role) ? next() : res.status(403).json({ message: 'Chỉ nhân viên và quản trị viên được phép.' });
  const route = handler => async (req, res, next) => {
    try { await handler(req, res); } catch (error) { next(error); }
  };
  const getOrder = async id => (await getOrders('WHERE o.id = ?', [id]))[0];

  app.get('/api/pickup-slots', requireLogin, route(async (req, res) => res.json(pickupSlots())));
  app.get('/api/admin/foods', requireLogin, requireAdmin, route(async (req, res) => {
    const [foods] = await db.query('SELECT * FROM foods ORDER BY id');
    res.json({ foods });
  }));
  app.put('/api/admin/foods/:id', requireLogin, requireAdmin, route(async (req, res) => {
    validateFood(req.body);
    const id = Number(req.params.id);
    if (!integer(id)) fail('Mã món không hợp lệ.');
    const b = req.body;
    const [result] = await db.execute(
      'UPDATE foods SET name=?, category=?, description=?, price=?, image_key=?, is_active=? WHERE id=?',
      [b.name.trim(), b.category, b.description.trim(), b.price, b.image_key, b.is_active, id]
    );
    if (!result.affectedRows) fail('Không tìm thấy món.', 404);
    res.json({ message: 'Đã cập nhật món ăn.' });
  }));
  // Delta updates avoid overwriting stock consumed by concurrent orders.
  app.put('/api/admin/foods/:id/stock', requireLogin, requireAdmin, route(async (req, res) => {
    const id = Number(req.params.id), delta = req.body.delta;
    if (!integer(id) || !integer(delta, -100000, 100000) || delta === 0) fail('Mức điều chỉnh không hợp lệ.');
    const [result] = await db.execute(
      'UPDATE foods SET stock_quantity=stock_quantity+? WHERE id=? AND stock_quantity+? BETWEEN 0 AND 2147483647',
      [delta, id, delta]
    );
    if (!result.affectedRows) fail('Không đủ tồn kho hoặc không tìm thấy món.', 409);
    res.json({ message: 'Đã cập nhật tồn kho.' });
  }));

  app.post('/api/orders', requireLogin, route(async (req, res) => {
    const b = req.body;
    const counter = b.orderType === 'counter';
    if (counter && !['admin', 'staff'].includes(req.account.role)) fail('Bạn không có quyền bán tại quầy.', 403);
    if (!counter && req.account.role !== 'user') fail('Đơn đặt trước dành cho sinh viên.', 403);
    if (b.orderType && !['online', 'counter'].includes(b.orderType)) fail('Loại đơn không hợp lệ.');
    if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 100) fail('Danh sách món không hợp lệ.');
    const quantities = new Map();
    for (const item of b.items) {
      if (!item || !integer(item.foodId) || !integer(item.quantity, 1, 1000)) fail('Số lượng món không hợp lệ.');
      quantities.set(item.foodId, (quantities.get(item.foodId) || 0) + item.quantity);
    }
    const items = [...quantities].sort((a, b) => a[0] - b[0]);
    if (items.some(([, quantity]) => quantity > 1000)) fail('Số lượng mỗi món tối đa 1000.');
    if (b.note != null && (typeof b.note !== 'string' || b.note.length > 500)) fail('Ghi chú tối đa 500 ký tự.');
    if (typeof b.requestKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(b.requestKey)) fail('Thiếu mã chống tạo đơn trùng.');
    if (counter && b.paymentMethod !== 'cash') fail('Vui lòng xác nhận đã nhận tiền mặt.');
    if (counter && !integer(b.expectedTotal, 1, 999999999999)) fail('Tổng tiền xác nhận không hợp lệ.');
    const pickup = counter ? null : new Date(b.pickupAt);
    if (!counter && (!b.pickupAt || !Number.isFinite(pickup.getTime()))) fail('Thời gian nhận không hợp lệ.');
    const requestKey = `${req.account.id}:${b.requestKey}`;
    const requestHash = crypto.createHash('sha256').update(JSON.stringify({
      items, counter, pickup: pickup?.toISOString(), note: b.note || '', payment: b.paymentMethod, expectedTotal: b.expectedTotal,
    })).digest('hex');
    let connection;
    let id;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [existing] = await connection.execute('SELECT id, request_hash FROM orders WHERE request_key=?', [requestKey]);
      if (existing.length) {
        if (existing[0].request_hash !== requestHash) fail('Mã yêu cầu đã được dùng cho đơn khác.', 409);
        await connection.commit();
        connection.release(); connection = null;
        return res.json({ order: await getOrder(existing[0].id) });
      }
      if (!counter && !pickupSlots().slots.includes(pickup.toISOString())) fail('Khung giờ nhận không còn hợp lệ. Vui lòng chọn lại.');
      const [result] = await connection.execute(
        `INSERT INTO orders (user_id, customer_name, phone, note, total_amount, status, order_type,
         pickup_at, payment_method, payment_status, paid_at, handled_by, request_key, request_hash)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [counter ? null : req.account.id, counter ? 'Khách tại quầy' : req.account.full_name,
          counter ? null : req.account.phone, b.note?.trim() || null, counter ? 'completed' : 'pending',
          counter ? 'counter' : 'online', pickup, counter ? 'cash' : null, counter ? 'paid' : 'unpaid',
          counter ? new Date() : null, counter ? req.account.id : null, requestKey, requestHash]
      );
      id = result.insertId;
      let total = 0;
      for (const [foodId, quantity] of items) {
        const [foods] = await connection.execute('SELECT * FROM foods WHERE id=? FOR UPDATE', [foodId]);
        const food = foods[0];
        if (!food || !food.is_active) fail('Món đã ngừng bán hoặc không tồn tại.', 409);
        if (food.stock_quantity < quantity) fail(`${food.name} không đủ số lượng.`, 409);
        total += Number(food.price) * quantity;
        if (!Number.isSafeInteger(total) || total > 999999999999) fail('Tổng tiền vượt giới hạn.');
        await connection.execute('UPDATE foods SET stock_quantity=stock_quantity-? WHERE id=?', [quantity, foodId]);
        await connection.execute(
          'INSERT INTO order_items(order_id,food_id,food_name,price,quantity) VALUES (?,?,?,?,?)',
          [id, foodId, food.name, food.price, quantity]
        );
      }
      if (counter && total !== b.expectedTotal) fail('Giá món đã thay đổi. Hãy làm mới món và xác nhận lại số tiền khách trả.', 409);
      await connection.execute('UPDATE orders SET total_amount=? WHERE id=?', [total, id]);
      await connection.commit();
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        connection?.release(); connection = null;
        const [existing] = await db.execute('SELECT id, request_hash FROM orders WHERE request_key=?', [requestKey]);
        if (existing[0]?.request_hash === requestHash) return res.json({ order: await getOrder(existing[0].id) });
        fail('Mã yêu cầu trùng với đơn khác.', 409);
      }
      throw error;
    } finally { connection?.release(); }
    res.status(201).json({ message: 'Đặt món thành công.', order: await getOrder(id) });
  }));

  app.get('/api/staff/orders', requireLogin, staff, route(async (req, res) => res.json({ orders: await getOrders() })));
  async function changeStatus(req, res) {
    const id = Number(req.params.id);
    if (!integer(id)) fail('Mã đơn không hợp lệ.');
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT * FROM orders WHERE id=? FOR UPDATE', [id]);
      const order = rows[0];
      if (!order) fail('Không tìm thấy đơn.', 404);
      const student = req.account.role === 'user';
      if (student && (order.user_id !== req.account.id || req.body.status !== 'cancelled' || order.order_type !== 'online')) fail('Không có quyền thay đổi đơn.', 403);
      // Retrying an already applied transition never changes stock/payment again.
      if (order.status !== req.body.status) {
        if (student && order.status !== 'pending') fail('Chỉ được hủy đơn đang chờ xác nhận.', 409);
        if (!nextStatuses(order).includes(req.body.status)) fail('Không được chuyển trạng thái theo cách này.', 409);
        const cancelled = req.body.status === 'cancelled';
        const reason = req.body.reason;
        if (cancelled && !student && !text(reason, 255)) fail('Vui lòng nhập lý do hủy.');
        if (cancelled && order.status === 'ready') {
          if (reason !== 'no_show' || !order.pickup_at || Date.now() < new Date(order.pickup_at).getTime() + 30 * 60000) {
            fail('Chỉ đánh dấu không đến nhận sau giờ hẹn 30 phút.', 409);
          }
        }
        // Only unprepared pending orders return stock. Prepared/no-show food is a loss.
        const restore = cancelled && order.status === 'pending' && !order.stock_restored;
        if (restore) {
          const [items] = await connection.execute(
            'SELECT food_id, SUM(quantity) quantity FROM order_items WHERE order_id=? GROUP BY food_id ORDER BY food_id', [id]
          );
          for (const item of items) {
            const [result] = await connection.execute('UPDATE foods SET stock_quantity=stock_quantity+? WHERE id=?', [Number(item.quantity), item.food_id]);
            if (!result.affectedRows) fail('Món cũ không còn tồn tại; cần đối soát tồn kho trước khi hủy.', 409);
          }
        }
        const completed = req.body.status === 'completed' && order.order_type === 'online';
        if (completed && req.body.paymentMethod !== 'cash') fail('Phải xác nhận nhận tiền mặt trước khi giao món.');
        await connection.execute(
          `UPDATE orders SET status=?, cancellation_reason=?, stock_restored=?,
           payment_method=?, payment_status=?, paid_at=?, handled_by=? WHERE id=?`,
          [req.body.status, cancelled ? (student ? 'student_cancelled' : reason.trim()) : null,
            restore ? 1 : order.stock_restored, completed ? 'cash' : order.payment_method,
            completed ? 'paid' : order.payment_status, completed ? new Date() : order.paid_at,
            student ? order.handled_by : req.account.id, id]
        );
      }
      await connection.commit();
    } catch (error) { if (connection) await connection.rollback(); throw error; }
    finally { connection?.release(); }
    res.json({ order: await getOrder(id) });
  }
  app.put('/api/admin/orders/:id/status', requireLogin, requireAdmin, route(changeStatus));
  app.put('/api/staff/orders/:id/status', requireLogin, staff, route(changeStatus));
  app.put('/api/orders/:id/status', requireLogin, route(changeStatus));

  app.get('/api/tables', requireLogin, route(async (req, res) => {
    const management = ['staff', 'admin'].includes(req.account.role);
    const [tables] = await db.query(`SELECT * FROM canteen_tables ${management ? '' : 'WHERE is_active=1'} ORDER BY area, code`);
    res.json({ tables });
  }));
  const tableBody = b => {
    if (!text(b.code, 30) || !text(b.area, 100) || !integer(b.seats, 1, 100)
      || !['available', 'occupied', 'unknown'].includes(b.status) || typeof b.is_active !== 'boolean') fail('Thông tin bàn không hợp lệ.');
  };
  app.post('/api/tables', requireLogin, staff, route(async (req, res) => {
    tableBody(req.body);
    const b = req.body;
    const [result] = await db.execute(
      'INSERT INTO canteen_tables(code,area,seats,status,is_active,updated_by) VALUES (?,?,?,?,?,?)',
      [b.code.trim(), b.area.trim(), b.seats, b.status, b.is_active, req.account.id]
    );
    res.status(201).json({ id: result.insertId });
  }));
  app.put('/api/tables/:id', requireLogin, staff, route(async (req, res) => {
    tableBody(req.body);
    const id = Number(req.params.id), b = req.body;
    if (!integer(id)) fail('Mã bàn không hợp lệ.');
    const [result] = await db.execute(
      'UPDATE canteen_tables SET code=?,area=?,seats=?,status=?,is_active=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      [b.code.trim(), b.area.trim(), b.seats, b.status, b.is_active, req.account.id, id]
    );
    if (!result.affectedRows) fail('Không tìm thấy bàn.', 404);
    res.json({ message: 'Đã cập nhật bàn.' });
  }));

  app.put('/api/admin/users/:id/access', requireLogin, requireAdmin, route(async (req, res) => {
    const id = Number(req.params.id), b = req.body;
    if (!integer(id) || !['user', 'staff'].includes(b.role) || typeof b.is_active !== 'boolean') fail('Phân quyền không hợp lệ.');
    if (id === req.account.id) fail('Không được thay đổi quyền của chính mình.', 409);
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [result] = await connection.execute(
        "UPDATE accounts SET role=?,is_active=? WHERE id=? AND role <> 'admin'", [b.role, b.is_active, id]
      );
      if (!result.affectedRows) fail('Không tìm thấy tài khoản hoặc tài khoản là quản trị viên.', 409);
      await connection.execute('DELETE FROM auth_sessions WHERE account_id=?', [id]);
      await connection.commit();
    } catch (error) { if (connection) await connection.rollback(); throw error; }
    finally { connection?.release(); }
    res.json({ message: 'Đã cập nhật quyền; các phiên đăng nhập cũ đã hết hiệu lực.' });
  }));
};
module.exports.ApiError = ApiError;
module.exports.validateFood = validateFood;
module.exports.nextStatuses = nextStatuses;
module.exports.pickupSlots = pickupSlots;
