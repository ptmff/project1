// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

async function verifyToken(req, res, next) {
  const authHeader = req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // можно опционально подгрузить пользователя из БД (чтобы проверить, что он всё ещё активен)
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Invalid token: user does not exist.' });

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = verifyToken;
