import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialState, ensureShape, importLegacy } from '../src/core/migrate.js';
import { createStore } from '../src/core/store.js';
import { ensureDay, setStatus } from '../src/core/completion.js';
import { independenceStats } from '../src/core/analytics.js';
import { addBook, updateBook, completeBook, reopenBook, removeBook, activeBook, setActiveBook, bookStats, booksReading, booksCompleted, readingDaysForBook, coverTone } from '../src/core/library.js';
import { addMemoItem, markMastered, markLearning, recordReview, reviewsFor, dueItems, setNextReview, archiveMemoItem, memoByStatus, nextReviewStep, removeReview, updateReview } from '../src/core/memorization.js';
import { createProject, activeProject, completeProject, projectHistory, reopenProject } from '../src/core/projects.js';
import { saveReflection, skipReflection, unskipReflection, reflectionFor, reflectionHistory, reflectionPending, isReflectionWindow } from '../src/core/reflections.js';
import { studyDays, explorerStats } from '../src/core/analytics.js';
import { STATUS, BOOK_STATUS, MEMO_STATUS, REVIEW_RESULT, PROJECT_STATUS, DEFAULT_REVIEW } from '../src/content/defaults.js';
import { V1_BLOB, MemoryStorage } from './fixtures.js';

const T = '2026-09-12'; // Saturday
const mk = () => buildInitialState(T);

/** A v2 state exactly as a build *before* the learning layer would have saved it. */
function oldV2State() {
  const s = mk();
  delete s.books; delete s.reading; delete s.memorizationItems; delete s.memorizationReviews; delete s.memoryProjects; delete s.weeklyReflections;
  delete s.config.review;
  importLegacy(s, V1_BLOB, 'firebase', '2026-09-01');
  const d = ensureDay(s, '2026-09-10'); setStatus(d, 'reading', STATUS.INDEPENDENT, 1); setStatus(d, 'explorer', STATUS.COMPLETED_UNSPECIFIED, 1);
  s.meta = { updatedAt: 1000, writer: 'old' };
  return JSON.parse(JSON.stringify(s));
}

// ── BOOKS ────────────────────────────────────────────────────────────────
test('books: add / edit / complete, dates persist, first book becomes active', () => {
  const s = mk();
  const b = addBook(s, { title: "Charlie'nin Çikolata Fabrikası", totalPages: 190, startedAt: '2026-09-01' }, T);
  assert.equal(b.status, BOOK_STATUS.READING);
  assert.equal(b.startedAt, '2026-09-01');
  assert.equal(b.finishedAt, null);
  assert.equal(activeBook(s).id, b.id);
  assert.equal(coverTone(b.title), b.cover.tone);
  updateBook(s, b.id, { totalPages: 200, startedAt: '2026-08-30', note: 'Babayla' });
  assert.equal(s.books[b.id].totalPages, 200);
  assert.equal(s.books[b.id].startedAt, '2026-08-30');
  completeBook(s, b.id, '2026-09-11');
  assert.equal(s.books[b.id].status, BOOK_STATUS.COMPLETED);
  assert.equal(s.books[b.id].finishedAt, '2026-09-11');
  assert.equal(activeBook(s), null);
  // parent corrects a date; a finish date before the start is clamped
  updateBook(s, b.id, { finishedAt: '2026-08-01' });
  completeBook(s, b.id, '2026-08-01');
  assert.equal(s.books[b.id].finishedAt, '2026-08-30');
  reopenBook(s, b.id);
  assert.equal(s.books[b.id].status, BOOK_STATUS.READING);
  assert.equal(s.books[b.id].finishedAt, null);
  // empty title is rejected
  assert.equal(addBook(s, { title: '   ' }, T), null);
});

test('books: lifetime totals count completed books and their pages only', () => {
  const s = mk();
  const a = addBook(s, { title: 'A', totalPages: 100 }, T);
  const b = addBook(s, { title: 'B', totalPages: 50 }, T);
  addBook(s, { title: 'C', totalPages: 300 }, T); // still reading
  completeBook(s, a.id, T); completeBook(s, b.id, T);
  assert.deepEqual(bookStats(s), { completedBooks: 2, completedPages: 150, reading: 1 });
  assert.equal(booksCompleted(s).length, 2);
  assert.equal(booksReading(s).length, 1);
});

