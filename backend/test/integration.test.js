const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ quiet: true });

test('MySQL + HTTP: canteen workflows in an isolated database', async t => {
  const testDatabase = `canteen_test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  });
  await bootstrap.query(`CREATE DATABASE \`${testDatabase}\` CHARACTER SET utf8mb4`);
  await bootstrap.end();
  if (!/^canteen_test_[0-9]+_[a-f0-9]+$/.test(testDatabase)) throw new Error('Unsafe test database');
  process.env.DB_NAME = testDatabase;
  process.env.UPLOAD_ROOT = require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'canteen-test-uploads-'));
  process.env.CANTEEN_OPEN = '07:00';
  process.env.CANTEEN_CLOSE = '18:00';
  const { migrate } = require('../scripts/migrate');
  const { app, db } = require('../server');
  let server;
  t.after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await db.end(); });
  console.log('Isolated test database (retained):', testDatabase);
  await migrate();
  await migrate(); // Rerun must not reseed or alter existing rows.
  const password = crypto.randomBytes(18).toString('hex');
  const hash = await bcrypt.hash(password, 4);
  const users = {};
  for (const role of ['user', 'staff', 'admin']) {
    const [result] = await db.execute(
      'INSERT INTO accounts(full_name,student_code,email,phone,password,role) VALUES (?,?,?,?,?,?)',
      [`Test ${role}`, role, `${role}@test.invalid`, '0900000000', hash, role]
    );
    users[role] = result.insertId;
  }
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const tokens = {};
  async function call(method, path, role, body) {
    const response = await fetch(base + path, {
      method, headers: { 'Content-Type': 'application/json', ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  }
  for (const role of Object.keys(users)) {
    const result = await call('POST', '/api/login', null, { email: `${role}@test.invalid`, password });
    assert.equal(result.status, 200); tokens[role] = result.data.token;
  }
  const slots = (await call('GET', '/api/pickup-slots', 'user')).data.slots;
  assert.ok(slots.length);
  let foodId;
  await t.test('admin creates food; user/staff cannot manage food or accounts', async () => {
    const body = { name: 'Test food', category: 'Cơm', price: 25000, description: 'Integration test', stock_quantity: 10, image_key: 'com-ga' };
    assert.equal((await call('POST', '/api/admin/foods', 'user', body)).status, 403);
    assert.equal((await call('POST', '/api/admin/foods', 'staff', body)).status, 403);
    assert.equal((await call('GET', '/api/admin/users', 'user')).status, 403);
    assert.equal((await call('GET', '/api/admin/users', 'staff')).status, 403);
    assert.equal((await call('GET', '/api/staff/orders', 'user')).status, 403);
    assert.equal((await call('GET', '/api/orders', null)).status, 401);
    const result = await call('POST', '/api/admin/foods', 'admin', body);
    assert.equal(result.status, 201); foodId = result.data.food.id;
  });
  const stock = async () => Number((await db.execute('SELECT stock_quantity FROM foods WHERE id=?', [foodId]))[0][0].stock_quantity);
  const online = (quantity = 1, requestKey = crypto.randomUUID()) => ({
    orderType: 'online', pickupAt: slots[0], requestKey, expectedTotal: 25000 * quantity, items: [{ foodId, quantity, price: 1 }],
  });
  const counter = quantity => ({ orderType: 'counter', paymentMethod: 'cash', requestKey: crypto.randomUUID(), expectedTotal: 25000 * quantity, items: [{ foodId, quantity }] });
  let pendingId;
  await t.test('registration without student code; demographic validation and old account compatibility', async () => {
    const body = { full_name: 'New account', email: 'new-profile@test.invalid', phone: '0900000000', password, gender: 'male', date_of_birth: '2000-02-29' };
    for (const extra of [{ gender: 'Nam' }, { gender: null }, { date_of_birth: '2025-02-29' }, { date_of_birth: '2000-04-31' }, { date_of_birth: '2999-01-01' }, { date_of_birth: '2000-2-01' }, { date_of_birth: null }]) {
      assert.equal((await call('POST', '/api/register', null, { ...body, ...extra })).status, 400);
    }
    for (const email of [body.email, 'second-profile@test.invalid']) {
      assert.equal((await call('POST', '/api/register', null, { ...body, email })).status, 201);
    }
    const login = await call('POST', '/api/login', null, { email: body.email, password });
    assert.equal(login.status, 200);
    assert.equal(login.data.user.student_code, null);
    assert.equal(login.data.user.date_of_birth, body.date_of_birth);
    assert.equal(login.data.user.gender, 'male');
    tokens.profile = login.data.token;
    const update = await call('PUT', '/api/users/me', 'profile', { full_name: body.full_name, phone: body.phone, gender: 'female', date_of_birth: '1999-12-31' });
    assert.equal(update.status, 200);
    assert.equal(update.data.user.date_of_birth, '1999-12-31');
    assert.equal((await call('GET', '/api/me', 'profile')).data.user.gender, 'female');
    assert.equal((await call('PUT', '/api/users/me', 'profile', { full_name: body.full_name, phone: body.phone, date_of_birth: '2999-01-01' })).status, 400);
    const legacy = await call('PUT', '/api/users/me', 'user', { full_name: 'Test user', phone: body.phone });
    assert.equal(legacy.status, 200);
    assert.equal(legacy.data.user.student_code, 'user');
    assert.equal(legacy.data.user.gender, null);
    assert.equal((await call('PUT', `/api/admin/users/${login.data.user.id}`, 'admin', { full_name: body.full_name, phone: body.phone, email: body.email, student_code: '' })).status, 200);
    const [[stored]] = await db.execute('SELECT student_code, password FROM accounts WHERE id=?', [login.data.user.id]);
    assert.equal(stored.student_code, null);
    assert.notEqual(stored.password, password);
    assert.ok(await bcrypt.compare(password, stored.password));
  });
  await t.test('validation returns 400; concurrent duplicate registration returns 201/409', async () => {
    const valid = { full_name: 'Validation', student_code: 'validation', email: 'validation@test.invalid', phone: '0900000000', password, gender: 'other', date_of_birth: '2000-02-29' };
    for (const body of [[], { ...valid, email: 'invalid' }, { ...valid, full_name: 'x'.repeat(101) }, { ...valid, student_code: 'x'.repeat(21) }]) {
      assert.equal((await call('POST', '/api/register', null, body)).status, 400);
    }
    const results = await Promise.all([1, 2].map(() => call('POST', '/api/register', null, valid)));
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal((await call('PUT', '/api/users/me', 'user', { full_name: 'x'.repeat(101), phone: '0900000000' })).status, 400);
  });
  await t.test('online price mismatch rolls back stock, order and items; retry after lost response uses original price', async () => {
    const before = await stock();
    const [[count]] = await db.query('SELECT COUNT(*) n FROM orders');
    assert.equal((await call('POST', '/api/orders', 'user', { ...online(), expectedTotal: undefined })).status, 400);
    assert.equal((await call('POST', '/api/orders', 'user', { ...online(), expectedTotal: 1 })).status, 409);
    assert.equal(await stock(), before);
    assert.equal((await db.query('SELECT COUNT(*) n FROM orders'))[0][0].n, count.n);
    const body = online();
    // Discard the first HTTP result as if the client lost the response after commit.
    await call('POST', '/api/orders', 'user', body);
    await db.execute('UPDATE foods SET price=26000 WHERE id=?', [foodId]);
    const retry = await call('POST', '/api/orders', 'user', body);
    assert.equal(retry.status, 200);
    assert.equal(retry.data.order.total_amount, 25000);
    assert.equal(await stock(), before - 1);
    await call('PUT', `/api/orders/${retry.data.order.id}/status`, 'user', { status: 'cancelled' });
    await db.execute('UPDATE foods SET price=25000 WHERE id=?', [foodId]);
  });
  await t.test('image upload validates content and authorization; uploaded WebP can be read', async () => {
    const png = await require('sharp')({ create: { width: 8, height: 8, channels: 3, background: '#ffaa00' } }).png().toBuffer();
    async function upload(role, bytes) {
      const form = new FormData(); form.append('image', new Blob([bytes], { type: 'image/png' }), 'test.png');
      return fetch(base + '/api/admin/food-images', { method: 'POST', headers: { Authorization: `Bearer ${tokens[role]}` }, body: form });
    }
    assert.equal((await upload('user', png)).status, 403);
    assert.equal((await upload('staff', png)).status, 403);
    assert.equal((await upload('admin', Buffer.from('not an image'))).status, 415);
    const result = await upload('admin', png); assert.equal(result.status, 201);
    const data = await result.json(); const image = await fetch(base + '/' + data.image_key);
    assert.equal(image.status, 200); assert.match(image.headers.get('content-type'), /image\/webp/);
  });
  await t.test('pickup required, server prices trusted, request retries idempotent', async () => {
    assert.equal((await call('POST', '/api/orders', 'user', { ...online(), pickupAt: '2020-01-01T00:00:00Z' })).status, 400);
    assert.equal((await call('POST', '/api/orders', 'user', counter(1))).status, 403);
    const body = online(2);
    const first = await call('POST', '/api/orders', 'user', body);
    assert.equal(first.status, 201);
    assert.equal(first.data.order.total_amount, 50000);
    assert.equal(first.data.order.delivery_address, null);
    assert.equal(first.data.order.pickup_at, slots[0]);
    pendingId = first.data.order.id;
    assert.equal(first.data.order.is_terminal, false);
    const repeat = await call('POST', '/api/orders', 'user', body);
    assert.equal(repeat.data.order.id, pendingId);
    assert.equal(await stock(), 8);
    assert.equal((await call('POST', '/api/orders', 'user', { ...body, items: [{ foodId, quantity: 3 }] })).status, 409);
  });
  await t.test('concurrent cancellation restores stock exactly once', async () => {
    const outcomes = await Promise.all([1, 2, 3].map(() => call('PUT', `/api/orders/${pendingId}/status`, 'user', { status: 'cancelled' })));
    assert.ok(outcomes.every(r => r.status === 200));
    assert.ok(outcomes.every(r => r.data.order.is_terminal === true));
    assert.ok(outcomes.every(r => r.data.order.cancelled_at));
    assert.equal(new Set(outcomes.map(r => r.data.order.cancelled_at)).size, 1, 'retry preserves original cancellation time');
    assert.ok(outcomes.every(r => r.data.order.cancellation_reason === 'student_cancelled'));
    assert.equal(await stock(), 10);
    assert.equal((await call('PUT', `/api/staff/orders/${pendingId}/status`, 'staff', { status: 'preparing' })).status, 409);
  });
  await t.test('other students cannot read/cancel orders; failed multi-item order rolls back all stock', async () => {
    const registration = await call('POST', '/api/register', null, {
      full_name: 'Other student', student_code: 'other', email: 'other@test.invalid', phone: '0900000002', password, gender: 'female', date_of_birth: '2000-01-01',
    });
    assert.equal(registration.status, 201);
    tokens.other = (await call('POST', '/api/login', null, { email: 'other@test.invalid', password })).data.token;
    assert.equal((await call('GET', `/api/orders/${pendingId}`, 'other')).status, 404);
    assert.equal((await call('PUT', `/api/orders/${pendingId}/status`, 'other', { status: 'cancelled' })).status, 403);
    const before = await stock();
    const body = online();
    body.items.push({ foodId: 2147483647, quantity: 1 });
    assert.equal((await call('POST', '/api/orders', 'user', body)).status, 409);
    assert.equal(await stock(), before);
  });
  await t.test('online and counter concurrent sale cannot oversell', async () => {
    const results = await Promise.all([
      call('POST', '/api/orders', 'user', online(7)),
      call('POST', '/api/orders', 'staff', counter(7)),
    ]);
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    assert.equal(await stock(), 3);
  });
  await t.test('atomic stock adjustment, counter cash, no anonymous student account required', async () => {
    const before = await stock();
    assert.equal((await call('POST', '/api/orders', 'staff', { ...counter(1), expectedTotal: 1 })).status, 409);
    assert.equal(await stock(), before);
    const result = await call('POST', '/api/orders', 'staff', counter(1));
    assert.equal(result.status, 201);
    assert.equal(result.data.order.order_type, 'counter');
    assert.equal(result.data.order.user_id, null);
    assert.equal(result.data.order.status, 'completed');
    assert.equal(result.data.order.cancelled_at, null);
    assert.equal(result.data.order.is_terminal, true);
    assert.equal(result.data.order.payment_status, 'paid');
    assert.equal((await call('PUT', `/api/admin/foods/${foodId}/stock`, 'admin', { delta: -100 })).status, 409);
    assert.equal((await call('PUT', `/api/admin/foods/${foodId}/stock`, 'admin', { delta: 10 })).status, 200);
    assert.equal(await stock(), 12);
  });
  await t.test('legal transitions and prepared cancellation never returns food to stock', async () => {
    const created = await call('POST', '/api/orders', 'user', online());
    const id = created.data.order.id;
    assert.equal((await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'completed', paymentMethod: 'cash' })).status, 409);
    assert.equal((await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'preparing' })).status, 200);
    assert.equal((await call('PUT', `/api/orders/${id}/status`, 'user', { status: 'cancelled' })).status, 409);
    const before = await stock();
    assert.equal((await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'cancelled', reason: 'Food already prepared' })).status, 200);
    assert.equal(await stock(), before);
  });
  await t.test('ready order completion requires cash; no-show requires grace period', async () => {
    const created = await call('POST', '/api/orders', 'user', online());
    const id = created.data.order.id;
    await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'preparing' });
    await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'ready' });
    assert.equal((await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'cancelled', reason: 'no_show' })).status, 409);
    assert.equal((await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'completed' })).status, 400);
    assert.equal((await call('PUT', `/api/staff/orders/${id}/status`, 'staff', { status: 'completed', paymentMethod: 'cash' })).data.order.payment_status, 'paid');
    const late = (await call('POST', '/api/orders', 'user', online())).data.order.id;
    await call('PUT', `/api/staff/orders/${late}/status`, 'staff', { status: 'preparing' });
    await call('PUT', `/api/staff/orders/${late}/status`, 'staff', { status: 'ready' });
    await db.execute('UPDATE orders SET pickup_at=? WHERE id=?', [new Date(Date.now() - 3600000), late]);
    const before = await stock();
    assert.equal((await call('PUT', `/api/staff/orders/${late}/status`, 'staff', { status: 'cancelled', reason: 'no_show' })).status, 200);
    assert.equal(await stock(), before);
  });
  await t.test('concurrent identical requests create only one order', async () => {
    const body = online();
    const before = await stock();
    const results = await Promise.all([1, 2].map(() => call('POST', '/api/orders', 'user', body)));
    assert.ok(results.every(r => [200, 201].includes(r.status)), JSON.stringify(results));
    assert.equal(results[0].data.order.id, results[1].data.order.id);
    assert.equal(await stock(), before - 1);
  });
  await t.test('stopped food invisible to students and cannot be ordered', async () => {
    const food = { name: 'Updated', category: 'Cơm', price: 26000, description: 'Updated description', image_key: 'com-ga', is_active: false };
    assert.equal((await call('PUT', `/api/admin/foods/${foodId}`, 'admin', food)).status, 200);
    assert.ok(!(await call('GET', '/api/foods', 'user')).data.foods.some(f => f.id === foodId));
    assert.ok((await call('GET', '/api/admin/foods', 'admin')).data.foods.some(f => f.id === foodId));
    assert.equal((await call('POST', '/api/orders', 'user', online())).status, 409);
  });
  await t.test('seating endpoints are removed for every role', async () => {
    for (const role of ['user', 'staff', 'admin']) {
      for (const [method, path] of [['GET', '/api/tables'], ['POST', '/api/tables'], ['PUT', '/api/tables/1']]) {
        const response = await fetch(base + path, {
          method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens[role]}` },
          body: method === 'GET' ? undefined : JSON.stringify({ code: 'A01', area: 'A', seats: 4, status: 'available', is_active: true }),
        });
        assert.equal(response.status, 404);
      }
    }
  });
  await t.test('legacy delivery remains labelled accurately and dashboard runs', async () => {
    const [result] = await db.execute(
      "INSERT INTO orders(user_id,customer_name,phone,delivery_address,total_amount,status) VALUES (?,'Old order','0900000000','Old address',25000,'delivering')", [users.user]
    );
    const order = (await call('GET', `/api/orders/${result.insertId}`, 'user')).data.order;
    assert.equal(order.order_type, 'legacy_delivery');
    assert.equal(order.status, 'delivering');
    assert.equal(order.is_terminal, false);
    assert.equal(order.payment_status, 'unknown');
    assert.equal(order.delivery_address, 'Old address');
    assert.equal((await call('GET', '/api/admin/dashboard', 'admin')).status, 200);
  });
  await t.test('account edits, disable revokes login/sessions, admin protected', async () => {
    assert.equal((await call('PUT', `/api/admin/users/${users.user}`, 'admin', { full_name: 'Updated user', student_code: 'user', email: 'user@test.invalid', phone: '0900000001' })).status, 200);
    assert.equal((await call('PUT', `/api/admin/users/${users.admin}/access`, 'admin', { role: 'staff', is_active: false })).status, 409);
    assert.equal((await call('PUT', `/api/admin/users/${users.user}/access`, 'admin', { role: 'staff', is_active: false })).status, 200);
    assert.equal((await call('GET', '/api/orders', 'user')).status, 401);
    assert.equal((await call('POST', '/api/login', null, { email: 'user@test.invalid', password })).status, 401);
    assert.equal((await call('DELETE', `/api/admin/users/${users.user}`, 'admin')).status, 405);
    assert.equal((await call('PUT', `/api/admin/users/${users.user}/access`, 'admin', { role: 'staff', is_active: true })).status, 200);
    const login = await call('POST', '/api/login', null, { email: 'user@test.invalid', password });
    assert.equal(login.data.user.role, 'staff');
  });
  await t.test('expired sessions and explicit logout invalidate authentication', async () => {
    await db.execute('UPDATE auth_sessions SET expires_at=DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE account_id=?', [users.staff]);
    assert.equal((await call('GET', '/api/me', 'staff')).status, 401);
    const login = await call('POST', '/api/login', null, { email: 'staff@test.invalid', password });
    assert.equal(login.status, 200); tokens.staff = login.data.token;
    assert.equal((await call('POST', '/api/logout', 'staff')).status, 200);
    assert.equal((await call('GET', '/api/me', 'staff')).status, 401);
  });
});
