import test from 'node:test';
import assert from 'node:assert/strict';
import { toKey, fromKey, addDays, isoWeekday, weekKey, weekDays, isWeekend, diffDays, range } from '../src/core/dates.js';

test('toKey uses local time, not UTC', () => {
  const d = new Date(2026, 8, 12, 0, 30); // 00:30 local
  assert.equal(toKey(d), '2026-09-12');
});
test('weekKey is Monday', () => {
  assert.equal(weekKey('2026-09-12'), '2026-09-07'); // Saturday → Monday
  assert.equal(weekKey('2026-09-13'), '2026-09-07'); // Sunday → same Monday
  assert.equal(weekKey('2026-09-14'), '2026-09-14');
});
test('isoWeekday Mon=0 Sun=6', () => {
  assert.equal(isoWeekday('2026-09-14'), 0);
  assert.equal(isoWeekday('2026-09-13'), 6);
  assert.ok(isWeekend('2026-09-12') && !isWeekend('2026-09-11'));
});
test('addDays / diffDays / range across month boundary', () => {
  assert.equal(addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(diffDays('2026-09-01', '2026-10-01'), 30);
  assert.equal(range('2026-09-29', '2026-10-02').length, 4);
  assert.equal(weekDays('2026-09-07')[6], '2026-09-13');
  assert.equal(toKey(fromKey('2026-02-28')), '2026-02-28');
});
