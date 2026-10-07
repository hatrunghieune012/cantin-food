require('dotenv').config();

const bcrypt = require('bcrypt');
const db = require('../db');

async function createAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const studentCode = process.env.ADMIN_STUDENT_CODE?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !studentCode || !email || !password) {
    throw new Error('Cần đặt đủ ADMIN_NAME, ADMIN_STUDENT_CODE, ADMIN_EMAIL và ADMIN_PASSWORD');
  }

  const [existingAccounts] = await db.execute(
    'SELECT id FROM accounts WHERE student_code = ? OR LOWER(email) = ?',
    [studentCode, email]
  );

  if (existingAccounts.length > 0) {
    throw new Error('Email hoặc mã tài khoản Admin đã tồn tại');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.execute(
    "INSERT INTO accounts (full_name, student_code, email, password, role) VALUES (?, ?, ?, ?, 'admin')",
    [name, studentCode, email, passwordHash]
  );

  console.log(`Đã tạo tài khoản Admin: ${email}`);
}

createAdmin()
  .catch((error) => {
    console.error('Không thể tạo Admin:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
