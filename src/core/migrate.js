import {
  SCHEMA_VERSION, STATUS, DEFAULT_ROUTINES, DEFAULT_ITEMS, DEFAULT_PHYSICAL, DEFAULT_SKILL_POOL,
  DEFAULT_GRADUATION, DEFAULT_REWARDS, DEFAULT_PRESENTATION, DEFAULT_EXPEDITION, DEFAULT_SETTINGS, DEFAULT_REVIEW,
} from '../content/defaults.js';
import { weekKey, todayKey } from './dates.js';
import { emptyDay } from './completion.js';
import { developmentCounts } from './expedition.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

/** Fresh v2 state seeded from defaults. */
export function buildInitialState(today, writer = 'init') {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: today,
    config: {
      routines: clone(DEFAULT_ROUTINES),
      items: clone(DEFAULT_ITEMS),
      physical: clone(DEFAULT_PHYSICAL),
      presentation: clone(DEFAULT_PRESENTATION),
      rewards: clone(DEFAULT_REWARDS),
      expedition: clone(DEFAULT_EXPEDITION),
      settings: clone(DEFAULT_SETTINGS),
      review: clone(DEFAULT_REVIEW),
    },
    skills: {
      pool: DEFAULT_SKILL_POOL.map((s) => ({ ...s, status: 'pool' })),
      activeId: null,
      graduation: clone(DEFAULT_GRADUATION),
    },
    days: {},
    weeks: {},
    months: {},
    expedition: { discovered: {}, reasons: {}, milestoneSeen: { mastered: 0, presentations: 0, memory: 0, english: 0, month: 0 }, milestonesSince: today },
    achievements: [],
    // Learning memory layer — keyed by id (Firebase keeps keyed objects intact,
    // and drops them when empty; ensureShape puts the containers back).
    books: {},
    reading: { activeBookId: null },
    memorizationItems: {},
    memorizationReviews: {},
    memorizationDaily: {},   // Daily Review Pool: today's frozen set per day key (core/dailyReview.js)
    memoryProjects: {},
    weeklyReflections: {},
    legacy: null,
    upgrades: { explorerDaily: today, typedReviewPool: today, mapFact: today }, // one-time data upgrades already applied (see ensureShape)
    meta: { updatedAt: 0, writer },
  };
}

/**
 * Restore containers that Firebase drops when empty, and fill any config
 * section a newer build introduced. Existing values are never overwritten.
 */
