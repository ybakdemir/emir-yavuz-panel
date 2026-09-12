import { weekDays, monthKey, weekKey } from './dates.js';
import { coreItemsForDay } from './schedule.js';
import { isItemDone } from './completion.js';

export function dayCompletion(state, key) {
  const day = state.days[key];
  const items = coreItemsForDay(state.config, key, day);
  const done = items.filter((it) => isItemDone(day, it.id)).length;
  return { done, total: items.length, ratio: items.length ? done / items.length : 0 };
}

export function isGoodDay(state, key) {
  const day = state.days[key];
  if (!day) return false;
  const c = dayCompletion(state, key);
  return c.total > 0 && c.ratio >= state.config.rewards.goodDayRatio;
}

export function presentationForWeek(state, wk) {
  return state.weeks?.[wk]?.presentation || null;
}

/** Weekly Choice status for the week starting on `wk` (Monday). */
export function weeklyStatus(state, wk) {
  const r = state.config.rewards.weekly;
  const days = weekDays(wk);
  const goodDays = days.filter((k) => isGoodDay(state, k)).length;
  const pres = presentationForWeek(state, wk);
  const presentationDone = !!pres?.presented;
  const unlocked = goodDays >= r.minGoodDays && (!r.requirePresentation || presentationDone);
  const week = state.weeks?.[wk] || {};
  return {
    goodDays, needed: r.minGoodDays, presentationDone, requirePresentation: r.requirePresentation,
    unlocked, chosen: week.weeklyChoice?.chosen || null, chosenAt: week.weeklyChoice?.chosenAt || null,
  };
}

export function monthlyStatus(state, mk) {
  const r = state.config.rewards.monthly;
  const weeks = new Set(Object.keys(state.days).filter((k) => monthKey(k) === mk).map(weekKey));
  const unlockedWeeks = [...weeks].filter((wk) => weeklyStatus(state, wk).unlocked).length;
  const month = state.months?.[mk] || {};
  return {
    unlockedWeeks, needed: r.minWeeklyUnlocks, unlocked: unlockedWeeks >= r.minWeeklyUnlocks,
    chosen: month.celebration?.chosen || null, chosenAt: month.celebration?.chosenAt || null,
  };
}

export function chooseWeekly(state, wk, choice, date) {
  state.weeks ||= {}; state.weeks[wk] ||= {};
  state.weeks[wk].weeklyChoice = { chosen: choice, chosenAt: date };
}

export function chooseMonthly(state, mk, choice, date) {
  state.months ||= {}; state.months[mk] ||= {};
  state.months[mk].celebration = { chosen: choice, chosenAt: date };
}
