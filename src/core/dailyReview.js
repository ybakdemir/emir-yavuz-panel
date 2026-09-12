import { MEMO_STATUS, MEMO_TYPE, REVIEW_RESULT, HEALTH } from '../content/defaults.js';
import { diffDays, range } from './dates.js';
import { memoItems, recordReview } from './memorization.js';

// Daily Review Pool — the maintenance habit on top of the spaced schedule.
//
// The spaced schedule (memorization.js: nextReviewAt, 1→3→7→14→30) keeps
// deciding *when* an item is at risk. The pool decides *which* mastered items
// Emir keeps reading every day: parents keep items in the pool, set a daily
// target, and each day a small set is picked — due first, weak next, healthy
// ones in rotation. Nothing here is scored; completion is simply "there is a
// review record for that item today".

const ROTATION_EPOCH = '2020-01-01';

/**
 * Pool default by type: mastered suras are the family's daily maintenance
 * case and stay in (opt-out); poems, songs and everything else are kept out
 * until a parent opts them in. Owner decision, 2026-09-12.
 */
export function dailyReviewDefault(it) {
  return it?.type === MEMO_TYPE.SURA;
}

/** Effective pool switch: the parent's explicit choice when there is one, the type default otherwise. */
export function dailyReviewOn(it) {
  return typeof it?.dailyReviewEnabled === 'boolean' ? it.dailyReviewEnabled : dailyReviewDefault(it);
}

/** Mastered, not archived, kept in the pool (see dailyReviewOn). */
export function poolItems(state) {
  return memoItems(state)
    .filter((it) => it.status === MEMO_STATUS.MASTERED && dailyReviewOn(it))
    .sort((a, b) => (a.masteredAt || '').localeCompare(b.masteredAt || '') || a.title.localeCompare(b.title, 'tr'));
}

export function inPool(it) {
  return !!it && it.status === MEMO_STATUS.MASTERED && !it.archived && dailyReviewOn(it);
}

/** Parent's explicit choice. The only writer of `dailyReviewEnabled`. */
export function setDailyReview(state, id, on) {
  const it = state.memorizationItems?.[id];
  if (!it) return null;
  it.dailyReviewEnabled = !!on;
  return it;
}

/** Parent-set daily target, at least 1. The effective count is capped by the pool size at selection time. */
export function dailyTarget(state) {
  return Math.max(1, Math.round(Number(state.config?.review?.dailyTarget)) || 3);
}

export function setDailyTarget(state, n) {
  state.config.review ||= {};
  state.config.review.dailyTarget = Math.max(1, Math.round(Number(n)) || 1);
  return state.config.review.dailyTarget;
}

/** Latest review per item for one date: { itemId → review }. */
export function reviewsOn(state, date) {
  const out = {};
  for (const r of Object.values(state.memorizationReviews || {})) {
    if (r.date !== date) continue;
    if (!out[r.itemId] || (r.at || 0) >= (out[r.itemId].at || 0)) out[r.itemId] = r;
  }
  return out;
}

const isDue = (it, today) => !!it.nextReviewAt && it.nextReviewAt <= today;
const byTitle = (a, b) => a.title.localeCompare(b.title, 'tr');

/**
 * Memory health — three calm words from the schedule and the last outcome.
 *  - today   : due/overdue, or the last result was "needs work"
 *  - refresh : the next review is within two days, or the last result was "assisted"
 *  - strong  : everything else
 * Learning (not yet mastered) items have no health.
 */
export function memoryHealth(it, today) {
  if (!it || it.status !== MEMO_STATUS.MASTERED) return null;
  if (isDue(it, today) || it.lastResult === REVIEW_RESULT.NEEDS_WORK) return HEALTH.TODAY;
  if (it.lastResult === REVIEW_RESULT.ASSISTED) return HEALTH.REFRESH;
  if (it.nextReviewAt && diffDays(today, it.nextReviewAt) <= 2) return HEALTH.REFRESH;
  return HEALTH.STRONG;
}

/**
 * Today's pick from the pool, in priority order, capped at the daily target:
 *  1. due or overdue (most overdue first)
 *  2. last result "needs work"
 *  3. last result "assisted"
 *  4. the rest, least recently reviewed first; ties rotate by the day so the
 *     same easy items are not picked every day.
 * Deterministic for a given state and day.
 */