test('books: active book = explicit choice, else most recently started; daily reading snapshot', () => {
  const s = mk();
  const a = addBook(s, { title: 'Eski', startedAt: '2026-08-01' }, T);
  const b = addBook(s, { title: 'Yeni', startedAt: '2026-09-05' }, T);
  assert.equal(activeBook(s).id, a.id);          // first added was set active
  setActiveBook(s, null);
  assert.equal(activeBook(s).id, b.id);          // fallback: most recent start
  setActiveBook(s, a.id);
  assert.equal(activeBook(s).id, a.id);
  const d = ensureDay(s, T); d.bookId = a.id; setStatus(d, 'reading', STATUS.COMPLETED_UNSPECIFIED, 1);
  const d2 = ensureDay(s, '2026-09-11'); d2.bookId = a.id; // not completed → not counted
  assert.deepEqual(readingDaysForBook(s, a.id), [T]);
  removeBook(s, a.id);
  assert.equal(activeBook(s).id, b.id);
});

test('books: an old v2 state without books loads safely', () => {
  const s = ensureShape(oldV2State());
  assert.deepEqual(s.books, {});
  assert.deepEqual(s.reading, { activeBookId: null });
  assert.equal(activeBook(s), null);
  assert.deepEqual(bookStats(s), { completedBooks: 0, completedPages: 0, reading: 0 });
});

// ── MEMORIZATION ─────────────────────────────────────────────────────────
test('memorization: add item, mark mastered, first review is scheduled from the configured list', () => {
  const s = mk();
  const it = addMemoItem(s, { title: 'Fatiha', type: 'SURA', startedAt: '2026-09-01' }, T);
  assert.equal(it.status, MEMO_STATUS.LEARNING);
  assert.equal(it.nextReviewAt, null);
  assert.equal(memoByStatus(s).learning.length, 1);
  markMastered(s, it.id, T);
  assert.equal(it.status, MEMO_STATUS.MASTERED);
  assert.equal(it.masteredAt, T);
  assert.equal(it.nextReviewAt, '2026-09-13'); // +1 day
  assert.equal(memoByStatus(s).mastered.length, 1);
  assert.deepEqual(dueItems(s, T), []);
  assert.equal(dueItems(s, '2026-09-13')[0].id, it.id);
});

test('memorization: successful review advances the interval; assisted shortens; needs-work returns near-term', () => {
  const s = mk();
  assert.deepEqual(s.config.review.intervals, DEFAULT_REVIEW.intervals);
  const it = addMemoItem(s, { title: 'İhlas', type: 'SURA' }, '2026-09-01');
  markMastered(s, it.id, '2026-09-01');                        // next 09-02 (1d), idx 0
  let r = recordReview(s, it.id, REVIEW_RESULT.SELF, '2026-09-02');
  assert.equal(it.intervalIndex, 1); assert.equal(it.nextReviewAt, '2026-09-05'); // +3
  assert.equal(r.nextReviewAt, '2026-09-05');
  recordReview(s, it.id, REVIEW_RESULT.SELF, '2026-09-05');
  assert.equal(it.intervalIndex, 2); assert.equal(it.nextReviewAt, '2026-09-12'); // +7
  recordReview(s, it.id, REVIEW_RESULT.ASSISTED, '2026-09-12');
  assert.equal(it.intervalIndex, 1); assert.equal(it.nextReviewAt, '2026-09-15'); // back to +3
  recordReview(s, it.id, REVIEW_RESULT.NEEDS_WORK, '2026-09-15');
  assert.equal(it.intervalIndex, 0); assert.equal(it.nextReviewAt, '2026-09-16'); // needsWorkDays = 1
  assert.equal(it.status, MEMO_STATUS.MASTERED);                 // mastery is never removed
  assert.equal(it.masteredAt, '2026-09-01');
  assert.equal(it.lastReviewedAt, '2026-09-15');
  assert.equal(it.lastResult, REVIEW_RESULT.NEEDS_WORK);
  // assisted at the first step stays at the first step (never below)
  recordReview(s, it.id, REVIEW_RESULT.ASSISTED, '2026-09-16');
  assert.equal(it.intervalIndex, 0); assert.equal(it.nextReviewAt, '2026-09-17');
  // top of the list is a ceiling
  it.intervalIndex = 4;
  assert.deepEqual(nextReviewStep(s, 4, REVIEW_RESULT.SELF), { intervalIndex: 4, days: 30 });
  // history is retained, chronological
  const hist = reviewsFor(s, it.id);
  assert.equal(hist.length, 5);
  assert.deepEqual(hist.map((x) => x.result), ['self', 'self', 'assisted', 'needs_work', 'assisted']);
  // unknown result is ignored
  assert.equal(recordReview(s, it.id, 'perfect', T), null);
});

