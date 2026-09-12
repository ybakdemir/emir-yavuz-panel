import { MEMO_STATUS, MEMO_TYPE, REVIEW_RESULT } from '../content/defaults.js';
import { addDays } from './dates.js';
import { newId } from './library.js';

// Memorized items (surahs first; poems, songs and anything else share the
// model) plus their review history. Mastery is never taken away: a weak
// review only brings the next review closer.

export function getMemoItem(state, id) {
  return (id && state.memorizationItems?.[id]) || null;
}

export function memoItems(state, { includeArchived = false } = {}) {
  return Object.values(state.memorizationItems || {}).filter((it) => includeArchived || !it.archived);
}

export function addMemoItem(state, { title, type = MEMO_TYPE.SURA, startedAt, note = '' }, today) {
  const t = String(title || '').trim();
  if (!t) return null;
  const id = newId('m');
  state.memorizationItems ||= {};
  state.memorizationItems[id] = {
    id, title: t, type: MEMO_TYPE[type] ? type : MEMO_TYPE.OTHER,
    startedAt: startedAt || today, masteredAt: null, status: MEMO_STATUS.LEARNING,
    lastReviewedAt: null, nextReviewAt: null, intervalIndex: 0, note: note || '', archived: false, createdAt: today,
  };
  return state.memorizationItems[id];
}

export function updateMemoItem(state, id, patch) {
  const it = getMemoItem(state, id);
  if (!it) return null;
  Object.assign(it, patch);
  if (patch.title !== undefined) it.title = String(patch.title).trim() || it.title;
  return it;
}

/** Interval schedule as parents configured it (falls back to a single 1-day step if emptied). */
export function reviewIntervals(state) {
  const list = (state.config?.review?.intervals || []).map(Number).filter((n) => n > 0);
  return list.length ? list : [1];
}

export function markMastered(state, id, date) {
  const it = getMemoItem(state, id);
  if (!it) return null;
  it.status = MEMO_STATUS.MASTERED;
  it.masteredAt = date;
  if (it.startedAt && it.startedAt > date) it.startedAt = date;
  it.intervalIndex = 0;
  it.nextReviewAt = addDays(date, reviewIntervals(state)[0]);
  // A newly mastered item joins the Daily Review Pool; parents can take it out (core/dailyReview.js).
  if (it.dailyReviewEnabled === undefined) it.dailyReviewEnabled = true;
  return it;
}

/** Undo a mistaken "mastered" mark. Review history stays. */
export function markLearning(state, id) {
  const it = getMemoItem(state, id);
  if (!it) return null;
  it.status = MEMO_STATUS.LEARNING;
  it.masteredAt = null;
  it.nextReviewAt = null;
  it.intervalIndex = 0;
  return it;
}

export function archiveMemoItem(state, id, archived = true) {
  const it = getMemoItem(state, id);
  if (it) it.archived = !!archived;
  return it;
}

export function setNextReview(state, id, date) {
  const it = getMemoItem(state, id);
  if (it) it.nextReviewAt = date || null;
  return it;
}

/**
 * Where the schedule goes after a review:
 *  - self       → one step further along the interval list (capped at the last step)
 *  - assisted   → one step back (a shorter gap), never below the first step
 *  - needs_work → back to the start, and the next review is `needsWorkDays` away
 */
export function nextReviewStep(state, intervalIndex, result) {
  const intervals = reviewIntervals(state);
  const cur = Math.min(Math.max(Number(intervalIndex) || 0, 0), intervals.length - 1);
  if (result === REVIEW_RESULT.SELF) { const idx = Math.min(cur + 1, intervals.length - 1); return { intervalIndex: idx, days: intervals[idx] }; }
  if (result === REVIEW_RESULT.ASSISTED) { const idx = Math.max(cur - 1, 0); return { intervalIndex: idx, days: intervals[idx] }; }
  const days = Math.max(1, Number(state.config?.review?.needsWorkDays) || 1);
  return { intervalIndex: 0, days };
}

/** Record one review outcome and move the schedule. Returns the review record. */
export function recordReview(state, itemId, result, date, { note = '', by = 'child' } = {}) {
  const it = getMemoItem(state, itemId);
  if (!it || !Object.values(REVIEW_RESULT).includes(result)) return null;
  const step = nextReviewStep(state, it.intervalIndex, result);
  const id = newId('r');
  state.memorizationReviews ||= {};
  state.memorizationReviews[id] = { id, itemId, date, result, note: note || '', by, at: Date.now(), nextReviewAt: addDays(date, step.days) };
  it.lastReviewedAt = date;
  it.lastResult = result;
  it.intervalIndex = step.intervalIndex;
  it.nextReviewAt = state.memorizationReviews[id].nextReviewAt;
  return state.memorizationReviews[id];
}

/** Parent correction of a past review. Only the record changes; the schedule is not replayed. */
export function updateReview(state, reviewId, patch) {
  const r = state.memorizationReviews?.[reviewId];
  if (!r) return null;
  Object.assign(r, patch);
  const it = getMemoItem(state, r.itemId);
  if (it) {
    const last = reviewsFor(state, r.itemId).at(-1);
    if (last) { it.lastReviewedAt = last.date; it.lastResult = last.result; }
  }
  return r;
}

export function removeReview(state, reviewId) {
  const r = state.memorizationReviews?.[reviewId];
  if (!r) return false;
  delete state.memorizationReviews[reviewId];
  const it = getMemoItem(state, r.itemId);
  if (it) {
    const last = reviewsFor(state, r.itemId).at(-1);
    it.lastReviewedAt = last ? last.date : null;
    it.lastResult = last ? last.result : null;
  }
  return true;
}

/** Chronological review history of one item. */
export function reviewsFor(state, itemId) {
  return Object.values(state.memorizationReviews || {}).filter((r) => r.itemId === itemId)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.at || 0) - (b.at || 0));
}

/** Mastered, not archived, review date reached. */
export function dueItems(state, today) {
  return memoItems(state).filter((it) => it.status === MEMO_STATUS.MASTERED && it.nextReviewAt && it.nextReviewAt <= today)
    .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));
}

export function memoByStatus(state) {
  const items = memoItems(state);
  return {
    learning: items.filter((it) => it.status === MEMO_STATUS.LEARNING).sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || '')),
    mastered: items.filter((it) => it.status === MEMO_STATUS.MASTERED).sort((a, b) => (b.masteredAt || '').localeCompare(a.masteredAt || '')),
  };
}
