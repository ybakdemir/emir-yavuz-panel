import { isGoodDay, monthlyStatus } from './rewards.js';
import { monthKey } from './dates.js';
import { studyDays } from './analytics.js';
import { completeReviewDays } from './dailyReview.js';

/**
 * Expedition steps = good days + mastered skills + presentations given.
 * Nothing is ever subtracted, and discoveries are written once with a date,
 * so a rough week can never take away what was already found.
 */
export function expeditionSteps(state, upto) {
  const goodDays = Object.keys(state.days).filter((k) => k <= upto && isGoodDay(state, k)).length;
  const mastered = state.skills.pool.filter((s) => s.status === 'mastered').length;
  const presentations = Object.values(state.weeks || {}).filter((w) => w?.presentation?.presented).length;
  return { goodDays, mastered, presentations, total: goodDays + mastered + presentations };
}

/**
 * Milestone discoveries — whole discoveries on top of the step count, for
 * development that a "good day" does not capture:
 *  - memory  : every `milestones.memoryDays` days on which the whole Daily
 *              Review set was read
 *  - english : every `milestones.englishDays` Little Explorer study days
 *  - month   : every month whose Ayın Kutlaması condition was met
 * Counted from `expedition.milestonesSince` (the day this build first saw the
 * state), so upgrading never releases a burst of discoveries for old history.
 */
export function milestoneCounts(state, upto) {
  const ms = state.config.expedition.milestones || { memoryDays: 7, englishDays: 10 };
  const since = state.expedition?.milestonesSince || upto;
  const memoryDays = completeReviewDays(state, since, upto);
  const englishDays = since <= upto ? studyDays(state, 'explorer', since, upto).length : 0;
  const months = new Set(Object.keys(state.days || {}).filter((k) => k >= since && k <= upto).map(monthKey));
  const month = [...months].filter((mk) => monthlyStatus(state, mk).unlocked).length;
  const memory = Math.floor(memoryDays / Math.max(1, ms.memoryDays || 7));
  const english = Math.floor(englishDays / Math.max(1, ms.englishDays || 10));
  return { memory, english, month, memoryDays, englishDays, total: memory + english + month };
}

/**
 * Persist any newly earned discoveries. Returns the ids revealed just now.
 * Each fresh discovery is attributed to a reason (memory / english / month /
 * steps) so the reveal can say *why* — see celebration.DISCOVERY_REASON.
 */
export function syncDiscoveries(state, today) {
  const ex = state.config.expedition;
  state.expedition ||= { discovered: {} };
  state.expedition.discovered ||= {};
  state.expedition.reasons ||= {};
  const steps = expeditionSteps(state, today).total;
  const ms = milestoneCounts(state, today);
  const earned = Math.floor(steps / (ex.daysPerDiscovery || 1)) + ms.total;
  // Which milestone counters moved since the last sync → reasons for the fresh items, in order.
  const seen = state.expedition.milestoneSeen || { memory: 0, english: 0, month: 0 };
  const reasons = [];
  for (const k of ['memory', 'english', 'month']) for (let i = seen[k] || 0; i < ms[k]; i++) reasons.push(k);
  state.expedition.milestoneSeen = { memory: Math.max(seen.memory || 0, ms.memory), english: Math.max(seen.english || 0, ms.english), month: Math.max(seen.month || 0, ms.month) };
  const fresh = [];
  ex.items.slice(0, earned).forEach((item) => {
    if (!state.expedition.discovered[item.id]) { state.expedition.discovered[item.id] = today; fresh.push(item.id); }
  });
  // Milestone reasons go to the newest items of the batch (the ones the reveal shows first).
  [...fresh].reverse().forEach((id) => { state.expedition.reasons[id] = reasons.pop() || 'steps'; });
  return fresh;
}

export function expeditionView(state) {
  const ex = state.config.expedition;
  const discovered = state.expedition?.discovered || {};
  let nextIndex = ex.items.findIndex((it) => !discovered[it.id]);
  if (nextIndex < 0) nextIndex = ex.items.length;
  const regions = ex.regions.map((r) => {
    const items = ex.items.filter((it) => it.region === r.id).map((it) => ({ ...it, discoveredAt: discovered[it.id] || null }));
    const found = items.filter((it) => it.discoveredAt).length;
    return { ...r, items, found, total: items.length, state: found === items.length ? 'complete' : found > 0 || ex.items[nextIndex]?.region === r.id ? 'active' : 'locked' };
  });
  return { regions, discoveredCount: Object.keys(discovered).length, total: ex.items.length, next: ex.items[nextIndex] || null };
}
