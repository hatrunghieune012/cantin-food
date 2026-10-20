ALTER TABLE accounts
  ADD COLUMN default_address VARCHAR(255) NULL AFTER phone;

UPDATE orders SET status = 'preparing' WHERE status = 'confirmed';
