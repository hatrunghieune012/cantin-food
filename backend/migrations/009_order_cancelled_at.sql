-- Historical cancellations have no known timestamp; leave them NULL.
ALTER TABLE orders ADD COLUMN cancelled_at DATETIME NULL;
