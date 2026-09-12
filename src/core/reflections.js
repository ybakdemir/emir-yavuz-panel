import { REFLECTION_PROMPTS } from '../content/defaults.js';
import { isWeekend, weekKey } from './dates.js';

// "Haftamı Düşünüyorum": an optional end-of-week note, keyed by the week's
// Monday. Skipping is a valid answer and is never counted against anyone.

export function reflectionFor(state, wk) {
  return state.weeklyReflections?.[wk] || null;
}

/** The reflection card is offered on Saturday/Sunday for the running week. */
export function isReflectionWindow(today) {
  return isWeekend(today);
}

function cleanAnswers(answers = {}) {
  const out = {};
  for (const p of REFLECTION_PROMPTS) out[p.id] = String(answers[p.id] ?? '').trim();
  return out;
}

export function hasAnswers(r) {
  return !!r && Object.values(r.answers || {}).some((v) => v && v.trim());
}

/** Save (or edit) the week's answers. Empty text on every prompt is still a save. */
export function saveReflection(state, wk, answers, today) {
  state.weeklyReflections ||= {};
  const prev = state.weeklyReflections[wk];
  state.weeklyReflections[wk] = {
    wk, answers: cleanAnswers(answers), skipped: false,
    savedOn: prev?.savedOn || today, updatedAt: today,
  };
  return state.weeklyReflections[wk];
}

export function skipReflection(state, wk, today) {
  state.weeklyReflections ||= {};
  const prev = state.weeklyReflections[wk];
  state.weeklyReflections[wk] = { wk, answers: prev?.answers || cleanAnswers(), skipped: true, savedOn: prev?.savedOn || null, skippedOn: today, updatedAt: today };
  return state.weeklyReflections[wk];
}

/** Forget a skip so the card is offered again this week. */
export function unskipReflection(state, wk) {
  const r = state.weeklyReflections?.[wk];
  if (!r) return null;
  if (hasAnswers(r)) { r.skipped = false; delete r.skippedOn; return r; }
  delete state.weeklyReflections[wk];
  return null;
}

/** Newest week first. */
export function reflectionHistory(state) {
  return Object.values(state.weeklyReflections || {}).sort((a, b) => b.wk.localeCompare(a.wk));
}

/** Should Today/My Week offer the card right now? */
export function reflectionPending(state, today) {
  if (!isReflectionWindow(today)) return false;
  const r = reflectionFor(state, weekKey(today));
  return !r || (!r.skipped && !hasAnswers(r));
}
