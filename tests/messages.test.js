import test from 'node:test';
import assert from 'node:assert/strict';
import { STATUS } from '../src/content/defaults.js';
import { buildInitialState } from '../src/core/migrate.js';
import { ensureDay, setStatus, complete } from '../src/core/completion.js';
import { independenceStats } from '../src/core/analytics.js';
import { weeklyMessageFor, WEEKLY_MSG, MIN_CLASSIFIED_FOR_INDEPENDENCE_CLAIM } from '../src/core/messages.js';

// Week of Mon 2026-09-14 … Sun 2026-09-20, message computed on Wednesday.
const FROM = '2026-09-14', TO = '2026-09-16';
const ALL = ['morning', 'explorer', 'reading', 'quran', 'prayer', 'physical', 'evening'];

/** One recorded day, every core task done (unspecified), then `marks` applied on top. */
function week(marks) {
  const s = buildInitialState('2026-09-12');
  const d = ensureDay(s, FROM); d.homework = 'none';
  ALL.forEach((id) => complete(d, id));
  for (const [id, st] of Object.entries(marks)) setStatus(d, id, st);
  return s;
}
const msg = (s) => weeklyMessageFor(independenceStats(s, FROM, TO));

test('weekly message: 1/1 independent (100%) does not claim independence', () => {
  const s = week({ reading: STATUS.INDEPENDENT });
  const st = independenceStats(s, FROM, TO);
  assert.equal(st.rate, 1); assert.equal(st.classified, 1);
  assert.equal(msg(s), WEEKLY_MSG.neutral);
});

test('weekly message: 2/2 independent (100%) still does not claim independence', () => {
  const s = week({ reading: STATUS.INDEPENDENT, quran: STATUS.INDEPENDENT });
  const st = independenceStats(s, FROM, TO);
  assert.equal(st.rate, 1); assert.equal(st.classified, 2);
  assert.equal(msg(s), WEEKLY_MSG.neutral);
});

test('weekly message: 3/3 independent may trigger the strong message', () => {
  const s = week({ reading: STATUS.INDEPENDENT, quran: STATUS.INDEPENDENT, prayer: STATUS.INDEPENDENT });
  const st = independenceStats(s, FROM, TO);
  assert.equal(st.classified, MIN_CLASSIFIED_FOR_INDEPENDENCE_CLAIM);
  assert.equal(msg(s), WEEKLY_MSG.strong);
});

test('weekly message: 2 independent + 1 reminder → rate 67% < 70%, evidence enough → "next step" message', () => {
  const s = week({ reading: STATUS.INDEPENDENT, quran: STATUS.INDEPENDENT, prayer: STATUS.REMINDER });
  const st = independenceStats(s, FROM, TO);
  assert.equal(st.classified, 3);
  assert.ok(Math.abs(st.rate - 2 / 3) < 1e-9);
  assert.equal(msg(s), WEEKLY_MSG.nextStep);
  // 3 independent + 1 reminder → 75% ≥ 70% with 4 classified → strong
  const s2 = week({ reading: STATUS.INDEPENDENT, quran: STATUS.INDEPENDENT, prayer: STATUS.INDEPENDENT, morning: STATUS.REMINDER });
  assert.ok(independenceStats(s2, FROM, TO).rate >= 0.7);
  assert.equal(msg(s2), WEEKLY_MSG.strong);
});

test('weekly message: insufficient classified data uses the neutral completion message', () => {
  // all done, nothing classified (also the shape of a migrated v1 week)
  const s = week({});
  const st = independenceStats(s, FROM, TO);
  assert.equal(st.classified, 0); assert.equal(st.rate, null); assert.equal(st.completionRate, 1);
  assert.equal(msg(s), WEEKLY_MSG.neutral);
  // low completion and no evidence → restart message, never an independence claim
  const s2 = week({ reading: STATUS.NOT_DONE, quran: STATUS.NOT_DONE, prayer: STATUS.NOT_DONE, morning: STATUS.NOT_DONE });
  assert.ok(independenceStats(s2, FROM, TO).completionRate < 0.7);
  assert.equal(msg(s2), WEEKLY_MSG.restart);
  // no record at all in the window → new-week message
  assert.equal(weeklyMessageFor(independenceStats(buildInitialState('2026-09-12'), FROM, TO)), WEEKLY_MSG.newWeek);
});
