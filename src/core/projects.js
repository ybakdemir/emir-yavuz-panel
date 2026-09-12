import { PROJECT_STATUS, PROJECT_TYPE } from '../content/defaults.js';
import { monthKey } from './dates.js';
import { newId } from './library.js';

// "Ayın Hafıza Projesi": one optional memorization project at a time. It is
// planned weekly/monthly and archived — never a daily checkbox.

export function projectList(state) {
  return Object.values(state.memoryProjects || {});
}

export function activeProject(state) {
  return projectList(state).filter((p) => p.status === PROJECT_STATUS.ACTIVE)
    .sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))[0] || null;
}

/**
 * Create a project. By default refuses while another is active (returns
 * null); with `replace: true` the running one is closed as REPLACED and kept
 * in history.
 */
export function createProject(state, { title, type = PROJECT_TYPE.FREE, targetMonth, note = '' }, today, { replace = false } = {}) {
  const t = String(title || '').trim();
  if (!t) return null;
  const current = activeProject(state);
  if (current) {
    if (!replace) return null;
    current.status = PROJECT_STATUS.REPLACED;
    current.endedAt = today;
  }
  const id = newId('p');
  state.memoryProjects ||= {};
  state.memoryProjects[id] = {
    id, title: t, type: PROJECT_TYPE[type] ? type : PROJECT_TYPE.FREE,
    startedAt: today, targetMonth: targetMonth || monthKey(today), completedAt: null,
    status: PROJECT_STATUS.ACTIVE, note: note || '',
  };
  return state.memoryProjects[id];
}

export function updateProject(state, id, patch) {
  const p = state.memoryProjects?.[id];
  if (!p) return null;
  Object.assign(p, patch);
  if (patch.title !== undefined) p.title = String(patch.title).trim() || p.title;
  return p;
}

export function completeProject(state, id, date) {
  const p = state.memoryProjects?.[id];
  if (!p) return null;
  p.status = PROJECT_STATUS.COMPLETED;
  p.completedAt = date;
  return p;
}

/** Re-open a project closed by mistake (only if nothing else is active). */
export function reopenProject(state, id) {
  const p = state.memoryProjects?.[id];
  if (!p || activeProject(state)) return null;
  p.status = PROJECT_STATUS.ACTIVE;
  p.completedAt = null;
  delete p.endedAt;
  return p;
}

/** Newest first; completed and replaced projects are retained. */
export function projectHistory(state) {
  return projectList(state).sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
}
