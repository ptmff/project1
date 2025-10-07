// routes/uploads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const { Attachment, Defect } = require('../models');
const { logAction } = require('../utils/logger');

// Создаем папку для загрузок, если её нет
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Фильтр файлов - разрешаем только определенные типы
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB максимум
  },
});

// Загрузить файл к дефекту
router.post('/defect/:defectId', verifyToken, authorizeRoles('manager', 'engineer'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const defect = await Defect.findByPk(req.params.defectId);
    if (!defect) {
      // Удаляем загруженный файл, если дефект не найден
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Defect not found' });
    }

    const attachment = await Attachment.create({
      defectId: req.params.defectId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user.id,
    });

    logAction('info', 'File uploaded', {
      attachmentId: attachment.id,
      defectId: req.params.defectId,
      userId: req.user.id,
      filename: req.file.originalname,
    });

    return res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        id: attachment.id,
        filename: attachment.originalName,
        size: attachment.size,
        mimeType: attachment.mimeType,
      },
    });
  } catch (err) {
    console.error(err);
    // Удаляем файл при ошибке
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    logAction('error', 'File upload failed', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Скачать файл
router.get('/:attachmentId', verifyToken, async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(attachment.path, attachment.originalName);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to download file' });
  }
});

// Удалить файл (только менеджеры и загрузивший пользователь)
router.delete('/:attachmentId', verifyToken, async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Проверяем права: либо менеджер, либо тот, кто загрузил
    if (req.user.role !== 'manager' && attachment.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only delete your own attachments.' });
    }

    // Удаляем файл с диска
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    await attachment.destroy();

    logAction('warn', 'Attachment deleted', {
      attachmentId: req.params.attachmentId,
      userId: req.user.id,
    });

    return res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to delete attachment', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Получить все вложения дефекта
router.get('/defect/:defectId/list', verifyToken, async (req, res) => {
  try {
    const attachments = await Attachment.findAll({
      where: { defectId: req.params.defectId },
      attributes: ['id', 'originalName', 'mimeType', 'size', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ attachments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

module.exports = router;