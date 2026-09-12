import { STATUS } from '../content/defaults.js';
import { addDays, range, weekKey, weekDays } from './dates.js';
import { coreItemsForDay } from './schedule.js';
import { getStatus, isCompleted } from './completion.js';
import { dayCompletion } from './rewards.js';

/**
 * North-star numbers for [from, to]. Only days that have a record count;
 * within a recorded day every applicable core item counts, unmarked = not done.
 *
 * Three rates, three denominators:
 *  - `completionRate`  = completed / applicable. Completed = INDEPENDENT +
 *    REMINDER + ASSISTED + COMPLETED_UNSPECIFIED (a quick tap or a migrated v1
 *    tick counts as done).
 *  - `rate` (Independent Completion Rate) = independent / classified, where
 *    classified = INDEPENDENT + REMINDER + ASSISTED. COMPLETED_UNSPECIFIED is
 *    out of both numerator and denominator: it says nothing about *how* the
 *    task went, so it neither raises nor lowers the rate. `null` when nothing
 *    has been classified yet (undefined, not 0%).
 *  - `classifiedRate` (classification coverage) = classified / completed —
 *    how much of the completed work has been classified at all. A data-
 *    quality hint, not the north star.
 */
export function independenceStats(state, from, to, filterItem = null) {
  const out = { applicable: 0, independent: 0, reminder: 0, assisted: 0, notDone: 0, unspecified: 0, completed: 0, classified: 0, days: 0 };
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
      else if (s === STATUS.COMPLETED_UNSPECIFIED) out.unspecified++;
      else out.notDone++;
      if (isCompleted(s)) out.completed++;
    }
  }
  out.classified = out.independent + out.reminder + out.assisted;
  out.completionRate = out.applicable ? out.completed / out.applicable : 0;
  out.rate = out.classified ? out.independent / out.classified : null;      // independent completion rate
  out.classifiedRate = out.completed ? out.classified / out.completed : 0;  // classification coverage
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

/**
 * Days in [from, to] on which `itemId` was completed — derived from the day
 * records, nothing is stored separately. A day without a record, or with the
 * item unmarked, is simply not a study day. Used for Little Explorer.
 */
export function studyDays(state, itemId, from, to) {
  return range(from, to).filter((k) => isCompleted(getStatus(state.days[k], itemId)));
}

/** Calm, descriptive Little Explorer numbers: no streaks, no points. */
export function explorerStats(state, today, itemId = 'explorer') {
  const wk = weekKey(today);
  const monthStart = today.slice(0, 8) + '01';
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const w = addDays(wk, -7 * i);
    const days = weekDays(w).filter((k) => k <= today);
    weeks.push({ wk: w, days: studyDays(state, itemId, days[0], days[days.length - 1]).length });
  }
  const last14 = range(addDays(today, -13), today).map((k) => ({ key: k, studied: isCompleted(getStatus(state.days[k], itemId)) }));
  return {
    thisWeek: studyDays(state, itemId, wk, today).length,
    thisMonth: studyDays(state, itemId, monthStart, today).length,
    last30: studyDays(state, itemId, addDays(today, -29), today).length,
    weeks, last14,
    lastStudied: Object.keys(state.days).filter((k) => k <= today && isCompleted(getStatus(state.days[k], itemId))).sort().pop() || null,
  };
}
