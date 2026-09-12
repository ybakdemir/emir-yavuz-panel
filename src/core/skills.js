import { STATUS, SKILL_STATUS } from '../content/defaults.js';
import { addDays, range } from './dates.js';
import { isCompleted } from './completion.js';

export function getSkill(state, id) {
  return state.skills.pool.find((s) => s.id === id) || null;
}

export function activeSkill(state) {
  return state.skills.activeId ? getSkill(state, state.skills.activeId) : null;
}

/** Chronological [{date, status}] for every day this skill was on the plan. */
export function skillHistory(state, skillId) {
  return Object.keys(state.days)
    .filter((k) => state.days[k]?.skillId === skillId)
    .sort()
    .map((date) => ({ date, status: state.days[date].items?.skill?.status || STATUS.NOT_DONE }));
}

/**
 * Graduation check. Every threshold comes from state.skills.graduation, so
 * parents can tune it; nothing here is irreversible — it only reports.
 */
export function evaluateGraduation(state, skillId, today) {
  const g = state.skills.graduation;
  const from = addDays(today, -(g.windowDays - 1));
  const window = new Set(range(from, today));
  const hist = skillHistory(state, skillId).filter((h) => window.has(h.date) && h.date <= today);
  const observed = hist.length;
  const completed = hist.filter((h) => isCompleted(h.status)).length;
  const independent = hist.filter((h) => h.status === STATUS.INDEPENDENT).length;
  const executions = hist.filter((h) => isCompleted(h.status)).slice(-g.lastN);
  const lastIndependent = executions.filter((h) => h.status === STATUS.INDEPENDENT).length;
  const completion = observed ? completed / observed : 0;
  const independence = observed ? independent / observed : 0;
  const checks = {
    observed: observed >= g.minDaysObserved,
    completion: completion >= g.minCompletion,
    independence: independence >= g.minIndependent,
    lastN: executions.length >= g.lastN && lastIndependent >= g.minNoReminder,
  };
  return {
    observed, completed, independent, completion, independence,
    lastN: { independent: lastIndependent, total: executions.length, needed: g.minNoReminder, of: g.lastN },
    checks,
    eligible: Object.values(checks).every(Boolean),
  };
}

export function activateSkill(state, skillId, date) {
  const skill = getSkill(state, skillId);
  if (!skill) return;
  if (skill.status === SKILL_STATUS.POOL || !skill.status) {
    skill.status = SKILL_STATUS.LEARNING;
    skill.activatedAt = date;
  }
  state.skills.activeId = skillId;
  state.weeks ||= {};
}

export function deactivateSkill(state) {
  state.skills.activeId = null;
}

/** Graduate a skill. History is never touched; only status metadata changes. */
export function graduateSkill(state, skillId, date, opts = {}) {
  const skill = getSkill(state, skillId);
  if (!skill) return;
  skill.status = SKILL_STATUS.MASTERED;
  skill.masteredAt = date;
  skill.mergedIntoRoutine = opts.mergeIntoRoutine || null;
  skill.review = !!opts.review;
  skill.hidden = !!opts.hide;
  if (state.skills.activeId === skillId) state.skills.activeId = null;
  state.achievements ||= [];
  state.achievements.push({ type: 'skill_mastered', skillId, date });
}

/** LEARNING → PRACTICING after N completions; optional auto-graduation. */
export function autoAdvance(state, today) {
  const skill = activeSkill(state);
  if (!skill) return null;
  const g = state.skills.graduation;
  if (skill.status === SKILL_STATUS.LEARNING) {
    const completions = skillHistory(state, skill.id).filter((h) => isCompleted(h.status)).length;
    if (completions >= g.learningToPracticing) {
      skill.status = SKILL_STATUS.PRACTICING;
      skill.practicingAt = today;
      return { type: 'practicing', skillId: skill.id };
    }
  }
  if (g.autoGraduate && skill.status === SKILL_STATUS.PRACTICING) {
    const ev = evaluateGraduation(state, skill.id, today);
    if (ev.eligible) { graduateSkill(state, skill.id, today); return { type: 'mastered', skillId: skill.id }; }
  }
  return null;
}
