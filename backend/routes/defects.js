// routes/defects.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const { Defect, Project, Stage, User, Comment, Attachment, ChangeHistory } = require('../models');
const { logAction } = require('../utils/logger');
const { sanitizeInput } = require('../utils/validation');
const { trackChange } = require('../utils/changeTracker');

// Получить все дефекты с фильтрацией, сортировкой и пагинацией
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      projectId,
      stageId,
      status,
      priority,
      assigneeId,
      reporterId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (stageId) where.stageId = stageId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (reporterId) where.reporterId = reporterId;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const validSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'dueDate', 'title'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows: defects, count } = await Defect.findAndCountAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Stage, as: 'stage', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'username'] },
        { model: User, as: 'reporter', attributes: ['id', 'username'] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[orderField, orderDirection]],
    });

    return res.status(200).json({
      defects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to fetch defects', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch defects' });
  }
});

// Получить один дефект по ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const defect = await Defect.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Stage, as: 'stage', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'role'] },
        { model: User, as: 'reporter', attributes: ['id', 'username', 'role'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
          order: [['createdAt', 'DESC']],
        },
        {
          model: Attachment,
          as: 'attachments',
          include: [{ model: User, as: 'uploader', attributes: ['id', 'username'] }],
        },
        {
          model: ChangeHistory,
          as: 'history',
          include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
          order: [['createdAt', 'DESC']],
          limit: 50,
        },
      ],
    });

    if (!defect) {
      return res.status(404).json({ error: 'Defect not found' });
    }

    return res.status(200).json(defect);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch defect' });
  }
});

// Создать новый дефект (менеджеры и инженеры)
router.post('/', verifyToken, authorizeRoles('manager', 'engineer'), async (req, res) => {
  try {
    const { projectId, stageId, title, description, priority, assigneeId, dueDate } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'Project ID and title are required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (assigneeId) {
      const assignee = await User.findByPk(assigneeId);
      if (!assignee) {
        return res.status(404).json({ error: 'Assignee not found' });
      }
    }

    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    const defect = await Defect.create({
      projectId,
      stageId: stageId || null,
      title: sanitizedTitle,
      description: sanitizedDescription,
      priority: priority || 'medium',
      status: 'new',
      assigneeId: assigneeId || null,
      reporterId: req.user.id,
      dueDate: dueDate || null,
    });

    await trackChange(defect.id, req.user.id, 'status', null, 'new', 'created');

    logAction('info', 'Defect created', { defectId: defect.id, userId: req.user.id });

    const createdDefect = await Defect.findByPk(defect.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'username'] },
        { model: User, as: 'reporter', attributes: ['id', 'username'] },
      ],
    });

    return res.status(201).json({ message: 'Defect created successfully', defect: createdDefect });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to create defect', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to create defect' });
  }
});

// Обновить дефект (менеджеры и инженеры)
router.put('/:id', verifyToken, authorizeRoles('manager', 'engineer'), async (req, res) => {
  try {
    const defect = await Defect.findByPk(req.params.id);
    if (!defect) {
      return res.status(404).json({ error: 'Defect not found' });
    }

    const { title, description, priority, status, assigneeId, dueDate, stageId } = req.body;

    // Отслеживание изменений
    if (title && title !== defect.title) {
      await trackChange(defect.id, req.user.id, 'title', defect.title, sanitizeInput(title));
      defect.title = sanitizeInput(title);
    }

    if (description !== undefined && description !== defect.description) {
      await trackChange(defect.id, req.user.id, 'description', defect.description, description ? sanitizeInput(description) : null);
      defect.description = description ? sanitizeInput(description) : null;
    }

    if (priority && priority !== defect.priority) {
      await trackChange(defect.id, req.user.id, 'priority', defect.priority, priority);
      defect.priority = priority;
    }

    if (status && status !== defect.status) {
      const validTransitions = {
        new: ['in_progress', 'cancelled'],
        in_progress: ['review', 'new', 'cancelled'],
        review: ['closed', 'in_progress'],
        closed: [],
        cancelled: [],
      };

      if (!validTransitions[defect.status].includes(status)) {
        return res.status(400).json({ error: `Invalid status transition from ${defect.status} to ${status}` });
      }

      await trackChange(defect.id, req.user.id, 'status', defect.status, status);
      defect.status = status;

      if (status === 'closed') {
        defect.resolvedAt = new Date();
      }
    }

    if (assigneeId !== undefined && assigneeId !== defect.assigneeId) {
      const oldAssignee = defect.assigneeId ? (await User.findByPk(defect.assigneeId))?.username : 'Unassigned';
      const newAssignee = assigneeId ? (await User.findByPk(assigneeId))?.username : 'Unassigned';
      await trackChange(defect.id, req.user.id, 'assigneeId', oldAssignee, newAssignee);
      defect.assigneeId = assigneeId;
    }

    if (dueDate !== undefined && dueDate !== defect.dueDate) {
      await trackChange(defect.id, req.user.id, 'dueDate', defect.dueDate, dueDate);
      defect.dueDate = dueDate;
    }

    if (stageId !== undefined && stageId !== defect.stageId) {
      await trackChange(defect.id, req.user.id, 'stageId', defect.stageId, stageId);
      defect.stageId = stageId;
    }

    await defect.save();

    logAction('info', 'Defect updated', { defectId: defect.id, userId: req.user.id });

    const updatedDefect = await Defect.findByPk(defect.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'username'] },
        { model: User, as: 'reporter', attributes: ['id', 'username'] },
      ],
    });

    return res.status(200).json({ message: 'Defect updated successfully', defect: updatedDefect });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to update defect', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to update defect' });
  }
});

// Удалить дефект (только менеджеры)
router.delete('/:id', verifyToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const defect = await Defect.findByPk(req.params.id);
    if (!defect) {
      return res.status(404).json({ error: 'Defect not found' });
    }

    await defect.destroy();

    logAction('warn', 'Defect deleted', { defectId: req.params.id, userId: req.user.id });

    return res.status(200).json({ message: 'Defect deleted successfully' });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to delete defect', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to delete defect' });
  }
});

// Добавить комментарий к дефекту
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const defect = await Defect.findByPk(req.params.id);
    if (!defect) {
      return res.status(404).json({ error: 'Defect not found' });
    }

    const sanitizedContent = sanitizeInput(content);

    const comment = await Comment.create({
      defectId: req.params.id,
      userId: req.user.id,
      content: sanitizedContent,
    });

    const createdComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
    });

    logAction('info', 'Comment added', { defectId: req.params.id, commentId: comment.id, userId: req.user.id });

    return res.status(201).json({ message: 'Comment added successfully', comment: createdComment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Получить историю изменений дефекта
router.get('/:id/history', verifyToken, async (req, res) => {
  try {
    const defect = await Defect.findByPk(req.params.id);
    if (!defect) {
      return res.status(404).json({ error: 'Defect not found' });
    }

    const history = await ChangeHistory.findAll({
      where: { defectId: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ history });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;