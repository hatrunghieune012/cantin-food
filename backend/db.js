const mysql = require('mysql2/promise');

// Pool quản lý và tái sử dụng các kết nối tới MySQL.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: '+07:00',
  waitForConnections: true,
  connectionLimit: 10,
});

// Match DATETIME pickup/payment values and historical local-time sessions.
db.on('connection', connection => {
  connection.query("SET time_zone = '+07:00'", error => {
    if (error) connection.destroy();
  });
});

module.exports = db;
