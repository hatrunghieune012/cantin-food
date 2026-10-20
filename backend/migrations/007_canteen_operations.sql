-- Existing orders remain legacy_delivery with their original status/address.
-- Never infer payment or restore stock for previously cancelled orders.
ALTER TABLE accounts
  MODIFY role ENUM('user','staff','admin') NOT NULL DEFAULT 'user',
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE foods
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD CONSTRAINT chk_food_stock CHECK (stock_quantity >= 0),
  ADD CONSTRAINT chk_food_price CHECK (price > 0);
ALTER TABLE orders
  MODIFY user_id INT NULL,
  MODIFY phone VARCHAR(20) NULL,
  MODIFY delivery_address VARCHAR(255) NULL,
  ADD COLUMN order_type ENUM('legacy_delivery','online','counter') NOT NULL DEFAULT 'legacy_delivery',
  ADD COLUMN pickup_at DATETIME NULL,
  ADD COLUMN payment_method ENUM('cash') NULL,
  ADD COLUMN payment_status ENUM('unknown','unpaid','paid') NOT NULL DEFAULT 'unknown',
  ADD COLUMN paid_at DATETIME NULL,
  ADD COLUMN handled_by INT NULL,
  ADD COLUMN cancellation_reason VARCHAR(255) NULL,
  ADD COLUMN stock_restored BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN request_key VARCHAR(100) NULL,
  ADD COLUMN request_hash CHAR(64) NULL,
  ADD UNIQUE KEY uq_order_request (request_key),
  ADD INDEX idx_order_status_pickup (status, pickup_at),
  ADD INDEX idx_order_paid (payment_status, paid_at),
  ADD CONSTRAINT fk_order_handler FOREIGN KEY (handled_by) REFERENCES accounts(id);
CREATE TABLE canteen_tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  area VARCHAR(100) NOT NULL,
  seats INT NOT NULL,
  status ENUM('available','occupied','unknown') NOT NULL DEFAULT 'unknown',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT NULL,
  CONSTRAINT chk_table_seats CHECK (seats BETWEEN 1 AND 100),
  CONSTRAINT fk_table_updater FOREIGN KEY (updated_by) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
