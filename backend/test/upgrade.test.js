const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
require('dotenv').config({ quiet: true });

test('upgrade preserves all historical order fields and does not restore old cancellations', async () => {
  const database = `canteen_test_upgrade_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  });
  try {
    await c.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`);
    await c.query(`USE \`${database}\``);
    const dir = path.join(__dirname, '../migrations');
    async function apply(file) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8').replace(/^--.*$/gm, '');
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await c.query(statement);
    }
    for (const file of fs.readdirSync(dir).filter(f => /^00[0-6]_/.test(f)).sort()) await apply(file);
    await c.query("INSERT INTO accounts(full_name,student_code,email,password) VALUES ('Legacy','legacy','legacy@test.invalid','test-only-unused-hash')");
    for (const status of ['pending', 'preparing', 'delivering', 'completed', 'cancelled']) {
      await c.execute("INSERT INTO orders(user_id,customer_name,phone,delivery_address,total_amount,status) VALUES (1,'Legacy','0900000000','Historical address',30000,?)", [status]);
    }
    const [before] = await c.query('SELECT * FROM orders ORDER BY id');
    const [stockBefore] = await c.query('SELECT id,stock_quantity FROM foods ORDER BY id');
    await apply('007_canteen_operations.sql');
    const [[accountBefore]] = await c.query('SELECT * FROM accounts WHERE id=1');
    await apply('008_account_demographics.sql');
    await apply('009_order_cancelled_at.sql');
    const [[accountAfter]] = await c.query('SELECT * FROM accounts WHERE id=1');
    for (const key of Object.keys(accountBefore)) assert.deepEqual(accountAfter[key], accountBefore[key], key);
    assert.equal(accountAfter.gender, null);
    assert.equal(accountAfter.date_of_birth, null);
    const [after] = await c.query('SELECT * FROM orders ORDER BY id');
    for (let i = 0; i < before.length; i++) {
      for (const key of Object.keys(before[i])) assert.deepEqual(after[i][key], before[i][key], key);
      assert.equal(after[i].order_type, 'legacy_delivery');
      assert.equal(after[i].payment_status, 'unknown');
      assert.equal(after[i].stock_restored, 0);
      assert.equal(after[i].cancelled_at, null);
    }
    assert.deepEqual((await c.query('SELECT id,stock_quantity FROM foods ORDER BY id'))[0], stockBefore);
    console.log('Upgrade test database (retained):', database);
  } finally { await c.end(); }
});
