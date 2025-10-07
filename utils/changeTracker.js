// utils/changeTracker.js
const { ChangeHistory } = require('../models');

/**
 * Отслеживание изменений в дефектах
 */
async function trackChange(defectId, userId, field, oldValue, newValue, action = 'updated') {
  try {
    // Преобразуем значения в строки для хранения
    const oldVal = oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
    const newVal = newValue !== null && newValue !== undefined ? String(newValue) : null;

    // Не записываем, если значения одинаковые
    if (oldVal === newVal && action === 'updated') {
      return null;
    }

    const change = await ChangeHistory.create({
      defectId,
      userId,
      field,
      oldValue: oldVal,
      newValue: newVal,
      action,
    });

    return change;
  } catch (err) {
    console.error('Failed to track change:', err);
    return null;
  }
}

module.exports = { trackChange };