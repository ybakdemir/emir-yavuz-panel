import { isGoodDay, monthlyStatus } from './rewards.js';
import { monthKey } from './dates.js';
import { studyDays } from './analytics.js';
import { completeReviewDays } from './dailyReview.js';

// Dinosaur Discoveries celebrate development; they are never a task score.
// A discovery opens only for a MILESTONE (see celebration.js): a skill
// graduated, a weekly presentation given, a memory / English / monthly
// milestone. Good days — i.e. the share of ordinary checkboxes ticked — are
// shown on the map as a consistency stat but open nothing. (Until the
// reward-semantics audit of 2026-09-12 every two good days opened a find;
// that path is gone. Whatever it opened stays discovered.)

/** Skills graduated and weekly presentations given — all-time, one discovery each. */
export function developmentCounts(state) {
  const mastered = (state.skills?.pool || []).filter((s) => s.status === 'mastered').length;
  const presentations = Object.values(state.weeks || {}).filter((w) => w?.presentation?.presented).length;
  return { mastered, presentations };
}

/**
 * Map header stats. `goodDays` is informational only — it is NOT an input to
 * any discovery (see the note above). Nothing here is ever subtracted.
 */
export function expeditionSteps(state, upto) {
  const goodDays = Object.keys(state.days).filter((k) => k <= upto && isGoodDay(state, k)).length;
  const { mastered, presentations } = developmentCounts(state);
  return { goodDays, mastered, presentations, total: goodDays + mastered + presentations };
}

/**
 * Threshold milestones — whole discoveries for development that a single
 * event does not capture:
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

/** The kinds that can open a discovery, in reveal order. Keys double as celebration.DISCOVERY_REASON keys. */
export const DISCOVERY_KINDS = ['mastered', 'presentations', 'memory', 'english', 'month'];

/** Everything that can open a discovery: one per skill graduation, presentation and threshold milestone. */
export function discoveryCredits(state, upto) {
  const dev = developmentCounts(state);
  const ms = milestoneCounts(state, upto);
  return { ...dev, memory: ms.memory, english: ms.english, month: ms.month, total: dev.mastered + dev.presentations + ms.total };
}

/**
 * Persist any newly earned discoveries. Returns the ids revealed just now.
 *
 * Works as a ledger: `expedition.milestoneSeen[kind]` is how many credits of
 * each kind were already turned into finds; each new credit opens the next
 * undiscovered item and is written to `expedition.reasons[id]` so the reveal
 * can say *why*. A kind the ledger has never seen is absorbed at its current
 * count (ensureShape does this on load) — so a state upgraded from the
 * good-day formula neither bursts nor owes anything: the next development
 * event opens the next find, whatever the old formula had already opened.
 */
export function syncDiscoveries(state, today) {
  const ex = state.config.expedition;
  state.expedition ||= { discovered: {} };
  state.expedition.discovered ||= {};
  state.expedition.reasons ||= {};
  const seen = (state.expedition.milestoneSeen ||= {});
  const credits = discoveryCredits(state, today);
  const reasons = [];
  for (const k of DISCOVERY_KINDS) {
    if (seen[k] === undefined) seen[k] = credits[k]; // first sight of this kind: history is not re-issued
    for (let i = seen[k]; i < credits[k]; i++) reasons.push(k);
    seen[k] = Math.max(seen[k], credits[k]); // a corrected record can lower a count, never a discovery
  }
  const fresh = [];
  for (const item of ex.items) {
    if (fresh.length >= reasons.length) break;
    if (state.expedition.discovered[item.id]) continue;
    state.expedition.discovered[item.id] = today;
    state.expedition.reasons[item.id] = reasons[fresh.length];
    fresh.push(item.id);
  }
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
