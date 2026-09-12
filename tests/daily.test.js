import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialState, ensureShape, importLegacy } from '../src/core/migrate.js';
import { createStore } from '../src/core/store.js';
import { ensureDay, setStatus, getStatus, isCompleted } from '../src/core/completion.js';
import { itemsForDay, coreItemsForDay, daysFor, setItemDays } from '../src/core/schedule.js';
import { independenceStats, studyDays, explorerStats } from '../src/core/analytics.js';
import { isGoodDay, dayCompletion } from '../src/core/rewards.js';
import { addMemoItem, markMastered, markLearning, updateMemoItem, recordReview, reviewsFor, dueItems, archiveMemoItem, removeReview } from '../src/core/memorization.js';
import {
  poolItems, inPool, setDailyReview, dailyReviewOn, dailyReviewDefault, dailyTarget, setDailyTarget, selectDailyReviews, dailyReviewSet, freezeDailySet,
  expandDailySet, recordDailyReview, reviewsOn, dailyReviewHistory, completeReviewDays, memoryHealth,
} from '../src/core/dailyReview.js';
import { expeditionSteps, milestoneCounts, syncDiscoveries, discoveryCredits, DISCOVERY_KINDS } from '../src/core/expedition.js';
import { LEVEL, celebrationFor, levelForItem, eventForItem, DISCOVERY_REASON } from '../src/core/celebration.js';
import { STATUS, REVIEW_RESULT, HEALTH, DEFAULT_REVIEW, DEFAULT_ITEMS, MEMO_TYPE } from '../src/content/defaults.js';
import { addDays } from '../src/core/dates.js';
import { graduateSkill } from '../src/core/skills.js';
import { V1_BLOB, MemoryStorage } from './fixtures.js';

const T = '2026-09-12'; // Saturday
const mk = () => buildInitialState(T);
const ids = (arr) => arr.map((i) => i.id);

/** Mastered items in the pool: titles → ids. */
function withPool(s, titles, masteredAt = '2026-09-01') {
  const out = {};
  for (const t of titles) { const it = addMemoItem(s, { title: t }, masteredAt); markMastered(s, it.id, masteredAt); out[t] = it.id; }
  return out;
}

// ── LITTLE EXPLORER ─────────────────────────────────────────────────────
test('little explorer: a daily applicable task on weekdays and weekends, counted in the core set', () => {
  const s = mk();
  const sat = ensureDay(s, '2026-09-12'), mon = ensureDay(s, '2026-09-14');
  assert.ok(ids(itemsForDay(s.config, '2026-09-12', sat)).includes('explorer'));
  assert.ok(ids(itemsForDay(s.config, '2026-09-14', mon)).includes('explorer'));
  assert.ok(ids(coreItemsForDay(s.config, '2026-09-12', sat)).includes('explorer'));
  assert.equal(DEFAULT_ITEMS.find((i) => i.id === 'explorer').days, 'all');
});

test('little explorer: completion persists through the store and derives into analytics; a missing day is not a study day', () => {
  const storage = new MemoryStorage();
  const store = createStore({ storage, now: () => new Date(2026, 8, 12, 9) });
  store.init();
  store.update((s) => { setStatus(ensureDay(s, T), 'explorer', STATUS.COMPLETED_UNSPECIFIED, 1); });
  // reload from localStorage
  const again = createStore({ storage, now: () => new Date(2026, 8, 12, 10) });
  const s = again.init();
  assert.ok(isCompleted(getStatus(s.days[T], 'explorer')));
  const ex = explorerStats(s, T);
  assert.equal(ex.thisWeek, 1); assert.equal(ex.thisMonth, 1); assert.equal(ex.last30, 1); assert.equal(ex.lastStudied, T);
  assert.deepEqual(studyDays(s, 'explorer', '2026-09-10', T), [T]); // 10th and 11th have no record → not study days
  assert.equal(ex.last14.filter((d) => d.studied).length, 1);
});

test('schedule: a day-rule change applies from the day it was made; earlier days keep the old rule', () => {
  const s = mk();
  const ex = s.config.items.find((i) => i.id === 'explorer');
  ex.days = 'weekday'; delete ex.daysFrom; delete ex.daysNow;
  setItemDays(ex, 'all', '2026-09-12');
  assert.equal(daysFor(ex, '2026-09-05'), 'weekday');   // previous Saturday: old rule
  assert.equal(daysFor(ex, '2026-09-12'), 'all');       // from today on
  assert.equal(daysFor(ex, '2026-09-19'), 'all');
  assert.ok(!ids(itemsForDay(s.config, '2026-09-05', ensureDay(s, '2026-09-05'))).includes('explorer'));
  assert.ok(ids(itemsForDay(s.config, '2026-09-12', ensureDay(s, '2026-09-12'))).includes('explorer'));
  // changing twice on the same day keeps the rule that was in force yesterday
  setItemDays(ex, 'weekend', '2026-09-12');
  assert.equal(ex.days, 'weekday'); assert.equal(ex.daysFrom, '2026-09-12'); assert.equal(ex.daysNow, 'weekend');
  // a reader that only knows `days` (the current Production build) still sees the historical rule
  assert.equal(ex.days, 'weekday');
});