export function selectDailyReviews(state, today, { limit = null } = {}) {
  const pool = poolItems(state);
  const target = limit ?? Math.min(dailyTarget(state), pool.length);
  const dayNo = diffDays(ROTATION_EPOCH, today);
  const p1 = pool.filter((it) => isDue(it, today)).sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt) || byTitle(a, b));
  const seen = new Set(p1.map((it) => it.id));
  const weak = (result) => pool.filter((it) => !seen.has(it.id) && it.lastResult === result)
    .sort((a, b) => (a.lastReviewedAt || '').localeCompare(b.lastReviewedAt || '') || byTitle(a, b));
  const p2 = weak(REVIEW_RESULT.NEEDS_WORK); p2.forEach((it) => seen.add(it.id));
  const p3 = weak(REVIEW_RESULT.ASSISTED); p3.forEach((it) => seen.add(it.id));
  // p4: group by last review date (never reviewed first), rotate inside each group by the day number.
  const groups = new Map();
  pool.filter((it) => !seen.has(it.id)).forEach((it) => { const k = it.lastReviewedAt || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); });
  const p4 = [...groups.keys()].sort().flatMap((k) => {
    const g = groups.get(k).sort(byTitle);
    const off = dayNo % g.length;
    return [...g.slice(off), ...g.slice(0, off)];
  });
  return [...p1, ...p2, ...p3, ...p4].slice(0, target).map((it) => it.id);
}

/**
 * The set Today shows. Once a review is recorded the day's set is frozen
 * (memorizationDaily[today]) so finished items stay ticked after a reload or
 * a schedule change; until then it is computed live. Items that left the pool
 * drop out; if the set is under the target (parent raised it, or added an
 * item) it is topped up from the live selection. `all` = "Tümünü Tekrar Et".
 */
export function dailyReviewSet(state, today) {
  const pool = poolItems(state);
  const poolIds = new Set(pool.map((it) => it.id));
  const rec = state.memorizationDaily?.[today] || null;
  const target = Math.min(dailyTarget(state), pool.length);
  let ids = rec ? (rec.items || []).filter((id) => poolIds.has(id)) : [];
  if (rec?.all) {
    ids = [...ids, ...pool.map((it) => it.id).filter((id) => !ids.includes(id))];
  } else if (ids.length < target) {
    const extra = selectDailyReviews(state, today, { limit: pool.length }).filter((id) => !ids.includes(id));
    ids = [...ids, ...extra].slice(0, target);
  }
  const done = reviewsOn(state, today);
  const items = ids.map((id) => {
    const it = state.memorizationItems[id];
    return { ...it, review: done[id] || null, done: !!done[id], health: memoryHealth(it, today) };
  });
  const doneCount = items.filter((it) => it.done).length;
  return {
    items, target, all: !!rec?.all, frozen: !!rec,
    poolSize: pool.length, done: doneCount, total: items.length,
    complete: items.length > 0 && doneCount === items.length,
  };
}

/** Persist today's set as it currently stands (idempotent; keeps an existing record's items). */
export function freezeDailySet(state, today) {
  state.memorizationDaily ||= {};
  const set = dailyReviewSet(state, today);
  const rec = state.memorizationDaily[today] || { at: Date.now(), all: false };
  rec.items = set.items.map((it) => it.id);
  rec.target = set.target;
  state.memorizationDaily[today] = rec;
  return rec;
}

/** "Tümünü Tekrar Et": open the whole pool for today without touching any schedule. */
export function expandDailySet(state, today) {
  const rec = freezeDailySet(state, today);
  rec.all = true;
  rec.items = [...rec.items, ...poolItems(state).map((it) => it.id).filter((id) => !rec.items.includes(id))];
  return rec;
}

/** Child records one review: freeze today's set first so the finished item keeps its place. */
export function recordDailyReview(state, itemId, result, today, opts = {}) {
  freezeDailySet(state, today);
  return recordReview(state, itemId, result, today, { by: 'child', ...opts });
}

/**
 * Per-day review history for the parent: what the set was, what was
 * reviewed (in or outside the set) and how. Derived from the records only.
 */
export function dailyReviewHistory(state, from, to) {
  return range(from, to).map((date) => {
    const rec = state.memorizationDaily?.[date] || null;
    const done = reviewsOn(state, date);
    const setIds = rec ? (rec.items || []) : [];
    const extra = Object.keys(done).filter((id) => !setIds.includes(id));
    const rows = [...setIds, ...extra].map((id) => ({
      id, title: state.memorizationItems?.[id]?.title || '—', inSet: setIds.includes(id),
      review: done[id] || null, result: done[id]?.result || null, by: done[id]?.by || null,
    }));
    const setDone = setIds.filter((id) => done[id]).length;
    return { date, planned: setIds.length, done: setDone, reviewed: Object.keys(done).length, complete: setIds.length > 0 && setDone === setIds.length, rows };
  });
}

/** Days in [from, to] on which every item of that day's set was reviewed. Feeds the memory milestone. */
export function completeReviewDays(state, from, to) {
  if (!from || !to || from > to) return 0;
  const byDate = {};
  for (const r of Object.values(state.memorizationReviews || {})) { (byDate[r.date] ||= new Set()).add(r.itemId); }
  let n = 0;
  for (const [date, rec] of Object.entries(state.memorizationDaily || {})) {
    if (date < from || date > to) continue;
    const ids = rec?.items || [];
    if (ids.length && ids.every((id) => byDate[date]?.has(id))) n++;
  }
  return n;
}

