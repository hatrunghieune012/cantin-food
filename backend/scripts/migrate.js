require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const db = require('../db');

async function migrate() {
  const connection = await db.getConnection();
  try {
    const [[lock]] = await connection.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':migrate'), 10) AS acquired");
    if (!lock.acquired) throw new Error('Một tiến trình migration khác đang chạy.');
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(150) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    const [columns] = await connection.query(
      'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()'
    );
    const has = (table, column) => columns.some(c => c.TABLE_NAME === table && c.COLUMN_NAME === column);
    // Adopt only fully present historical migrations. Never rerun their seed data.
    const historical = {
      '000_create_accounts.sql': has('accounts', 'password'),
      '001_add_account_role.sql': has('accounts', 'role'),
      '002_add_phone_and_orders.sql': has('accounts', 'phone') && has('orders', 'user_id') && has('order_items', 'quantity'),
      '003_complete_order_fields.sql': has('orders', 'customer_name') && has('orders', 'note'),
      '004_add_default_address.sql': has('accounts', 'default_address'),
      '005_create_foods.sql': has('foods', 'stock_quantity'),
      '006_create_auth_sessions.sql': has('auth_sessions', 'token_hash'),
    };
    for (const [name, exists] of Object.entries(historical)) {
      if (exists) await connection.execute('INSERT IGNORE INTO schema_migrations(name) VALUES (?)', [name]);
    }
    const [applied] = await connection.query('SELECT name FROM schema_migrations');
    const directory = path.join(__dirname, '../migrations');
    for (const name of fs.readdirSync(directory).filter(n => /^\d+.*\.sql$/.test(n)).sort()) {
      if (applied.some(row => row.name === name)) continue;
      console.log('Applying', name);
      // MySQL DDL commits implicitly. Stop on any failure; do not mark partial migrations applied.
      const sql = fs.readFileSync(path.join(directory, name), 'utf8').replace(/^--.*$/gm, '');
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) {
        await connection.query(statement);
      }
      await connection.execute('INSERT INTO schema_migrations(name) VALUES (?)', [name]);
    }
  } finally {
    await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':migrate'))");
    connection.release();
  }
}

if (require.main === module) {
  migrate().catch(error => { console.error('Migration thất bại:', error.message); process.exitCode = 1; })
    .finally(() => db.end());
}
module.exports = { migrate };
