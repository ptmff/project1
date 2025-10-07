// utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Создаем папку для логов
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'defect-tracking-system' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'warn',
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});

// Для разработки добавляем вывод в консоль
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}

// Функция для логирования действий
function logAction(level, message, metadata = {}) {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  };
  logger.log(logEntry);
}

module.exports = { logger, logAction };