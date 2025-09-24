// app.js
require('dotenv').config();
const express = require('express');
const app = express();
const sequelize = require('./db');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protectedRoute');
const User = require('./models/User');

app.use(express.json());

// маршруты
app.use('/auth', authRoutes);
app.use('/protected', protectedRoutes);

// синхронизация БД и запуск сервера
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    // Опция { alter: true } обновит таблицу под модель (в dev). В проде используйте миграции!
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();
