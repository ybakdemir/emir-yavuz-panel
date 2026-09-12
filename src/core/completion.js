import { STATUS } from '../content/defaults.js';

export const COMPLETED = new Set([STATUS.INDEPENDENT, STATUS.REMINDER, STATUS.ASSISTED, STATUS.DONE]);

export function isCompleted(status) {
  return COMPLETED.has(status);
}

export function getStatus(day, itemId) {
  return day?.items?.[itemId]?.status;
}

export function isItemDone(day, itemId) {
  return isCompleted(getStatus(day, itemId));
}

/** Returns a fresh, fully-shaped day record (never mutates input). */
export function emptyDay(extra = {}) {
  return { homework: 'unknown', items: {}, steps: {}, physical: {}, ...extra };
}

export function ensureDay(state, key) {
  if (!state.days[key]) {
    state.days[key] = emptyDay({ skillId: state.skills.activeId || null });
  }
  const day = state.days[key];
  day.items ||= {}; day.steps ||= {}; day.physical ||= {};
  if (day.homework === undefined) day.homework = 'unknown';
  if (day.skillId === undefined) day.skillId = state.skills.activeId || null;
  return day;
}

/** Set an item's status. status=null clears the mark entirely. */
export function setStatus(day, itemId, status, at = Date.now()) {
  if (status === null || status === undefined) { delete day.items[itemId]; return; }
  const prev = day.items[itemId] || {};
  day.items[itemId] = { ...prev, status, at: prev.at && isCompleted(prev.status) && isCompleted(status) ? prev.at : at };
}
