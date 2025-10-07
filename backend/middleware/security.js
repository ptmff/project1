// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { logAction } = require('../utils/logger');

/**
 * Rate limiting для защиты от брутфорса
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logAction('warn', 'Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Too many attempts, please try again later.',
    });
  },
});

/**
 * Общий rate limiter для API
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * CSRF защита (для форм, если используются)
 */
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });

/**
 * Логирование подозрительной активности
 */
function securityLogger(req, res, next) {
  // Логируем все неудачные попытки авторизации
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      logAction('warn', 'Unauthorized access attempt', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode,
      });
    }
    return originalJson(data);
  };
  next();
}

/**
 * Проверка SQL injection паттернов
 */
function sqlInjectionProtection(req, res, next) {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(union.*select)/gi,
    /(;|\-\-|\/\*|\*\/)/gi,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) return true;
        } else if (checkValue(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    logAction('error', 'Potential SQL injection detected', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
    });
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
}

/**
 * Защита заголовков с помощью helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Защита от XSS
 */
function xssProtection(req, res, next) {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

/**
 * Валидация Content-Type для POST/PUT/PATCH запросов
 */
function validateContentType(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      logAction('warn', 'Invalid Content-Type', {
        ip: req.ip,
        path: req.path,
        contentType,
      });
      return res.status(400).json({ error: 'Invalid Content-Type. Expected application/json or multipart/form-data' });
    }
  }
  next();
}

/**
 * Защита от parameter pollution
 */
function parameterPollutionProtection(req, res, next) {
  const checkDuplicates = (obj) => {
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (Array.isArray(obj[key]) && !['status', 'priority', 'role'].includes(key)) {
        logAction('warn', 'Parameter pollution detected', {
          ip: req.ip,
          path: req.path,
          key,
          value: obj[key],
        });
        return true;
      }
    }
    return false;
  };

  if (checkDuplicates(req.query) || checkDuplicates(req.body)) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  next();
}

module.exports = {
  authLimiter,
  apiLimiter,
  csrfProtection,
  securityLogger,
  sqlInjectionProtection,
  securityHeaders,
  xssProtection,
  validateContentType,
  parameterPollutionProtection,
};