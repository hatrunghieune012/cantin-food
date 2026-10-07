ALTER TABLE orders
  ADD COLUMN customer_name VARCHAR(100) NULL AFTER user_id,
  ADD COLUMN note VARCHAR(500) NULL AFTER delivery_address;

UPDATE orders o
JOIN accounts a ON a.id = o.user_id
SET o.customer_name = a.full_name
WHERE o.customer_name IS NULL;

ALTER TABLE orders
  MODIFY COLUMN customer_name VARCHAR(100) NOT NULL,
  MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';

UPDATE orders SET status = 'pending' WHERE status = 'Đang chuẩn bị';
