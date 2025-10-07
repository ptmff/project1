// routes/projects.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const { Project, Stage, User, Defect } = require('../models');
const { logAction } = require('../utils/logger');
const { sanitizeInput } = require('../utils/validation');

// Получить все проекты (с фильтрацией и пагинацией)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: projects, count } = await Project.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: Stage, as: 'stages', attributes: ['id', 'name', 'status'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      projects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to fetch projects', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Получить один проект по ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'role'] },
        { model: Stage, as: 'stages', order: [['order', 'ASC']] },
      ],
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Создать новый проект (только менеджеры)
router.post('/', verifyToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const { name, description, status, startDate, endDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    const project = await Project.create({
      name: sanitizedName,
      description: sanitizedDescription,
      status: status || 'planning',
      startDate: startDate || null,
      endDate: endDate || null,
      createdBy: req.user.id,
    });

    logAction('info', 'Project created', { projectId: project.id, userId: req.user.id });

    return res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to create project', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// Обновить проект (только менеджеры)
router.put('/:id', verifyToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description, status, startDate, endDate } = req.body;

    if (name) project.name = sanitizeInput(name);
    if (description !== undefined) project.description = description ? sanitizeInput(description) : null;
    if (status) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;

    await project.save();

    logAction('info', 'Project updated', { projectId: project.id, userId: req.user.id });

    return res.status(200).json({ message: 'Project updated successfully', project });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to update project', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// Удалить проект (только менеджеры)
router.delete('/:id', verifyToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();

    logAction('warn', 'Project deleted', { projectId: req.params.id, userId: req.user.id });

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to delete project', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Получить статистику проекта
router.get('/:id/stats', verifyToken, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const totalDefects = await Defect.count({ where: { projectId: req.params.id } });
    const defectsByStatus = await Defect.findAll({
      where: { projectId: req.params.id },
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const defectsByPriority = await Defect.findAll({
      where: { projectId: req.params.id },
      attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['priority'],
      raw: true,
    });

    return res.status(200).json({
      totalDefects,
      byStatus: defectsByStatus,
      byPriority: defectsByPriority,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

module.exports = router;