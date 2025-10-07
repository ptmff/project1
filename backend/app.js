// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const sequelize = require('./db');

// Импорт моделей для установки связей
const models = require('./models');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protectedRoute');
const projectRoutes = require('./routes/projects');
const stageRoutes = require('./routes/stages');
const defectRoutes = require('./routes/defects');
const uploadRoutes = require('./routes/uploads');
const reportRoutes = require('./routes/reports');

// Импорт middleware безопасности
const {
  apiLimiter,
  securityLogger,
  sqlInjectionProtection,
  securityHeaders,
  xssProtection,
  validateContentType,
  parameterPollutionProtection,
} = require('./middleware/security');

const { logger, logAction } = require('./utils/logger');

// Middleware безопасности
app.use(securityHeaders);
app.use(xssProtection);
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
  logAction('info', 'Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Применяем защитные middleware
app.use(securityLogger);
app.use(sqlInjectionProtection);
app.use(validateContentType);
app.use(parameterPollutionProtection);

// Rate limiting для всех API запросов
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/defects', defectRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  logAction('warn', '404 Not Found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logAction('error', 'Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Не отправляем stack trace в production
  const errorResponse = {
    error: err.message || 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logAction('info', 'SIGTERM received, shutting down gracefully');
  try {
    await sequelize.close();
    logAction('info', 'Database connection closed');
    process.exit(0);
  } catch (err) {
    logAction('error', 'Error during shutdown', { error: err.message });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logAction('info', 'SIGINT received, shutting down gracefully');
  try {
    await sequelize.close();
    logAction('info', 'Database connection closed');
    process.exit(0);
  } catch (err) {
    logAction('error', 'Error during shutdown', { error: err.message });
    process.exit(1);
  }
});

// Синхронизация БД и запуск сервера
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');
    logAction('info', 'Database connected');

    // В production используйте миграции вместо sync!
    // Для dev можно использовать { alter: true }
    if (process.env.NODE_ENV === 'production') {
      console.log('Running in production mode - skipping sync');
    } else {
      await sequelize.sync({ alter: true });
      console.log('✓ Database synchronized');
      logAction('info', 'Database synchronized');
    }

    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
      logAction('info', 'Server started', { port: PORT });
    });
  } catch (err) {
    console.error('✗ Unable to start server:', err.message);
    logAction('error', 'Server startup failed', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();

module.exports = app;