export function ensureShape(state, today = todayKey()) {
  const init = buildInitialState(state.createdAt || '1970-01-01');
  state.schemaVersion ||= SCHEMA_VERSION;
  state.config ||= {};
  for (const k of Object.keys(init.config)) state.config[k] ||= init.config[k];
  for (const k of Object.keys(init.config.settings)) if (state.config.settings[k] === undefined) state.config.settings[k] = init.config.settings[k];
  for (const k of Object.keys(init.config.rewards)) if (state.config.rewards[k] === undefined) state.config.rewards[k] = init.config.rewards[k];
  state.config.items ||= init.config.items;
  state.config.routines ||= init.config.routines;
  for (const r of Object.values(state.config.routines)) r.steps ||= [];
  state.config.physical.exercises ||= init.config.physical.exercises;
  state.config.expedition.regions ||= init.config.expedition.regions;
  state.config.expedition.items ||= init.config.expedition.items;
  // Expedition items a newer build introduced are slotted in at their default
  // position; nothing already in the list is moved, removed or re-discovered.
  init.config.expedition.items.forEach((item, i) => {
    if (!state.config.expedition.items.some((x) => x.id === item.id)) state.config.expedition.items.splice(Math.min(i, state.config.expedition.items.length), 0, clone(item));
  });
  state.config.expedition.milestones ||= clone(DEFAULT_EXPEDITION.milestones);
  for (const k of Object.keys(DEFAULT_EXPEDITION.milestones)) if (state.config.expedition.milestones[k] === undefined) state.config.expedition.milestones[k] = DEFAULT_EXPEDITION.milestones[k];
  state.config.rewards.weekly.options ||= [];
  state.config.rewards.monthly.options ||= [];
  state.config.presentation.topics ||= [];
  state.config.presentation.indicators ||= init.config.presentation.indicators;
  state.skills ||= init.skills;
  state.skills.pool ||= [];
  state.skills.graduation ||= init.skills.graduation;
  for (const k of Object.keys(init.skills.graduation)) if (state.skills.graduation[k] === undefined) state.skills.graduation[k] = init.skills.graduation[k];
  if (state.skills.activeId === undefined) state.skills.activeId = null;
  state.days ||= {}; state.weeks ||= {}; state.months ||= {};
  for (const d of Object.values(state.days)) { d.items ||= {}; d.steps ||= {}; d.physical ||= {}; }
  state.expedition ||= { discovered: {} };
  state.expedition.discovered ||= {};
  state.expedition.reasons ||= {};
  state.expedition.milestoneSeen ||= { memory: 0, english: 0, month: 0 };
  // Milestone discoveries only count from the day this build first saw the
  // state, so an upgrade never hands out a burst for old history.
  state.expedition.milestonesSince ||= today;
  // Graduations and presentations are all-time counts; the ledger absorbs
  // whatever exists on first sight (the old good-day formula already credited
  // them as steps), so only the *next* one opens a find. See syncDiscoveries.
  const seen = state.expedition.milestoneSeen;
  if (seen.mastered === undefined || seen.presentations === undefined) {
    const dev = developmentCounts(state);
    seen.mastered ??= dev.mastered;
    seen.presentations ??= dev.presentations;
  }
  state.achievements ||= [];
  // Learning memory layer: a state saved before it existed gets empty
  // collections and the default review schedule; nothing else is touched.
  state.config.review.intervals ||= clone(DEFAULT_REVIEW.intervals);
  if (state.config.review.needsWorkDays === undefined) state.config.review.needsWorkDays = DEFAULT_REVIEW.needsWorkDays;
  if (state.config.review.dailyTarget === undefined) state.config.review.dailyTarget = DEFAULT_REVIEW.dailyTarget;
  state.memorizationDaily ||= {};
  state.books ||= {};
  state.reading ||= { activeBookId: null };
  if (state.reading.activeBookId === undefined) state.reading.activeBookId = null;
  state.memorizationItems ||= {};
  state.memorizationReviews ||= {};
  state.memoryProjects ||= {};
  state.weeklyReflections ||= {};
  if (state.legacy === undefined) state.legacy = null;
  // One-time upgrade: Little Explorer became a daily habit. Applied from
  // `today` on (schedule.daysFor), so every earlier day keeps the weekday
  // rule and no past ratio or good day changes. Parents can still change the
  // rule in Settings; the marker stops it from being re-applied.
  state.upgrades ||= {};
  if (!state.upgrades.explorerDaily) {
    const ex = state.config.items.find((it) => it.id === 'explorer');
    if (ex && ex.days === 'weekday' && !ex.daysNow) { ex.daysFrom = today; ex.daysNow = 'all'; }
    state.upgrades.explorerDaily = today;
  }
  // One-time upgrade: the Daily Review Pool became type-aware (SURA in by
  // default, POEM / SONG / OTHER out). The previous build wrote
  // `dailyReviewEnabled: true` on every mastered item, indistinguishable from
  // a parent's choice — so system `true` is dropped (the type default takes
  // over) and every `false`, which only a parent could have set, survives.
  if (!state.upgrades.typedReviewPool) {
    for (const it of Object.values(state.memorizationItems || {})) if (it?.dailyReviewEnabled === true) delete it.dailyReviewEnabled;
    state.upgrades.typedReviewPool = today;
  }
  // One-time copy fix: the first find's fact described the retired good-day
  // rule. Only the untouched default text is replaced; an edited fact stays.
  if (!state.upgrades.mapFact) {
    const bc = state.config.expedition.items.find((it) => it.id === 'bc_map');
    if (bc && bc.fact === 'Her tamamlanan gün haritada bir adım demek.') bc.fact = init.config.expedition.items.find((it) => it.id === 'bc_map').fact;
    state.upgrades.mapFact = today;
  }
  state.meta ||= { updatedAt: 0, writer: 'unknown' };
  return state;
}

// ── v1 → v2 ──────────────────────────────────────────────────────────────
// v1 task ids → v2 targets. Anything not listed is preserved only in the archive.
const V1_MAP = {
  a1: 'morning.face', a2: 'morning.dress', a3: 'morning.breakfast', a4: 'morning.bag',
  s1: 'morning.face', s2: 'morning.dress', s3: 'morning.breakfast',
  e2: 'morning.bed', s16: 'morning.bed',
  f1: 'evening.teeth', f2: 'evening.tomorrow', f3: 'evening.story', f4: 'evening.dua',
  s18: 'evening.teeth', s19: 'evening.story', s20: 'evening.dua',
  b1: 'quran', b2: 'quran', s4: 'quran', s5: 'quran',
  b3: 'prayer', s6: 'prayer',
  c1: 'homework', c2: 'reading', s7: 'reading', c3: 'explorer',
  d1: 'physical.pushup', d3: 'physical.squat', s14: 'physical.pushup', s16k: 'physical.squat',
};

