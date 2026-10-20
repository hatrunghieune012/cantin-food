CREATE TABLE foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(12, 0) NOT NULL,
  description VARCHAR(500) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  image_key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO foods (id, name, category, price, description, stock_quantity, image_key) VALUES
  (1, 'Cơm gà', 'Cơm', 30000, 'Cơm gà chiên kèm rau và nước sốt', 20, 'com-ga'),
  (2, 'Cơm sườn', 'Cơm', 35000, 'Sườn nướng thơm ngon cùng cơm nóng', 12, 'com-suon'),
  (3, 'Mì xào bò', 'Mì', 30000, 'Mì xào bò và rau củ tươi', 0, 'mi-xao-bo'),
  (4, 'Bún thịt nướng', 'Món khác', 30000, 'Bún thịt nướng với rau sống', 3, 'bun-thit-nuong'),
  (5, 'Pepsi', 'Đồ uống', 10000, 'Nước giải khát mát lạnh', 50, 'pepsi'),
  (6, 'Phở bò', 'Món khác', 40000, 'Phở bò nước dùng thơm, ăn kèm rau tươi', 8, 'pho-bo'),
  (7, 'Bánh mì thịt', 'Ăn vặt', 20000, 'Bánh mì giòn với thịt, rau và đồ chua', 4, 'banh-mi');