test('migration: a saved config with explorer on weekdays is upgraded once, from today, without moving any past ratio', () => {
  const s = mk();
  s.config.items.find((i) => i.id === 'explorer').days = 'weekday';
  delete s.upgrades;
  importLegacy(s, V1_BLOB, 'firebase', '2026-09-01'); // includes weekend legacy days (2026-04-18/19)
  const before = { '2026-04-18': dayCompletion(s, '2026-04-18'), '2026-04-19': dayCompletion(s, '2026-04-19'), good: isGoodDay(s, '2026-04-18') };
  const up = ensureShape(JSON.parse(JSON.stringify(s)), T);
  const ex = up.config.items.find((i) => i.id === 'explorer');
  assert.equal(ex.days, 'weekday'); assert.equal(ex.daysNow, 'all'); assert.equal(ex.daysFrom, T);
  assert.equal(up.upgrades.explorerDaily, T);
  assert.deepEqual(dayCompletion(up, '2026-04-18'), before['2026-04-18']);
  assert.deepEqual(dayCompletion(up, '2026-04-19'), before['2026-04-19']);
  assert.equal(isGoodDay(up, '2026-04-18'), before.good);
  assert.ok(ids(coreItemsForDay(up.config, T, ensureDay(up, T))).includes('explorer'));
  // idempotent: a parent who sets it back to weekdays is not overridden on the next boot
  setItemDays(ex, 'weekday', '2026-09-13');
  const again = ensureShape(JSON.parse(JSON.stringify(up)), '2026-09-14');
  assert.equal(daysFor(again.config.items.find((i) => i.id === 'explorer'), '2026-09-14'), 'weekday');
});

// ── DAILY REVIEW POOL ────────────────────────────────────────────────────
test('pool: mastered items join the pool by default; parents can take them out and put them back; learning/archived never in', () => {
  const s = mk();
  const p = withPool(s, ['Fatiha', 'İhlas']);
  const learning = addMemoItem(s, { title: 'Nas' }, T);
  assert.deepEqual(ids(poolItems(s)).sort(), [p.Fatiha, p['İhlas']].sort());
  assert.ok(!inPool(learning));
  setDailyReview(s, p.Fatiha, false);
  assert.deepEqual(ids(poolItems(s)), [p['İhlas']]);
  assert.equal(reviewsFor(s, p.Fatiha).length, 0); // nothing erased
  setDailyReview(s, p.Fatiha, true);
  assert.equal(poolItems(s).length, 2);
  archiveMemoItem(s, p['İhlas'], true);
  assert.deepEqual(ids(poolItems(s)), [p.Fatiha]);
});

