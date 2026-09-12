import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialState } from '../src/core/migrate.js';
import { itemsForDay, coreItemsForDay } from '../src/core/schedule.js';
import { ensureDay, setStatus } from '../src/core/completion.js';
import { targetsFor } from '../src/core/physical.js';
import { visibleSteps } from '../src/core/routines.js';
import { activateSkill, evaluateGraduation, graduateSkill, autoAdvance, skillHistory } from '../src/core/skills.js';
import { weeklyStatus, monthlyStatus, isGoodDay } from '../src/core/rewards.js';
import { syncDiscoveries, expeditionView } from '../src/core/expedition.js';
import { independenceStats, isComeback, activeDaysInRow } from '../src/core/analytics.js';
import { addDays } from '../src/core/dates.js';

const mk = () => buildInitialState('2026-09-12');
const ids = (arr) => arr.map((i) => i.id);

test('weekday vs weekend schedule without duplicated lists', () => {
  const s = mk();
  activateSkill(s, 'bag', '2026-09-14');
  const wd = ensureDay(s, '2026-09-14'); // Monday
  const we = ensureDay(s, '2026-09-12'); // Saturday
  assert.deepEqual(ids(itemsForDay(s.config, '2026-09-14', wd)), ['morning', 'homework', 'explorer', 'reading', 'quran', 'prayer', 'physical', 'skill', 'evening']);
  // Little Explorer is a daily habit: it is on the weekend list too (schedule change is covered in daily.test.js)
  assert.deepEqual(ids(itemsForDay(s.config, '2026-09-12', we)), ['morning', 'explorer', 'reading', 'quran', 'prayer', 'physical', 'skill', 'presentation', 'evening']);
  // homework counts only when it exists
  assert.ok(!ids(coreItemsForDay(s.config, '2026-09-14', wd)).includes('homework'));
  wd.homework = 'exists';
  assert.ok(ids(coreItemsForDay(s.config, '2026-09-14', wd)).includes('homework'));
  wd.homework = 'none';
  assert.ok(ids(itemsForDay(s.config, '2026-09-14', wd)).includes('homework')); // shown in "no homework" state
  assert.ok(!ids(coreItemsForDay(s.config, '2026-09-14', wd)).includes('homework'));
  // weekend homework appears only when marked
  we.homework = 'exists';
  assert.ok(ids(itemsForDay(s.config, '2026-09-12', we)).includes('homework'));
  // presentation never counts at day level
  assert.ok(!ids(coreItemsForDay(s.config, '2026-09-12', we)).includes('presentation'));
});

test('Daily Physical Five follows the 7-day pattern by weekday', () => {
  const s = mk();
  const mon = targetsFor(s.config.physical, '2026-09-14');
  const tue = targetsFor(s.config.physical, '2026-09-15');
  const sun = targetsFor(s.config.physical, '2026-09-20');
  assert.deepEqual(mon.map((e) => e.target), [5, 15, 15, 8, 10]);
  assert.deepEqual(tue.map((e) => e.target), [6, 20, 20, 10, 15]);
  assert.deepEqual(sun.map((e) => e.target), [5, 15, 15, 8, 10]);
  s.config.physical.exercises[0].pattern[1] = 7; // parent edit
  assert.equal(targetsFor(s.config.physical, '2026-09-15')[0].target, 7);
});

test('routine progressive simplification', () => {
  const s = mk();
  const r = s.config.routines.morning;
  assert.equal(visibleSteps(r).length, 5);
  r.stage = 'practice';
  assert.deepEqual(visibleSteps(r).map((x) => x.id), ['face', 'bed', 'bag']);
  r.stage = 'mastered';
  assert.equal(visibleSteps(r).length, 0);
});

test('skill graduation engine with configurable thresholds and intact history', () => {
  const s = mk();
  activateSkill(s, 'bag', '2026-09-01');
  assert.equal(s.skills.pool.find((x) => x.id === 'bag').status, 'learning');
  const statuses = ['independent', 'independent', 'reminder', 'independent', 'independent', 'independent', 'independent', 'independent', 'independent', 'independent'];
  statuses.forEach((st, i) => { const k = addDays('2026-09-01', i); setStatus(ensureDay(s, k), 'skill', st); });
  assert.equal(skillHistory(s, 'bag').length, 10);
  const ev = evaluateGraduation(s, 'bag', '2026-09-10');
  assert.ok(ev.eligible, JSON.stringify(ev));
  assert.equal(ev.observed, 10);
  // tighten thresholds → not eligible
  s.skills.graduation.minIndependent = 0.95;
  assert.ok(!evaluateGraduation(s, 'bag', '2026-09-10').eligible);
  s.skills.graduation.minIndependent = 0.7;
  // learning → practicing automatically after 5 completions; graduation only with parent unless autoGraduate
  assert.equal(autoAdvance(s, '2026-09-10')?.type, 'practicing');
  assert.equal(autoAdvance(s, '2026-09-10'), null);
  s.skills.graduation.autoGraduate = true;
  assert.equal(autoAdvance(s, '2026-09-10')?.type, 'mastered');
  const skill = s.skills.pool.find((x) => x.id === 'bag');
  assert.equal(skill.status, 'mastered');
  assert.equal(skill.masteredAt, '2026-09-10');
  assert.equal(s.skills.activeId, null);
  assert.equal(skillHistory(s, 'bag').length, 10); // history retained
  assert.equal(s.achievements[0].type, 'skill_mastered');
  // a new active skill doesn't inherit the old history
  activateSkill(s, 'bed', '2026-09-11');
  assert.equal(evaluateGraduation(s, 'bed', '2026-09-11').observed, 0);
});

