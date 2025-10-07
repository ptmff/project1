// routes/stages.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const { Stage, Project, Defect } = require('../models');
const { logAction } = require('../utils/logger');
const { sanitizeInput } = require('../utils/validation');

// Получить все этапы проекта
router.get('/project/:projectId', verifyToken, async (req, res) => {
  try {
    const stages = await Stage.findAll({
      where: { projectId: req.params.projectId },
      include: [
        {
          model: Defect,
          as: 'defects',
          attributes: ['id', 'title', 'status', 'priority'],
        },
      ],
      order: [['order', 'ASC']],
    });

    return res.status(200).json({ stages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stages' });
  }
});

// Получить один этап
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const stage = await Stage.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Defect, as: 'defects' },
      ],
    });

    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    return res.status(200).json(stage);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stage' });
  }
});

// Создать новый этап (только менеджеры)
router.post('/', verifyToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const { projectId, name, description, order, status } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({ error: 'Project ID and name are required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    const stage = await Stage.create({
      projectId,
      name: sanitizedName,
      description: sanitizedDescription,
      order: order || 0,
      status: status || 'pending',
    });

    logAction('info', 'Stage created', { stageId: stage.id, projectId, userId: req.user.id });

    return res.status(201).json({ message: 'Stage created successfully', stage });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to create stage', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to create stage' });
  }
});

// Обновить этап (только менеджеры)
router.put('/:id', verifyToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const stage = await Stage.findByPk(req.params.id);
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    const { name, description, order, status } = req.body;

    if (name) stage.name = sanitizeInput(name);
    if (description !== undefined) stage.description = description ? sanitizeInput(description) : null;
    if (order !== undefined) stage.order = order;
    if (status) stage.status = status;

    await stage.save();

    logAction('info', 'Stage updated', { stageId: stage.id, userId: req.user.id });

    return res.status(200).json({ message: 'Stage updated successfully', stage });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to update stage', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to update stage' });
  }
});

// Удалить этап (только менеджеры)
router.delete('/:id', verifyToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const stage = await Stage.findByPk(req.params.id);
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Проверяем, есть ли дефекты, связанные с этапом
    const defectsCount = await Defect.count({ where: { stageId: req.params.id } });
    if (defectsCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete stage with associated defects. Please reassign or delete defects first.',
      });
    }

    await stage.destroy();

    logAction('warn', 'Stage deleted', { stageId: req.params.id, userId: req.user.id });

    return res.status(200).json({ message: 'Stage deleted successfully' });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to delete stage', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to delete stage' });
  }
});

module.exports = router;