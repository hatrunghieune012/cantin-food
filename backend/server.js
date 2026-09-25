// Import thu vien Express de tao API server
const express = require("express");

// Tao ung dung Express
const app = express();

// Cho phep server doc du lieu JSON trong request body
app.use(express.json());

// Danh sach mon an tam thoi, du lieu se mat khi tat server
let foods = [
  {
    id: 1,
    name: "Cơm gà",
    price: 30000,
    description: "Cơm gà chiên kèm rau và nước sốt"
  },
  {
    id: 2,
    name: "Cơm sườn",
    price: 35000,
    description: "Sườn nướng thơm ngon cùng cơm nóng"
  },
  {
    id: 3,
    name: "Mì xào bò",
    price: 30000,
    description: "Mì xào bò và rau củ tươi"
  }
];

// API GET - lấy toàn bộ danh sách món ăn
app.get("/foods", (req, res) => {
  res.json(foods);
});

// API POST - thêm một món ăn mới
app.post("/foods", (req, res) => {
  const newFood = {
    id: foods.length > 0 ? foods[foods.length - 1].id + 1 : 1,
    name: req.body.name,
    price: req.body.price,
    description: req.body.description
  };

  foods.push(newFood);
  res.status(201).json(newFood);
});

// API PUT - cập nhật món ăn có id tương ứng
app.put("/foods/:id", (req, res) => {
  const foodId = Number(req.params.id);
  const food = foods.find((item) => item.id === foodId);

  if (!food) {
    return res.status(404).json({ message: "Không tìm thấy món ăn" });
  }

  food.name = req.body.name;
  food.price = req.body.price;
  food.description = req.body.description;

  res.json(food);
});

// API DELETE - xóa món ăn có id tương ứng
app.delete("/foods/:id", (req, res) => {
  const foodId = Number(req.params.id);
  const foodIndex = foods.findIndex((item) => item.id === foodId);

  if (foodIndex === -1) {
    return res.status(404).json({ message: "Không tìm thấy món ăn" });
  }

  foods.splice(foodIndex, 1);
  res.json({ message: "Đã xóa món ăn" });
});

// Khởi động server tại cổng 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