test('memorization: schedule is configurable; parent can set next date, archive, undo mastery, fix reviews', () => {
  const s = mk();
  s.config.review.intervals = [2, 5];
  s.config.review.needsWorkDays = 3;
  const it = addMemoItem(s, { title: 'Şiir', type: 'POEM' }, T);
  markMastered(s, it.id, T);
  assert.equal(it.nextReviewAt, '2026-09-14');
  recordReview(s, it.id, REVIEW_RESULT.SELF, '2026-09-14');
  assert.equal(it.nextReviewAt, '2026-09-19');
  recordReview(s, it.id, REVIEW_RESULT.SELF, '2026-09-19');
  assert.equal(it.nextReviewAt, '2026-09-24'); // capped at last interval
  const r = recordReview(s, it.id, REVIEW_RESULT.NEEDS_WORK, '2026-09-24');
  assert.equal(it.nextReviewAt, '2026-09-27');
  setNextReview(s, it.id, '2026-10-01');
  assert.equal(it.nextReviewAt, '2026-10-01');
  archiveMemoItem(s, it.id);
  assert.deepEqual(dueItems(s, '2026-12-01'), []);
  assert.equal(memoByStatus(s).mastered.length, 0);
  archiveMemoItem(s, it.id, false);
  assert.equal(memoByStatus(s).mastered.length, 1);
  updateReview(s, r.id, { result: REVIEW_RESULT.ASSISTED });
  assert.equal(it.lastResult, REVIEW_RESULT.ASSISTED);
  removeReview(s, r.id);
  assert.equal(reviewsFor(s, it.id).length, 2);
  assert.equal(it.lastReviewedAt, '2026-09-19');
  markLearning(s, it.id);
  assert.equal(it.status, MEMO_STATUS.LEARNING);
  assert.equal(it.nextReviewAt, null);
  assert.equal(reviewsFor(s, it.id).length, 2); // history survives
});

test('memorization: review outcomes never touch daily-task independence', () => {
  const s = mk();
  const it = addMemoItem(s, { title: 'Nas', type: 'SURA' }, T);
  markMastered(s, it.id, T);
  recordReview(s, it.id, REVIEW_RESULT.SELF, T);
  const stats = independenceStats(s, T, T);
  assert.equal(stats.independent, 0);
  assert.equal(stats.classified, 0);
  assert.equal(s.days[T], undefined);
});

// ── LITTLE EXPLORER ──────────────────────────────────────────────────────
test('little explorer: stats derive from day records; missing days are not study days', () => {
  const s = mk();
  const on = (k, st = STATUS.COMPLETED_UNSPECIFIED) => setStatus(ensureDay(s, k), 'explorer', st, 1);
  on('2026-09-07'); on('2026-09-08', STATUS.INDEPENDENT); on('2026-09-10', STATUS.ASSISTED);
  setStatus(ensureDay(s, '2026-09-11'), 'explorer', STATUS.NOT_DONE, 1);   // explicit no
  ensureDay(s, '2026-09-09');                                                // recorded, unmarked
  on('2026-08-28');                                                          // last month
  assert.deepEqual(studyDays(s, 'explorer', '2026-09-07', T), ['2026-09-07', '2026-09-08', '2026-09-10']);
  const st = explorerStats(s, T);
  assert.equal(st.thisWeek, 3);
  assert.equal(st.thisMonth, 3);
  assert.equal(st.last30, 4);
  assert.equal(st.weeks.length, 4);
  assert.equal(st.weeks[3].days, 3);
  assert.equal(st.weeks[2].days, 0); // Aug 31–Sep 6: no records → 0, not an error
  assert.equal(st.lastStudied, '2026-09-10');
  assert.equal(st.last14.find((d) => d.key === '2026-09-09').studied, false);
  assert.equal(st.last14.find((d) => d.key === '2026-09-06').studied, false);
});

// ── MEMORY PROJECT ───────────────────────────────────────────────────────
test('memory project: one active by default; replace closes the old one; completed history retained', () => {
  const s = mk();
  const p1 = createProject(s, { title: 'İstiklâl Marşı — ilk iki kıta', type: 'PASSAGE', targetMonth: '2026-09' }, '2026-09-01');
  assert.equal(p1.status, PROJECT_STATUS.ACTIVE);
  assert.equal(activeProject(s).id, p1.id);
  assert.equal(createProject(s, { title: 'Başka' }, T), null);         // refused while one is active
  completeProject(s, p1.id, T);
  assert.equal(p1.completedAt, T);
  assert.equal(activeProject(s), null);
  const p2 = createProject(s, { title: 'Bir şarkı', type: 'SONG' }, T);
  const p3 = createProject(s, { title: 'Kısa şiir', type: 'POEM', targetMonth: '2026-10' }, T, { replace: true });
  assert.equal(s.memoryProjects[p2.id].status, PROJECT_STATUS.REPLACED);
  assert.equal(activeProject(s).id, p3.id);
  assert.equal(projectHistory(s).length, 3);
  assert.equal(p3.targetMonth, '2026-10');
  assert.equal(p2.targetMonth, '2026-09'); // defaults to the month it started
  assert.equal(reopenProject(s, p1.id), null); // something else is active
  completeProject(s, p3.id, T);
  assert.equal(reopenProject(s, p1.id).status, PROJECT_STATUS.ACTIVE);
});