/** Convert one v1 day (tikler map) into a v2 day record flagged legacy. */
export function convertV1Day(rec) {
  const ticks = rec.tikler || rec.done || {};
  const day = emptyDay({
    dayType: rec.mode === 'haftasonu' ? 'weekend' : 'weekday',
    legacy: { stars: rec.stars ?? null, mode: rec.mode || null, tikler: ticks, unsaved: !!rec.unsaved },
    skillId: null,
  });
  const routineTicks = { morning: 0, evening: 0 };
  const physTicks = new Set();
  for (const [id, on] of Object.entries(ticks)) {
    if (!on || !V1_MAP[id]) continue;
    const [target, sub] = V1_MAP[id].split('.');
    if (target === 'morning' || target === 'evening') {
      day.steps[target] ||= {}; day.steps[target][sub] = true; routineTicks[target]++;
    } else if (target === 'physical') {
      day.physical[sub] = true; physTicks.add(sub);
    } else {
      // v1 only knew "ticked"; independence was never recorded → unspecified.
      day.items[target] = { status: STATUS.COMPLETED_UNSPECIFIED };
      if (target === 'homework') day.homework = 'exists';
    }
  }
  if (routineTicks.morning >= 3) day.items.morning = { status: STATUS.COMPLETED_UNSPECIFIED };
  if (routineTicks.evening >= 3) day.items.evening = { status: STATUS.COMPLETED_UNSPECIFIED };
  if (physTicks.has('pushup') && physTicks.has('squat')) day.items.physical = { status: STATUS.COMPLETED_UNSPECIFIED };
  return day;
}

/**
 * Merge a v1 blob (from Firebase `/data` or localStorage `ey_v5`/`ey_today_*`)
 * into v2. Idempotent: never overwrites an existing v2 day, never deletes,
 * archives the raw blob per source. Returns the number of days added.
 */
export function importLegacy(state, v1, source, importedAt) {
  if (!v1) return 0;
  state.legacy ||= { importedAt, sources: {}, v1: {} };
  state.legacy.sources[source] = importedAt;
  state.legacy.v1[source] = clone(v1);
  let added = 0;
  const records = [];
  const daysArr = Array.isArray(v1.days) ? v1.days : Object.values(v1.days || {});
  daysArr.forEach((r) => { if (r && r.date) records.push(r); });
  // v1 kept "today" outside days[] until the user pressed Kaydet — don't lose it.
  if (v1.today_date && v1.today_done && Object.values(v1.today_done).some(Boolean)) {
    if (!records.find((r) => r.date === v1.today_date)) {
      records.push({ date: v1.today_date, mode: v1.today_mode, tikler: v1.today_done, unsaved: true });
    }
  }
  for (const rec of records) {
    if (state.days[rec.date]) continue;
    state.days[rec.date] = convertV1Day(rec);
    added++;
  }
  // Weekly "haftanın sunumunu yap" (we2) → presentation history.
  for (const [wkRaw, obj] of Object.entries(v1.wExtra || {})) {
    if (!obj?.we2) continue;
    const wk = weekKey(wkRaw);
    state.weeks[wk] ||= {};
    if (!state.weeks[wk].presentation) state.weeks[wk].presentation = { topic: 'Eski kayıt', prepared: true, presented: true, presentedOn: wk, legacy: true };
  }
  return added;
}

/** Read every v1 key from a localStorage-like object into one v1 blob. */
export function readLocalV1(storage) {
  let blob = null;
  try {
    const raw = storage.getItem('ey_v5');
    if (raw) blob = JSON.parse(raw);
  } catch { /* ignore corrupt */ }
  const extraDays = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!k || !k.startsWith('ey_today_')) continue;
    try {
      const v = JSON.parse(storage.getItem(k));
      if (v?.done && Object.values(v.done).some(Boolean)) extraDays.push({ date: k.slice(9), mode: v.mode, tikler: v.done, unsaved: true });
    } catch { /* ignore */ }
  }
  if (!blob && !extraDays.length) return null;
  blob ||= { days: [] };
  blob.days = Array.isArray(blob.days) ? blob.days : Object.values(blob.days || {});
  for (const d of extraDays) if (!blob.days.find((x) => x.date === d.date)) blob.days.push(d);
  return blob;
}
