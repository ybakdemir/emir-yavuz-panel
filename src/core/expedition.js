import { isGoodDay } from './rewards.js';

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

/** Persist any newly earned discoveries. Returns the ids revealed just now. */
export function syncDiscoveries(state, today) {
  const ex = state.config.expedition;
  state.expedition ||= { discovered: {} };
  state.expedition.discovered ||= {};
  const steps = expeditionSteps(state, today).total;
  const earned = Math.floor(steps / (ex.daysPerDiscovery || 1));
  const fresh = [];
  ex.items.slice(0, earned).forEach((item) => {
    if (!state.expedition.discovered[item.id]) {
      state.expedition.discovered[item.id] = today;
      fresh.push(item.id);
    }
  });
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
