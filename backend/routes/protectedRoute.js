// routes/protectedRoute.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');

// Доступен для всех авторизованных пользователей
router.get('/me', verifyToken, (req, res) => {
  return res.status(200).json({ message: 'Authenticated', user: req.user });
});

// Только для менеджеров
router.get('/manager-area', verifyToken, authorizeRoles('manager'), (req, res) => {
  return res.status(200).json({ message: 'Hello manager — access granted' });
});

// Для менеджеров и инженеров
router.get('/work-area', verifyToken, authorizeRoles('manager', 'engineer'), (req, res) => {
  return res.status(200).json({ message: 'Hello manager or engineer — access granted' });
});

// Для только наблюдателей (observer) — пример
router.get('/observer-area', verifyToken, authorizeRoles('observer'), (req, res) => {
  return res.status(200).json({ message: 'Hello observer — read-only access' });
});

module.exports = router;
