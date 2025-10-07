// routes/reports.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const verifyToken = require('../middleware/authMiddleware');
const { Defect, Project, User, ChangeHistory } = require('../models');
const { logAction } = require('../utils/logger');
const { exportToCSV, exportToExcel } = require('../utils/exportUtils');
const sequelize = require('../db');

// Общая статистика по дефектам
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const totalDefects = await Defect.count({ where });

    const byStatus = await Defect.findAll({
      where,
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const byPriority = await Defect.findAll({
      where,
      attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['priority'],
      raw: true,
    });

    const byAssignee = await Defect.findAll({
      where,
      attributes: [
        'assigneeId',
        [sequelize.fn('COUNT', sequelize.col('Defect.id')), 'count'],
      ],
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['username'],
        },
      ],
      group: ['assigneeId', 'assignee.id', 'assignee.username'],
      raw: true,
    });

    const resolvedDefects = await Defect.count({
      where: { ...where, status: 'closed' },
    });

    const overdue = await Defect.count({
      where: {
        ...where,
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.notIn]: ['closed', 'cancelled'] },
      },
    });

    return res.status(200).json({
      total: totalDefects,
      resolved: resolvedDefects,
      overdue,
      byStatus,
      byPriority,
      byAssignee,
    });
  } catch (err) {
    console.error(err);
    logAction('error', 'Failed to fetch statistics', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Временная аналитика (тренды)
router.get('/trends', verifyToken, async (req, res) => {
  try {
    const { projectId, period = 'week' } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;

    // Определяем период
    let dateFormat;
    let startDate = new Date();

    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD HH24';
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'week':
        dateFormat = 'YYYY-MM-DD';
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        startDate.setMonth(startDate.getMonth() - 12);
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        startDate.setDate(startDate.getDate() - 30);
    }

    where.createdAt = { [Op.gte]: startDate };

    const createdTrend = await Defect.findAll({
      where,
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('createdAt'), dateFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('TO_CHAR', sequelize.col('createdAt'), dateFormat)],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('createdAt'), dateFormat), 'ASC']],
      raw: true,
    });

    const resolvedWhere = { ...where, status: 'closed' };
    const resolvedTrend = await Defect.findAll({
      where: resolvedWhere,
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('resolvedAt'), dateFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('TO_CHAR', sequelize.col('resolvedAt'), dateFormat)],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('resolvedAt'), dateFormat), 'ASC']],
      raw: true,
    });

    return res.status(200).json({
      created: createdTrend,
      resolved: resolvedTrend,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Производительность команды
router.get('/team-performance', verifyToken, async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const performance = await Defect.findAll({
      where,
      attributes: [
        'assigneeId',
        [sequelize.fn('COUNT', sequelize.col('Defect.id')), 'totalAssigned'],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'closed' THEN 1 END")
          ),
          'completed',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'in_progress' THEN 1 END")
          ),
          'inProgress',
        ],
        [
          sequelize.fn(
            'AVG',
            sequelize.literal(
              "CASE WHEN status = 'closed' THEN EXTRACT(EPOCH FROM (\"resolvedAt\" - \"createdAt\"))/86400 END"
            )
          ),
          'avgResolutionDays',
        ],
      ],
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'role'],
        },
      ],
      group: ['assigneeId', 'assignee.id', 'assignee.username', 'assignee.role'],
      raw: true,
    });

    return res.status(200).json({ performance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch team performance' });
  }
});

// Экспорт в CSV
router.get('/export/csv', verifyToken, async (req, res) => {
  try {
    const { projectId, status, priority, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const defects = await Defect.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['name'] },
        { model: User, as: 'assignee', attributes: ['username'] },
        { model: User, as: 'reporter', attributes: ['username'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const csv = exportToCSV(defects);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=defects_${Date.now()}.csv`);
    
    logAction('info', 'CSV export', { userId: req.user.id, count: defects.length });

    return res.send(csv);
  } catch (err) {
    console.error(err);
    logAction('error', 'CSV export failed', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Экспорт в Excel
router.get('/export/excel', verifyToken, async (req, res) => {
  try {
    const { projectId, status, priority, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const defects = await Defect.findAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['name'] },
        { model: User, as: 'assignee', attributes: ['username'] },
        { model: User, as: 'reporter', attributes: ['username'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const buffer = await exportToExcel(defects);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=defects_${Date.now()}.xlsx`);

    logAction('info', 'Excel export', { userId: req.user.id, count: defects.length });

    return res.send(buffer);
  } catch (err) {
    console.error(err);
    logAction('error', 'Excel export failed', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Failed to export Excel' });
  }
});

module.exports = router;