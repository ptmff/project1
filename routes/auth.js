// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // валидация роли — допускаем только перечисленные значения
    const allowedRoles = ['manager', 'engineer', 'observer'];
    const finalRole = allowedRoles.includes(role) ? role : 'observer';

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: finalRole,
    });

    return res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Authentication failed' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Authentication failed' });

    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

    return res.status(200).json({ token, expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