test('pool: daily target defaults to 3, is parent-configurable and capped by the pool size', () => {
  const s = mk();
  assert.equal(dailyTarget(s), 3);
  assert.equal(DEFAULT_REVIEW.dailyTarget, 3);
  withPool(s, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(dailyReviewSet(s, T).total, 3);
  setDailyTarget(s, 5);
  assert.equal(dailyReviewSet(s, T).total, 5);
  setDailyTarget(s, 8);
  assert.equal(dailyReviewSet(s, T).total, 5); // capped
  setDailyTarget(s, 0);
  assert.equal(dailyTarget(s), 1);
  assert.equal(dailyReviewSet(s, T).total, 1);
});

test('selection: due items first (most overdue first), then needs_work, then assisted, then rotation', () => {
  const s = mk();
  setDailyTarget(s, 4);
  const p = withPool(s, ['Due1', 'Due2', 'Weak', 'Helped', 'Fresh1', 'Fresh2']);
  // spaced schedule says these are due
  s.memorizationItems[p.Due1].nextReviewAt = '2026-09-10';
  s.memorizationItems[p.Due2].nextReviewAt = '2026-09-05'; // more overdue
  // the rest are not due
  for (const k of ['Weak', 'Helped', 'Fresh1', 'Fresh2']) s.memorizationItems[p[k]].nextReviewAt = '2026-09-20';
  s.memorizationItems[p.Weak].lastResult = REVIEW_RESULT.NEEDS_WORK; s.memorizationItems[p.Weak].lastReviewedAt = '2026-09-11';
  s.memorizationItems[p.Helped].lastResult = REVIEW_RESULT.ASSISTED; s.memorizationItems[p.Helped].lastReviewedAt = '2026-09-11';
  assert.deepEqual(selectDailyReviews(s, T), [p.Due2, p.Due1, p.Weak, p.Helped]);
  setDailyTarget(s, 2);
  assert.deepEqual(selectDailyReviews(s, T), [p.Due2, p.Due1]); // capped at the target, due never skipped for a healthy item
  setDailyTarget(s, 3);
  assert.deepEqual(selectDailyReviews(s, T), [p.Due2, p.Due1, p.Weak]);
});

test('selection: healthy items rotate day by day so the whole pool gets exposure; same-day selection is deterministic', () => {
  const s = mk();
  const p = withPool(s, ['A', 'B', 'C', 'D', 'E', 'F']);
  for (const id of Object.values(p)) s.memorizationItems[id].nextReviewAt = '2026-10-01';
  const seen = new Set();
  const days = Array.from({ length: 6 }, (_, i) => addDays(T, i));
  const picks = days.map((d) => selectDailyReviews(s, d));
  picks.forEach((ids3) => { assert.equal(ids3.length, 3); ids3.forEach((id) => seen.add(id)); });
  assert.equal(seen.size, 6);                                        // every item appears within a pool-sized window
  assert.notDeepEqual(picks[0], picks[1]);                           // not the same easy items every day
  assert.deepEqual(selectDailyReviews(s, T), selectDailyReviews(s, T)); // deterministic on refresh
  assert.deepEqual(dailyReviewSet(s, T).items.map((i) => i.id), picks[0]);
  // least recently reviewed first: reviewing an item pushes it to the back of the rotation
  recordReview(s, picks[0][0], REVIEW_RESULT.SELF, '2026-09-11');
  s.memorizationItems[picks[0][0]].nextReviewAt = '2026-10-01';
  assert.ok(!selectDailyReviews(s, T).includes(picks[0][0]));
});

test('today set: partial and full completion persist across reloads; finished items stay in the set even when the schedule moves', () => {
  const storage = new MemoryStorage();
  const store = createStore({ storage, now: () => new Date(2026, 8, 12, 9) });
  store.init();
  let p;
  store.update((s) => { p = withPool(s, ['Fatiha', 'İhlas', 'Felak']); });
  let set = dailyReviewSet(store.state, T);
  assert.equal(set.total, 3); assert.equal(set.done, 0); assert.equal(set.frozen, false);
  const first = set.items[0].id;
  store.update((s) => recordDailyReview(s, first, REVIEW_RESULT.SELF, T));
  set = dailyReviewSet(store.state, T);
  assert.equal(set.frozen, true); assert.equal(set.done, 1); assert.equal(set.complete, false);
  assert.ok(set.items.find((i) => i.id === first).done);
  assert.equal(set.items.find((i) => i.id === first).review.result, REVIEW_RESULT.SELF);
  // reload → the same set, the same tick
  const again = createStore({ storage, now: () => new Date(2026, 8, 12, 15) });
  const s2 = again.init();
  const set2 = dailyReviewSet(s2, T);
  assert.deepEqual(set2.items.map((i) => i.id), set.items.map((i) => i.id));
  assert.equal(set2.done, 1);
  assert.equal(s2.memorizationItems[first].nextReviewAt > T, true); // schedule moved on, item still listed
  // finish the rest
  again.update((s) => { set2.items.filter((i) => !i.done).forEach((i) => recordDailyReview(s, i.id, REVIEW_RESULT.ASSISTED, T)); });
  const done = dailyReviewSet(again.state, T);
  assert.equal(done.complete, true); assert.equal(done.done, 3);
  assert.equal(Object.keys(reviewsOn(again.state, T)).length, 3);
  assert.deepEqual(again.state.memorizationDaily[T].items, set.items.map((i) => i.id));
  // the next day is a fresh set: nothing is ticked, and the just-reviewed items are not the first pick
  const tomorrow = addDays(T, 1);
  const next = dailyReviewSet(again.state, tomorrow);
  assert.equal(next.done, 0); assert.equal(next.frozen, false);
});

test('today set: next-day selection changes with what happened today; needs_work comes back first', () => {
  const s = mk();
  const p = withPool(s, ['A', 'B', 'C', 'D']);
  for (const id of Object.values(p)) s.memorizationItems[id].nextReviewAt = '2026-10-01';
  const todaySet = dailyReviewSet(s, T).items.map((i) => i.id);
  recordDailyReview(s, todaySet[0], REVIEW_RESULT.NEEDS_WORK, T);
  recordDailyReview(s, todaySet[1], REVIEW_RESULT.SELF, T);
  const tomorrow = addDays(T, 1);
  const next = selectDailyReviews(s, tomorrow);
  assert.equal(next[0], todaySet[0]);                 // needs_work → due tomorrow (needsWorkDays 1) → first
  assert.ok(!next.includes(todaySet[1]));             // read on its own → not due, recently reviewed → rotates out
});

test('"Tümünü Tekrar Et": the whole pool is listed for today, already-ticked items keep their place, schedules untouched', () => {
  const s = mk();
  const p = withPool(s, ['A', 'B', 'C', 'D', 'E']);
  for (const id of Object.values(p)) s.memorizationItems[id].nextReviewAt = '2026-10-01';
  const before = JSON.parse(JSON.stringify(s.memorizationItems));
  const first = dailyReviewSet(s, T).items[0].id;
  recordDailyReview(s, first, REVIEW_RESULT.SELF, T);
  expandDailySet(s, T);
  const set = dailyReviewSet(s, T);
  assert.equal(set.all, true); assert.equal(set.total, 5); assert.equal(set.items[0].id, first); assert.ok(set.items[0].done);
  for (const id of Object.values(p)) if (id !== first) assert.deepEqual(s.memorizationItems[id], before[id]); // expanding moved no schedule
  assert.equal(dailyReviewSet(s, addDays(T, 1)).all, false);
});

test('today set: items removed from the pool drop out; a raised target tops the frozen set up', () => {
  const s = mk();
  const p = withPool(s, ['A', 'B', 'C', 'D', 'E']);
  const set = dailyReviewSet(s, T);
  recordDailyReview(s, set.items[0].id, REVIEW_RESULT.SELF, T);
  setDailyReview(s, set.items[1].id, false);
  const after = dailyReviewSet(s, T);
  assert.ok(!after.items.some((i) => i.id === set.items[1].id));
  assert.equal(after.total, 3); // topped up to the target from the live selection
  setDailyTarget(s, 4);
  assert.equal(dailyReviewSet(s, T).total, 4);
  assert.ok(dailyReviewSet(s, T).items[0].done); // the finished one is still first
});

// ── SPACED REVIEW (unchanged behaviour through the daily path) ──────────
test('spaced review via the daily path: self advances, assisted shortens, needs_work returns near-term', () => {
  const s = mk();
  const p = withPool(s, ['Fatiha']);
  const id = p.Fatiha;
  assert.equal(s.memorizationItems[id].nextReviewAt, '2026-09-02'); // mastered 09-01 + 1
  recordDailyReview(s, id, REVIEW_RESULT.SELF, '2026-09-02');
  assert.equal(s.memorizationItems[id].nextReviewAt, '2026-09-05'); // +3
  recordDailyReview(s, id, REVIEW_RESULT.SELF, '2026-09-05');
  assert.equal(s.memorizationItems[id].nextReviewAt, '2026-09-12'); // +7
  recordDailyReview(s, id, REVIEW_RESULT.ASSISTED, '2026-09-12');
  assert.equal(s.memorizationItems[id].nextReviewAt, '2026-09-15'); // back one step → +3
  recordDailyReview(s, id, REVIEW_RESULT.NEEDS_WORK, '2026-09-15');
  assert.equal(s.memorizationItems[id].nextReviewAt, '2026-09-16'); // needsWorkDays 1
  assert.equal(s.memorizationItems[id].intervalIndex, 0);
  assert.equal(reviewsFor(s, id).length, 4);
  assert.deepEqual(dueItems(s, '2026-09-16').map((i) => i.id), [id]);
});

test('memory health: strong / refresh / today from the schedule and the last outcome', () => {
  const s = mk();
  const p = withPool(s, ['A']);
  const it = s.memorizationItems[p.A];
  it.nextReviewAt = '2026-10-01'; it.lastResult = null;
  assert.equal(memoryHealth(it, T), HEALTH.STRONG);
  it.nextReviewAt = '2026-09-14';                       // in two days → approaching
  assert.equal(memoryHealth(it, T), HEALTH.REFRESH);
  it.nextReviewAt = '2026-10-01'; it.lastResult = REVIEW_RESULT.ASSISTED;
  assert.equal(memoryHealth(it, T), HEALTH.REFRESH);
  it.lastResult = REVIEW_RESULT.SELF; it.nextReviewAt = T; // due today
  assert.equal(memoryHealth(it, T), HEALTH.TODAY);
  it.nextReviewAt = '2026-10-01'; it.lastResult = REVIEW_RESULT.NEEDS_WORK;
  assert.equal(memoryHealth(it, T), HEALTH.TODAY);
  assert.equal(memoryHealth(addMemoItem(s, { title: 'L' }, T), T), null); // learning: no health
});

// ── INDEPENDENCE ISOLATION ─────────────────────────────────────────────
test('isolation: daily memory reviews never touch days[], the independent rate or classification coverage', () => {
  const s = mk();
  const d = ensureDay(s, T);
  setStatus(d, 'reading', STATUS.INDEPENDENT, 1);
  setStatus(d, 'quran', STATUS.COMPLETED_UNSPECIFIED, 1);
  const before = independenceStats(s, T, T);
  const daysBefore = JSON.stringify(s.days);
  const p = withPool(s, ['A', 'B', 'C']);
  const set = dailyReviewSet(s, T);
  recordDailyReview(s, set.items[0].id, REVIEW_RESULT.NEEDS_WORK, T);
  recordDailyReview(s, set.items[1].id, REVIEW_RESULT.ASSISTED, T);
  recordDailyReview(s, set.items[2].id, REVIEW_RESULT.SELF, T);
  expandDailySet(s, T);
  const after = independenceStats(s, T, T);
  assert.deepEqual(after, before);
  assert.equal(after.rate, 1); assert.equal(after.classified, 1); assert.equal(after.unspecified, 1);
  assert.equal(JSON.stringify(s.days), daysBefore);
  assert.equal(Object.keys(s.days[T].items).length, 2); // no memorization key sneaked into the day record
  assert.ok(!Object.values(STATUS).includes(REVIEW_RESULT.SELF)); // the vocabularies are separate ('self' vs 'independent')
});

// ── PARENT HISTORY ─────────────────────────────────────────────────────
test('parent history: today/recent summaries reflect the actual review records, in and outside the set', () => {
  const s = mk();
  const p = withPool(s, ['Fatiha', 'İhlas', 'Felak', 'Nas']);
  const y = addDays(T, -1);
  freezeDailySet(s, y);
  const ySet = s.memorizationDaily[y].items;
  recordDailyReview(s, ySet[0], REVIEW_RESULT.SELF, y);
  recordDailyReview(s, ySet[1], REVIEW_RESULT.ASSISTED, y);
  // today: one from the set, one parent-recorded outside the set
  const tSet = dailyReviewSet(s, T).items.map((i) => i.id);
  recordDailyReview(s, tSet[0], REVIEW_RESULT.SELF, T);
  const outside = Object.values(p).find((id) => !tSet.includes(id));
  recordReview(s, outside, REVIEW_RESULT.NEEDS_WORK, T, { by: 'parent' });
  const hist = dailyReviewHistory(s, y, T);
  assert.equal(hist.length, 2);
  assert.equal(hist[0].date, y); assert.equal(hist[0].planned, 3); assert.equal(hist[0].done, 2); assert.equal(hist[0].complete, false);
  assert.deepEqual(hist[0].rows.map((r) => r.result), [REVIEW_RESULT.SELF, REVIEW_RESULT.ASSISTED, null]);
  assert.equal(hist[1].date, T); assert.equal(hist[1].done, 1); assert.equal(hist[1].reviewed, 2);
  const extra = hist[1].rows.find((r) => r.id === outside);
  assert.equal(extra.inSet, false); assert.equal(extra.result, REVIEW_RESULT.NEEDS_WORK); assert.equal(extra.by, 'parent');
  // a deleted record disappears from the summary too
  removeReview(s, reviewsOn(s, T)[tSet[0]].id);
  assert.equal(dailyReviewHistory(s, T, T)[0].done, 0);
});

// ── MILESTONES / DISCOVERIES ───────────────────────────────────────────
test('milestones: complete review days and English days open whole discoveries with a reason; nothing for pre-upgrade history', () => {
  const s = mk();
  s.expedition.milestonesSince = '2026-09-01';
  const p = withPool(s, ['A', 'B', 'C']);
  // 7 complete review days → 1 memory discovery
  for (let i = 0; i < 7; i++) {
    const d = addDays('2026-09-01', i);
    freezeDailySet(s, d);
    s.memorizationDaily[d].items.forEach((id) => recordDailyReview(s, id, REVIEW_RESULT.SELF, d));
  }
  // a partial day does not count
  freezeDailySet(s, '2026-09-08'); recordDailyReview(s, s.memorizationDaily['2026-09-08'].items[0], REVIEW_RESULT.SELF, '2026-09-08');
  assert.equal(completeReviewDays(s, '2026-09-01', T), 7);
  // 10 explorer days → 1 english discovery; days before milestonesSince are ignored
  for (let i = 0; i < 10; i++) setStatus(ensureDay(s, addDays('2026-09-01', i)), 'explorer', STATUS.COMPLETED_UNSPECIFIED, 1);
  setStatus(ensureDay(s, '2026-08-20'), 'explorer', STATUS.COMPLETED_UNSPECIFIED, 1);
  const ms = milestoneCounts(s, T);
  assert.equal(ms.memory, 1); assert.equal(ms.english, 1); assert.equal(ms.englishDays, 10); assert.equal(ms.total, 2);
  // those days are not good days (only explorer done) → steps contribute nothing here
  assert.equal(expeditionSteps(s, T).total, 0);
  const fresh = syncDiscoveries(s, T);
  assert.equal(fresh.length, 2);
  assert.equal(s.expedition.reasons[fresh[0]], 'memory');
  assert.equal(s.expedition.reasons[fresh[1]], 'english');
  assert.ok(DISCOVERY_REASON.memory.includes('Hafızanı'));
  // idempotent; counters remembered
  assert.deepEqual(syncDiscoveries(s, T), []);
  assert.deepEqual(s.expedition.milestoneSeen, { mastered: 0, presentations: 0, memory: 1, english: 1, month: 0 });
  // a deleted review can lower the count but never takes a discovery away
  Object.values(s.memorizationReviews).slice(0, 2).forEach((r) => removeReview(s, r.id));
  assert.deepEqual(syncDiscoveries(s, T), []);
  assert.equal(Object.keys(s.expedition.discovered).length, 2);
});

test('milestones: an upgraded old state starts counting from the upgrade day, so nothing bursts open', () => {
  const s = mk();
  delete s.expedition.milestonesSince; delete s.expedition.reasons; delete s.expedition.milestoneSeen; delete s.upgrades;
  importLegacy(s, V1_BLOB, 'firebase', '2026-09-01'); // legacy explorer days exist (c3)
  for (let i = 0; i < 12; i++) setStatus(ensureDay(s, addDays('2026-08-01', i)), 'explorer', STATUS.COMPLETED_UNSPECIFIED, 1);
  const up = ensureShape(JSON.parse(JSON.stringify(s)), T);
  assert.equal(up.expedition.milestonesSince, T);
  assert.equal(milestoneCounts(up, T).total, 0);
  assert.equal(expeditionSteps(up, T).total, expeditionSteps(s, T).total); // step maths untouched
});

test('celebration: three semantic levels, no numbers; explorer and physical are meaningful, routine is standard', () => {
  assert.deepEqual(Object.values(LEVEL), ['standard', 'meaningful', 'milestone']);
  assert.equal(levelForItem('morning'), LEVEL.STANDARD); assert.equal(eventForItem('morning'), null);
  assert.equal(levelForItem('explorer'), LEVEL.MEANINGFUL); assert.equal(eventForItem('explorer'), 'explorer_done');
  assert.equal(levelForItem('physical'), LEVEL.MEANINGFUL);
  assert.equal(celebrationFor('reviews_done').level, LEVEL.MEANINGFUL);
  assert.equal(celebrationFor('skill_mastered').level, LEVEL.MILESTONE);
  assert.equal(celebrationFor('presentation_done').level, LEVEL.MILESTONE);
  assert.equal(celebrationFor('nope').level, LEVEL.STANDARD);
  const copy = [celebrationFor('explorer_done').message, celebrationFor('reviews_done').message, ...Object.values(DISCOVERY_REASON)].join(' ');
  assert.ok(!/puan|yıldız|\+\d|xp|bonus/i.test(copy));
});

// ── DAILY REVIEW POOL — TYPE-AWARE DEFAULT (owner decision 2026-09-12) ──
test('pool default: a mastered SURA is in the Daily Review Pool, a mastered POEM / SONG / OTHER is not', () => {
  const s = mk();
  const made = {};
  for (const type of Object.values(MEMO_TYPE)) { const it = addMemoItem(s, { title: type, type }, '2026-09-01'); markMastered(s, it.id, '2026-09-01'); made[type] = it; }
  assert.equal(dailyReviewDefault(made.SURA), true);
  assert.equal(inPool(made.SURA), true);
  for (const type of ['POEM', 'SONG', 'OTHER']) {
    assert.equal(dailyReviewDefault(made[type]), false, type);
    assert.equal(inPool(made[type]), false, type);
    assert.equal(made[type].dailyReviewEnabled, undefined, `${type}: mastery writes no explicit choice`);
  }
  assert.equal(made.SURA.dailyReviewEnabled, undefined);
  assert.deepEqual(poolItems(s).map((it) => it.title), ['SURA']);
  // mastery state and history are what they were; only membership differs by type
  for (const it of Object.values(made)) assert.equal(it.status, 'MASTERED');
  assert.deepEqual(dailyReviewSet(s, T).items.map((it) => it.title), ['SURA']);
});

test('pool default: parents can opt a poem in and a sura out; the choice is explicit and survives re-mastering and a type edit', () => {
  const s = mk();
  const poem = addMemoItem(s, { title: 'Şiir', type: MEMO_TYPE.POEM }, '2026-09-01'); markMastered(s, poem.id, '2026-09-01');
  const sura = addMemoItem(s, { title: 'Fatiha' }, '2026-09-01'); markMastered(s, sura.id, '2026-09-01');
  setDailyReview(s, poem.id, true); setDailyReview(s, sura.id, false);
  assert.equal(poem.dailyReviewEnabled, true); assert.equal(sura.dailyReviewEnabled, false);
  assert.deepEqual(poolItems(s).map((it) => it.title), ['Şiir']);
  markLearning(s, poem.id); markMastered(s, poem.id, '2026-09-05');
  markLearning(s, sura.id); markMastered(s, sura.id, '2026-09-05');
  assert.deepEqual(poolItems(s).map((it) => it.title), ['Şiir']);
  // without a choice the type default follows a type edit; with one, the choice wins
  const other = addMemoItem(s, { title: 'Diğer', type: MEMO_TYPE.OTHER }, '2026-09-01'); markMastered(s, other.id, '2026-09-01');
  assert.equal(dailyReviewOn(other), false);
  updateMemoItem(s, other.id, { type: MEMO_TYPE.SURA }); assert.equal(dailyReviewOn(other), true);
  updateMemoItem(s, sura.id, { type: MEMO_TYPE.OTHER }); assert.equal(dailyReviewOn(sura), false);
  updateMemoItem(s, sura.id, { type: MEMO_TYPE.SURA }); assert.equal(dailyReviewOn(sura), false);
});

test('pool upgrade from ac583fe: system-written true is dropped (type default applies), parent false survives, runs once', () => {
  const s = mk();
  const mkOld = (title, type, flag) => { const it = addMemoItem(s, { title, type }, '2026-09-01'); markMastered(s, it.id, '2026-09-01'); if (flag !== undefined) it.dailyReviewEnabled = flag; return it.id; };
  const suraOn = mkOld('Fatiha', MEMO_TYPE.SURA, true);       // ac583fe markMastered
  const suraOff = mkOld('Nas', MEMO_TYPE.SURA, false);        // parent opted out
  const poemOn = mkOld('Şiir', MEMO_TYPE.POEM, true);         // ac583fe markMastered → must leave the pool
  const songOff = mkOld('Şarkı', MEMO_TYPE.SONG, false);      // parent opted out → stays out
  const otherOn = mkOld('Diğer', MEMO_TYPE.OTHER, true);      // ac583fe markMastered → must leave the pool
  const preLayer = mkOld('İhlas', MEMO_TYPE.SURA, undefined); // mastered before the pool existed
  const learning = addMemoItem(s, { title: 'Felak' }, '2026-09-10').id;
  delete s.upgrades.typedReviewPool;
  recordReview(s, poemOn, REVIEW_RESULT.SELF, '2026-09-02');
  const before = JSON.parse(JSON.stringify(s));
  const up = ensureShape(JSON.parse(JSON.stringify(s)), T);
  assert.equal(up.upgrades.typedReviewPool, T);
  assert.deepEqual(poolItems(up).map((it) => it.title).sort(), ['Fatiha', 'İhlas'].sort());
  assert.equal(up.memorizationItems[suraOn].dailyReviewEnabled, undefined);
  assert.equal(up.memorizationItems[suraOff].dailyReviewEnabled, false);
  assert.equal(up.memorizationItems[poemOn].dailyReviewEnabled, undefined);
  assert.equal(up.memorizationItems[songOff].dailyReviewEnabled, false);
  assert.equal(up.memorizationItems[otherOn].dailyReviewEnabled, undefined);
  assert.equal(up.memorizationItems[learning].status, 'LEARNING');
  // mastery state and review history untouched
  for (const id of Object.keys(before.memorizationItems)) {
    const { dailyReviewEnabled: _a, ...a } = before.memorizationItems[id]; const { dailyReviewEnabled: _b, ...b } = up.memorizationItems[id];
    assert.deepEqual(a, b);
  }
  assert.deepEqual(up.memorizationReviews, before.memorizationReviews);
  // the parent re-enables the poem after the upgrade; a second ensureShape keeps it
  setDailyReview(up, poemOn, true);
  const again = ensureShape(JSON.parse(JSON.stringify(up)), addDays(T, 1));
  assert.equal(again.memorizationItems[poemOn].dailyReviewEnabled, true);
  assert.ok(poolItems(again).some((it) => it.id === poemOn));
});

test('map copy upgrade: the untouched legacy bc_map fact is replaced once; an edited fact is kept', () => {
  const legacy = 'Her tamamlanan gün haritada bir adım demek.';
  const s = mk(); delete s.upgrades.mapFact; s.config.expedition.items.find((it) => it.id === 'bc_map').fact = legacy;
  const up = ensureShape(JSON.parse(JSON.stringify(s)), T);
  assert.ok(!up.config.expedition.items.find((it) => it.id === 'bc_map').fact.includes('tamamlanan gün'));
  assert.equal(up.upgrades.mapFact, T);
  const e = mk(); delete e.upgrades.mapFact; e.config.expedition.items.find((it) => it.id === 'bc_map').fact = 'Annemin yazdığı not';
  assert.equal(ensureShape(JSON.parse(JSON.stringify(e)), T).config.expedition.items.find((it) => it.id === 'bc_map').fact, 'Annemin yazdığı not');
});

// ── DISCOVERY ELIGIBILITY — development only (reward-semantics audit 2026-09-12) ──
test('discoveries: routine checkboxes never inflate eligibility, whatever the volume or the legacy daysPerDiscovery', () => {
  const s = mk();
  s.config.expedition.daysPerDiscovery = 1;
  for (let i = 0; i < 60; i++) {
    const d = ensureDay(s, addDays('2026-07-01', i)); d.homework = 'exists';
    ['morning', 'reading', 'quran', 'prayer', 'physical', 'evening', 'homework'].forEach((id) => setStatus(d, id, STATUS.INDEPENDENT, 1));
  }
  assert.equal(expeditionSteps(s, '2026-08-29').goodDays, 60); // the stat exists…
  assert.equal(discoveryCredits(s, '2026-08-29').total, 0);   // …and buys nothing
  assert.deepEqual(syncDiscoveries(s, '2026-08-29'), []);
  assert.deepEqual(Object.keys(s.expedition.discovered), []);
  assert.deepEqual(DISCOVERY_KINDS, ['mastered', 'presentations', 'memory', 'english', 'month']);
  assert.ok(!('steps' in discoveryCredits(s, '2026-08-29')) && !('goodDays' in discoveryCredits(s, '2026-08-29')));
});

test('discoveries: every credit kind opens exactly one find with its own reason', () => {
  const s = mk();
  s.expedition.milestonesSince = '2026-09-01';
  withPool(s, ['A', 'B', 'C']);
  for (let i = 0; i < 7; i++) { const d = addDays('2026-09-01', i); freezeDailySet(s, d); s.memorizationDaily[d].items.forEach((id) => recordDailyReview(s, id, REVIEW_RESULT.SELF, d)); }
  for (let i = 0; i < 10; i++) setStatus(ensureDay(s, addDays('2026-09-01', i)), 'explorer', STATUS.COMPLETED_UNSPECIFIED, 1);
  graduateSkill(s, s.skills.pool[0].id, '2026-09-10');
  s.weeks['2026-09-07'] = { presentation: { topic: 'Uzay', prepared: true, presented: true, presentedOn: '2026-09-11' } };
  const c = discoveryCredits(s, T);
  assert.deepEqual({ mastered: c.mastered, presentations: c.presentations, memory: c.memory, english: c.english, month: c.month, total: c.total }, { mastered: 1, presentations: 1, memory: 1, english: 1, month: 0, total: 4 });
  const fresh = syncDiscoveries(s, T);
  assert.equal(fresh.length, 4);
  assert.deepEqual(fresh.map((id) => s.expedition.reasons[id]), ['mastered', 'presentations', 'memory', 'english']);
  assert.ok(fresh.every((id) => DISCOVERY_REASON[s.expedition.reasons[id]]));
  assert.deepEqual(syncDiscoveries(s, T), []);
});

test('discoveries: a state upgraded from the good-day formula keeps its finds, gets no burst and owes no deficit', () => {
  const s = mk();
  // ac583fe shape: six finds from good days, one graduation and one presentation already counted as steps
  delete s.expedition.milestoneSeen.mastered; delete s.expedition.milestoneSeen.presentations;
  s.expedition.milestoneSeen = { memory: 0, english: 0, month: 0 };
  graduateSkill(s, s.skills.pool[0].id, '2026-08-20');
  s.weeks['2026-08-31'] = { presentation: { topic: 'Eski', prepared: true, presented: true, presentedOn: '2026-09-04' } };
  const six = s.config.expedition.items.slice(0, 6).map((it) => it.id);
  six.forEach((id, i) => { s.expedition.discovered[id] = addDays('2026-08-20', i); s.expedition.reasons[id] = 'steps'; });
  const up = ensureShape(JSON.parse(JSON.stringify(s)), T);
  assert.deepEqual(up.expedition.milestoneSeen, { memory: 0, english: 0, month: 0, mastered: 1, presentations: 1 });
  assert.deepEqual(syncDiscoveries(up, T), []);                       // no burst
  assert.deepEqual(Object.keys(up.expedition.discovered), six);         // nothing taken back
  s.weeks['2026-09-07'] = { presentation: { topic: 'Yeni', prepared: true, presented: true, presentedOn: T } };
  up.weeks['2026-09-07'] = s.weeks['2026-09-07'];
  const fresh = syncDiscoveries(up, T);                                 // no deficit: the very next credit opens #7
  assert.deepEqual(fresh, [s.config.expedition.items[6].id]);
  assert.equal(up.expedition.reasons[fresh[0]], 'presentations');
  assert.equal(up.expedition.reasons[six[0]], 'steps');                 // legacy finds keep their legacy story
  // a state that never had a ledger (Production 480750e shape) absorbs lazily inside syncDiscoveries too
  const prod = JSON.parse(JSON.stringify(s)); delete prod.expedition.milestoneSeen; delete prod.expedition.reasons;
  assert.deepEqual(syncDiscoveries(prod, T), []);
  assert.deepEqual(prod.expedition.milestoneSeen, { mastered: 1, presentations: 2, memory: 0, english: 0, month: 0 });
});

// ── MIGRATION / SHAPE ─────────────────────────────────────────────────
test('migration: a pre-pass ey_v6 boots with the new containers and defaults, and nothing existing is rewritten', async () => {
  const s = mk();
  delete s.memorizationDaily; delete s.upgrades; delete s.expedition.reasons; delete s.expedition.milestoneSeen; delete s.expedition.milestonesSince;
  delete s.config.review.dailyTarget; delete s.config.expedition.milestones;
  s.config.items.find((i) => i.id === 'explorer').days = 'weekday';
  s.config.expedition.items = s.config.expedition.items.filter((i) => i.id !== 'jv_mamen');
  s.expedition.discovered = { bc_map: '2026-09-02', bc_compass: '2026-09-04' };
  const it = addMemoItem(s, { title: 'Fatiha' }, '2026-09-01'); markMastered(s, it.id, '2026-09-01'); delete s.memorizationItems[it.id].dailyReviewEnabled;
  recordReview(s, it.id, REVIEW_RESULT.SELF, '2026-09-02');
  const d = ensureDay(s, '2026-09-10'); setStatus(d, 'reading', STATUS.INDEPENDENT, 1);
  s.meta = { updatedAt: 1000, writer: 'old' };
  const old = JSON.parse(JSON.stringify(s));
  const storage = new MemoryStorage({ ey_v6: JSON.stringify(old), ey_v5: JSON.stringify(V1_BLOB) });
  const store = createStore({ storage, now: () => new Date(2026, 8, 12, 9) });
  const up = store.init();
  assert.deepEqual(up.memorizationDaily, {});
  assert.equal(up.config.review.dailyTarget, 3);
  assert.deepEqual(up.config.expedition.milestones, { memoryDays: 7, englishDays: 10 });
  assert.deepEqual(up.expedition.discovered, old.expedition.discovered);
  assert.equal(up.expedition.milestonesSince, T);
  assert.deepEqual(up.expedition.milestoneSeen, { memory: 0, english: 0, month: 0, mastered: 0, presentations: 0 });
  // Mamenchisaurus slotted in after Brachiosaurus; existing order intact
  const list = ids(up.config.expedition.items);
  assert.equal(list[list.indexOf('jv_brachio') + 1], 'jv_mamen');
  assert.deepEqual(list.filter((x) => x !== 'jv_mamen'), ids(old.config.expedition.items));
  // history and review data untouched
  assert.deepEqual(up.days, old.days);
  assert.deepEqual(up.memorizationReviews, old.memorizationReviews);
  assert.deepEqual(up.memorizationItems, old.memorizationItems); // pool default is opt-out; the item is not rewritten
  assert.ok(inPool(up.memorizationItems[it.id]));
  assert.equal(up.schemaVersion, 6);
  assert.equal(storage.getItem('ey_v5'), JSON.stringify(V1_BLOB));
  // not persisted until the first real write
  assert.equal(storage.getItem('ey_v6'), JSON.stringify(old));
  // the remote copy without the new containers is adopted safely
  const remote = JSON.parse(JSON.stringify(old)); remote.meta = { updatedAt: Date.now() + 5000, writer: 'other' };
  store.replace(remote);
  assert.deepEqual(store.state.memorizationDaily, {});
  assert.equal(store.state.config.review.dailyTarget, 3);
});

test('shape: daily set records and reasons survive a JSON/ensureShape round trip and a Firebase-style empty drop', () => {
  const s = mk();
  const p = withPool(s, ['A', 'B']);
  recordDailyReview(s, p.A, REVIEW_RESULT.SELF, T);
  const back = ensureShape(JSON.parse(JSON.stringify(s)), T);
  assert.deepEqual(back.memorizationDaily[T].items, s.memorizationDaily[T].items);
  const dropped = JSON.parse(JSON.stringify(s)); delete dropped.memorizationDaily; delete dropped.expedition.reasons;
  const fixed = ensureShape(dropped, T);
  assert.deepEqual(fixed.memorizationDaily, {}); assert.deepEqual(fixed.expedition.reasons, {});
  assert.equal(dailyReviewSet(fixed, T).total, 2);
});
