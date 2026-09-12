import { STATUS } from '../content/defaults.js';
import { addDays, range, weekKey, weekDays } from './dates.js';
import { coreItemsForDay } from './schedule.js';
import { getStatus, isCompleted } from './completion.js';
import { dayCompletion } from './rewards.js';

/**
 * North-star numbers for [from, to]. Only days that have a record count;
 * within a recorded day every applicable core item counts, unmarked = not done.
 */
export function independenceStats(state, from, to, filterItem = null) {
  const out = { applicable: 0, independent: 0, reminder: 0, assisted: 0, notDone: 0, unknown: 0, completed: 0, days: 0 };
  for (const key of range(from, to)) {
    const day = state.days[key];
    if (!day) continue;
    out.days++;
    for (const item of coreItemsForDay(state.config, key, day)) {
      if (filterItem && item.id !== filterItem) continue;
      out.applicable++;
      const s = getStatus(day, item.id);
      if (s === STATUS.INDEPENDENT) out.independent++;
      else if (s === STATUS.REMINDER) out.reminder++;
      else if (s === STATUS.ASSISTED) out.assisted++;
      else if (s === STATUS.DONE) out.unknown++;
      else out.notDone++;
      if (isCompleted(s)) out.completed++;
    }
  }
  out.rate = out.applicable ? out.independent / out.applicable : 0;          // independent completion rate
  out.completionRate = out.applicable ? out.completed / out.applicable : 0;
  return out;
}

export function dailySeries(state, keys) {
  return keys.map((key) => ({ key, ...dayCompletion(state, key), recorded: !!state.days[key] }));
}

/** Per-week completion + independence for one item over the last N weeks. */
export function itemTrend(state, itemId, today, weeks = 4) {
  const wk0 = weekKey(today);
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const wk = addDays(wk0, -7 * i);
    const days = weekDays(wk);
    const s = independenceStats(state, days[0], days[6], itemId);
    out.push({ wk, ...s });
  }
  return out;
}

/** True when today is active again after ≥ gap days without any record. */
export function isComeback(state, today, gap = 3) {
  if (!state.days[today]) return false;
  const prev = Object.keys(state.days).filter((k) => k < today).sort().pop();
  if (!prev) return false;
  const missed = range(addDays(prev, 1), addDays(today, -1)).length;
  return missed >= gap;
}

/** Supportive continuity: consecutive recorded good days ending today/yesterday. Never punitive. */
export function activeDaysInRow(state, today) {
  let n = 0, k = state.days[today] ? today : addDays(today, -1);
  while (state.days[k] && dayCompletion(state, k).ratio >= state.config.rewards.goodDayRatio) { n++; k = addDays(k, -1); }
  return n;
}

export function recentAchievements(state, today, limit = 6) {
  const list = [];
  (state.achievements || []).forEach((a) => list.push({ ...a }));
  Object.entries(state.expedition?.discovered || {}).forEach(([id, date]) => list.push({ type: 'discovery', id, date }));
  Object.entries(state.weeks || {}).forEach(([wk, w]) => {
    if (w?.presentation?.presented) list.push({ type: 'presentation', date: w.presentation.presentedOn || wk, title: w.presentation.topic });
    if (w?.weeklyChoice?.chosen) list.push({ type: 'weekly_choice', date: w.weeklyChoice.chosenAt || wk, title: w.weeklyChoice.chosen });
  });
  if (isComeback(state, today)) list.push({ type: 'comeback', date: today });
  return list.filter((a) => a.date && a.date <= today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
