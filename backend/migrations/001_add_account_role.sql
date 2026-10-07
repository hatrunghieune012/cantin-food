ALTER TABLE accounts
  ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';
