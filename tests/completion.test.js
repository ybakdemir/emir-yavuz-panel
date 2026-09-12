import test from 'node:test';
import assert from 'node:assert/strict';
import { STATUS } from '../src/content/defaults.js';
import { buildInitialState, convertV1Day, importLegacy } from '../src/core/migrate.js';
import { ensureDay, setStatus, complete, isCompleted, isClassified, isUnspecified, DEFAULT_COMPLETION } from '../src/core/completion.js';
import { independenceStats } from '../src/core/analytics.js';
import { activateSkill, evaluateGraduation, autoAdvance } from '../src/core/skills.js';
import { dayCompletion, isGoodDay } from '../src/core/rewards.js';
import { addDays } from '../src/core/dates.js';
import { V1_BLOB } from './fixtures.js';

const mk = () => buildInitialState('2026-09-12');
const CORE = ['morning', 'explorer', 'reading', 'quran', 'prayer', 'physical', 'evening'];

test('a plain completion is COMPLETED_UNSPECIFIED, never independent', () => {
  const s = mk();
  const d = ensureDay(s, '2026-09-14'); d.homework = 'none';
  complete(d, 'reading', 1000);
  assert.equal(DEFAULT_COMPLETION, STATUS.COMPLETED_UNSPECIFIED);
  assert.equal(d.items.reading.status, STATUS.COMPLETED_UNSPECIFIED);
  assert.equal(d.items.reading.status, 'done'); // wire value shared with imported v1 ticks
  assert.ok(isCompleted(d.items.reading.status));
  assert.ok(isUnspecified(d.items.reading.status));
  assert.ok(!isClassified(d.items.reading.status));
  assert.ok(isClassified(STATUS.NOT_DONE));
  // it still counts as done for the day (child feedback, good days, expedition)
  assert.equal(dayCompletion(s, '2026-09-14').done, 1);
});

test('unspecified completions never raise the Independent Completion Rate', () => {
  const s = mk();
  const d = ensureDay(s, '2026-09-14'); d.homework = 'none';
  CORE.forEach((id) => complete(d, id));
  let st = independenceStats(s, '2026-09-14', '2026-09-14');
  assert.equal(st.applicable, 7);
  assert.equal(st.completed, 7);
  assert.equal(st.unspecified, 7);
  assert.equal(st.independent, 0);
  assert.equal(st.rate, 0);
  assert.equal(st.completionRate, 1);
  assert.equal(st.classifiedRate, 0);
  assert.ok(isGoodDay(s, '2026-09-14')); // completion is still rewarded
  // explicit classification afterwards moves the needle
  setStatus(d, 'reading', STATUS.INDEPENDENT);
  setStatus(d, 'quran', STATUS.REMINDER);
  setStatus(d, 'prayer', STATUS.ASSISTED);
  st = independenceStats(s, '2026-09-14', '2026-09-14');
  assert.equal(st.independent, 1); assert.equal(st.reminder, 1); assert.equal(st.assisted, 1);
  assert.equal(st.unspecified, 4);
  assert.ok(Math.abs(st.rate - 1 / 7) < 1e-9);
  assert.ok(Math.abs(st.classifiedRate - 3 / 7) < 1e-9);
});

test('reclassifying keeps the original completion time and records classifiedAt', () => {
  const s = mk();
  const d = ensureDay(s, '2026-09-14');
  complete(d, 'reading', 1000);
  setStatus(d, 'reading', STATUS.INDEPENDENT, 5000);
  assert.equal(d.items.reading.at, 1000);
  assert.equal(d.items.reading.classifiedAt, 5000);
  // back to unspecified is allowed (chip un-pick) and the history is not lost
  setStatus(d, 'reading', STATUS.COMPLETED_UNSPECIFIED, 6000);
  assert.equal(d.items.reading.at, 1000);
  assert.equal(d.items.reading.classifiedAt, 6000);
  // marking not done is a fresh mark
  setStatus(d, 'reading', STATUS.NOT_DONE, 7000);
  assert.equal(d.items.reading.at, 7000);
  assert.equal(d.items.reading.classifiedAt, undefined);
});

test('migrated v1 ticks are unspecified — no independence is invented', () => {
  const day = convertV1Day(V1_BLOB.days[1]);
  for (const it of Object.values(day.items)) assert.equal(it.status, STATUS.COMPLETED_UNSPECIFIED);
  const s = mk();
  importLegacy(s, V1_BLOB, 'firebase', '2026-09-12');
  const st = independenceStats(s, '2026-04-01', '2026-05-31');
  assert.ok(st.completed > 0);
  assert.equal(st.independent, 0);
  assert.equal(st.reminder, 0);
  assert.equal(st.assisted, 0);
  assert.equal(st.unspecified, st.completed);
  assert.equal(st.rate, 0);
  assert.ok(st.completionRate > 0);
});

test('skill graduation does not count unspecified completions as independent', () => {
  const s = mk();
  activateSkill(s, 'bag', '2026-09-01');
  for (let i = 0; i < 10; i++) complete(ensureDay(s, addDays('2026-09-01', i)), 'skill');
  const ev = evaluateGraduation(s, 'bag', '2026-09-10');
  assert.equal(ev.observed, 10);
  assert.equal(ev.completed, 10);
  assert.equal(ev.independent, 0);
  assert.equal(ev.independence, 0);
  assert.equal(ev.lastN.independent, 0);
  assert.ok(!ev.eligible);
  // completions still advance LEARNING → PRACTICING (that is about doing, not independence)
  assert.equal(autoAdvance(s, '2026-09-10')?.type, 'practicing');
  s.skills.graduation.autoGraduate = true;
  assert.equal(autoAdvance(s, '2026-09-10'), null);
});