test('rewards: good days, weekly choice, monthly celebration; no stars anywhere', () => {
  const s = mk();
  const wk = '2026-09-07';
  for (let i = 0; i < 5; i++) {
    const k = addDays(wk, i);
    const d = ensureDay(s, k); d.homework = 'none';
    ['morning', 'explorer', 'reading', 'quran', 'prayer', 'physical', 'evening'].forEach((id) => setStatus(d, id, 'independent'));
  }
  assert.ok(isGoodDay(s, wk));
  let w = weeklyStatus(s, wk);
  assert.equal(w.goodDays, 5);
  assert.ok(!w.unlocked); // presentation required
  s.weeks[wk] = { presentation: { topic: 'Uzay', prepared: true, presented: true } };
  w = weeklyStatus(s, wk);
  assert.ok(w.unlocked);
  s.config.rewards.weekly.requirePresentation = false;
  s.weeks[wk] = {};
  assert.ok(weeklyStatus(s, wk).unlocked);
  const m = monthlyStatus(s, '2026-09');
  assert.equal(m.unlockedWeeks, 1);
  assert.ok(!m.unlocked);
  assert.ok(!JSON.stringify(s).includes('stars'));
});

test('expedition discoveries are monotone and write-once', () => {
  const s = mk();
  for (let i = 0; i < 3; i++) {
    const d = ensureDay(s, addDays('2026-09-07', i)); d.homework = 'none';
    ['morning', 'explorer', 'reading', 'quran', 'prayer', 'physical', 'evening'].forEach((id) => setStatus(d, id, 'independent'));
  }
  const fresh = syncDiscoveries(s, '2026-09-09');
  assert.deepEqual(fresh, ['bc_map']);
  assert.deepEqual(syncDiscoveries(s, '2026-09-10'), []);
  // a terrible day later changes nothing
  ensureDay(s, '2026-09-10');
  assert.equal(expeditionView(s).discoveredCount, 1);
  assert.equal(expeditionView(s).regions[0].state, 'active');
  assert.equal(expeditionView(s).next.id, 'bc_compass');
  // even if the parent raises the bar, discovered stays discovered
  s.config.rewards.goodDayRatio = 1;
  s.days['2026-09-07'].items.morning.status = 'not_done';
  assert.deepEqual(syncDiscoveries(s, '2026-09-11'), []);
  assert.equal(expeditionView(s).discoveredCount, 1);
});

test('independence analytics + comeback', () => {
  const s = mk();
  const d = ensureDay(s, '2026-09-08'); d.homework = 'exists';
  setStatus(d, 'morning', 'independent'); setStatus(d, 'homework', 'reminder'); setStatus(d, 'reading', 'assisted'); setStatus(d, 'quran', 'not_done');
  const st = independenceStats(s, '2026-09-01', '2026-09-08');
  assert.equal(st.applicable, 8); // morning, homework, explorer, reading, quran, prayer, physical, evening (no active skill)
  assert.equal(st.independent, 1); assert.equal(st.reminder, 1); assert.equal(st.assisted, 1);
  assert.equal(st.notDone, 5);
  assert.equal(st.completed, 3);
  assert.equal(st.classified, 3);
  assert.ok(Math.abs(st.rate - 1 / 3) < 1e-9);           // independent / classified
  assert.ok(Math.abs(st.completionRate - 3 / 8) < 1e-9); // completed / applicable
  assert.equal(st.classifiedRate, 1);                    // every completion classified
  ensureDay(s, '2026-09-12');
  assert.ok(isComeback(s, '2026-09-12'));
  assert.equal(activeDaysInRow(s, '2026-09-12'), 0);
});

test('skill activated mid-day shows up for today', async () => {
  const { effectiveSkillId, ensureDay: ed } = await import('../src/core/completion.js');
  const s = mk();
  const d = ed(s, '2026-09-14');
  assert.equal(d.skillId, null);
  activateSkill(s, 'bag', '2026-09-14');
  assert.equal(s.days['2026-09-14'].skillId, 'bag');
  // a day that already worked on another skill keeps it
  s.days['2026-09-14'].items.skill = { status: 'independent' };
  activateSkill(s, 'bed', '2026-09-14');
  assert.equal(s.days['2026-09-14'].skillId, 'bag');
  assert.equal(effectiveSkillId(s, s.days['2026-09-14']), 'bag');
  assert.equal(effectiveSkillId(s, { items: {} }), 'bed');
});
