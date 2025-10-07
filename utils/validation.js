// utils/validation.js
const validator = require('validator');

/**
 * Санитизация входных данных от XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Удаляем HTML теги и экранируем спецсимволы
  let sanitized = validator.escape(input.trim());
  
  // Дополнительная очистка от потенциально опасных паттернов
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized;
}

/**
 * Валидация email
 */
function isValidEmail(email) {
  return validator.isEmail(email);
}

/**
 * Валидация UUID
 */
function isValidUUID(uuid) {
  return validator.isUUID(uuid);
}

/**
 * Валидация даты
 */
function isValidDate(date) {
  return validator.isISO8601(date);
}

module.exports = {
  sanitizeInput,
  isValidEmail,
  isValidUUID,
  isValidDate,
};