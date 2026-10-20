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
  process.env.DB_NAME = testDatabase;
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
    orderType: 'online', pickupAt: slots[0], requestKey, items: [{ foodId, quantity, price: 1 }],
  });
  const counter = quantity => ({ orderType: 'counter', paymentMethod: 'cash', requestKey: crypto.randomUUID(), expectedTotal: 25000 * quantity, items: [{ foodId, quantity }] });
  let pendingId;
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
    const repeat = await call('POST', '/api/orders', 'user', body);
    assert.equal(repeat.data.order.id, pendingId);
    assert.equal(await stock(), 8);
    assert.equal((await call('POST', '/api/orders', 'user', { ...body, items: [{ foodId, quantity: 3 }] })).status, 409);
  });
  await t.test('concurrent cancellation restores stock exactly once', async () => {
    const outcomes = await Promise.all([1, 2, 3].map(() => call('PUT', `/api/orders/${pendingId}/status`, 'user', { status: 'cancelled' })));
    assert.ok(outcomes.every(r => r.status === 200));
    assert.equal(await stock(), 10);
    assert.equal((await call('PUT', `/api/staff/orders/${pendingId}/status`, 'staff', { status: 'preparing' })).status, 409);
  });
  await t.test('other students cannot read/cancel orders; failed multi-item order rolls back all stock', async () => {
    const registration = await call('POST', '/api/register', null, {
      full_name: 'Other student', student_code: 'other', email: 'other@test.invalid', phone: '0900000002', password,
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
  await t.test('table CRUD and read-only student access', async () => {
    const table = { code: 'A01', area: 'A', seats: 4, status: 'available', is_active: true };
    assert.equal((await call('POST', '/api/tables', 'user', table)).status, 403);
    const created = await call('POST', '/api/tables', 'staff', table);
    assert.equal(created.status, 201);
    const id = created.data.id;
    assert.equal((await call('PUT', `/api/tables/${id}`, 'user', table)).status, 403);
    assert.equal((await call('PUT', `/api/tables/${id}`, 'staff', { ...table, status: 'occupied' })).status, 200);
    assert.equal((await call('GET', '/api/tables', 'user')).data.tables[0].status, 'occupied');
    await call('PUT', `/api/tables/${id}`, 'admin', { ...table, is_active: false });
    assert.equal((await call('GET', '/api/tables', 'user')).data.tables.length, 0);
    assert.equal((await call('GET', '/api/tables', 'staff')).data.tables.length, 1);
  });
  await t.test('legacy delivery remains labelled accurately and dashboard runs', async () => {
    const [result] = await db.execute(
      "INSERT INTO orders(user_id,customer_name,phone,delivery_address,total_amount,status) VALUES (?,'Old order','0900000000','Old address',25000,'delivering')", [users.user]
    );
    const order = (await call('GET', `/api/orders/${result.insertId}`, 'user')).data.order;
    assert.equal(order.order_type, 'legacy_delivery');
    assert.equal(order.status, 'delivering');
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
});
