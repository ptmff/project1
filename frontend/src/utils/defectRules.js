// src/utils/defectRules.js
export const Statuses = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
}

const allowed = {
  [Statuses.NEW]: [Statuses.IN_PROGRESS, Statuses.CANCELLED],
  [Statuses.IN_PROGRESS]: [Statuses.REVIEW, Statuses.NEW, Statuses.CANCELLED],
  [Statuses.REVIEW]: [Statuses.CLOSED, Statuses.IN_PROGRESS],
  [Statuses.CLOSED]: [],
  [Statuses.CANCELLED]: [],
}

export function canTransition(from, to) {
  if (!from || !to) return false
  if (from === to) return true
  return allowed[from]?.includes(to) || false
}

export const PRIORITIES = ['low', 'medium', 'high', 'critical']
export const STATUS_LIST = [Statuses.NEW, Statuses.IN_PROGRESS, Statuses.REVIEW, Statuses.CLOSED, Statuses.CANCELLED]