// ── REFLECTION ───────────────────────────────────────────────────────────
test('reflection: save, edit, skip, history — never required', () => {
  const s = mk();
  const wk = '2026-09-07';
  assert.equal(isReflectionWindow(T), true);            // Saturday
  assert.equal(isReflectionWindow('2026-09-09'), false); // Wednesday
  assert.equal(reflectionPending(s, T), true);
  saveReflection(s, wk, { own: 'Çantamı hazırladım', learned: '', next: 'Sabah daha hızlı' }, T);
  let r = reflectionFor(s, wk);
  assert.equal(r.answers.own, 'Çantamı hazırladım');
  assert.equal(r.answers.learned, '');
  assert.equal(r.savedOn, T);
  assert.equal(reflectionPending(s, T), false);
  saveReflection(s, wk, { own: 'Çantamı hazırladım', learned: 'Dinozorlar', next: 'Sabah daha hızlı' }, '2026-09-13');
  r = reflectionFor(s, wk);
  assert.equal(r.answers.learned, 'Dinozorlar');
  assert.equal(r.savedOn, T);               // first save date kept
  assert.equal(r.updatedAt, '2026-09-13');
  // skip another week
  skipReflection(s, '2026-08-31', '2026-09-06');
  assert.equal(reflectionFor(s, '2026-08-31').skipped, true);
  assert.equal(reflectionHistory(s).map((x) => x.wk).join(','), '2026-09-07,2026-08-31');
  unskipReflection(s, '2026-08-31');
  assert.equal(reflectionFor(s, '2026-08-31'), null);
  // skip after answering keeps the answers
  skipReflection(s, wk, T); assert.equal(reflectionFor(s, wk).answers.own, 'Çantamı hazırladım');
});

// ── BACKWARD COMPATIBILITY / REGRESSION ──────────────────────────────────
test('old-v2 → new-v2: a pre-layer ey_v6 loads with safe defaults and nothing rewritten', async () => {
  const old = oldV2State();
  const storage = new MemoryStorage({ ey_v6: JSON.stringify(old), ey_v5: JSON.stringify(V1_BLOB) });
  const store = createStore({ storage, now: () => new Date(2026, 8, 12, 9) });
  const s = store.init();
  // new containers present with defaults
  assert.deepEqual(s.books, {}); assert.deepEqual(s.memorizationItems, {}); assert.deepEqual(s.memorizationReviews, {});
  assert.deepEqual(s.memoryProjects, {}); assert.deepEqual(s.weeklyReflections, {});
  assert.deepEqual(s.config.review, DEFAULT_REVIEW);
  // history untouched
  assert.deepEqual(s.days, old.days);
  assert.deepEqual(s.weeks, old.weeks);
  assert.deepEqual(s.legacy, old.legacy);
  assert.deepEqual(s.config.items, old.config.items);
  assert.equal(s.schemaVersion, 6);
  assert.equal(storage.getItem('ey_v5'), JSON.stringify(V1_BLOB));
  // analytics unchanged for existing records
  const st = independenceStats(s, '2026-09-10', '2026-09-10');
  assert.equal(st.independent, 1); assert.equal(st.unspecified, 1);
  // remote copy without the layer (Firebase drops empty objects) is adopted safely
  const remote = JSON.parse(JSON.stringify(old)); remote.meta = { updatedAt: Date.now() + 5000, writer: 'other' };
  store.replace(remote);
  assert.deepEqual(store.state.books, {});
  assert.deepEqual(store.state.config.review.intervals, DEFAULT_REVIEW.intervals);
});

test('new layer data survives a round trip through ensureShape and JSON', () => {
  const s = mk();
  const b = addBook(s, { title: 'Kitap', totalPages: 80 }, T); completeBook(s, b.id, T);
  const it = addMemoItem(s, { title: 'Fatiha' }, T); markMastered(s, it.id, T); recordReview(s, it.id, REVIEW_RESULT.SELF, '2026-09-13');
  createProject(s, { title: 'Şiir' }, T); saveReflection(s, '2026-09-07', { own: 'x' }, T);
  const back = ensureShape(JSON.parse(JSON.stringify(s)));
  assert.equal(back.books[b.id].finishedAt, T);
  assert.equal(back.memorizationItems[it.id].nextReviewAt, '2026-09-16');
  assert.equal(Object.keys(back.memorizationReviews).length, 1);
  assert.equal(activeProject(back).title, 'Şiir');
  assert.equal(reflectionFor(back, '2026-09-07').answers.own, 'x');
});
