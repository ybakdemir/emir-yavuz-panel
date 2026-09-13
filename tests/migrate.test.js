import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitialState, importLegacy, convertV1Day, readLocalV1, ensureShape } from '../src/core/migrate.js';
import { createStore } from '../src/core/store.js';
import { V1_BLOB, MemoryStorage } from './fixtures.js';
import { STATUS } from '../src/content/defaults.js';

test('convertV1Day maps routine steps, simple items and physical', () => {
  const day = convertV1Day(V1_BLOB.days[1]);
  assert.equal(day.dayType, 'weekday');
  assert.equal(day.items.morning.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.equal(day.items.evening.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.equal(day.items.quran.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.equal(day.items.prayer.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.equal(day.items.reading.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.equal(day.items.explorer.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.equal(day.items.homework.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.equal(day.homework, 'exists');
  assert.equal(day.items.physical.status, STATUS.COMPLETED_UNSPECIFIED); // 'done' on the wire
  assert.deepEqual(day.physical, { pushup: true, squat: true });
  assert.deepEqual(day.steps.morning, { face: true, dress: true, breakfast: true, bag: true });
  assert.equal(day.legacy.stars, 25);
  assert.deepEqual(day.legacy.tikler, V1_BLOB.days[1].tikler);
});

test('partial legacy day does not over-claim completion', () => {
  const day = convertV1Day(V1_BLOB.days[3]); // s1,s2,s14 only
  assert.equal(day.dayType, 'weekend');
  assert.equal(day.items.morning, undefined);
  assert.equal(day.items.physical, undefined);
  assert.equal(day.physical.pushup, true);
  assert.equal(day.homework, 'unknown');
});

test('importLegacy is idempotent, keeps archive, imports unsaved today and presentation', () => {
  const s = buildInitialState('2026-09-12');
  const added = importLegacy(s, V1_BLOB, 'firebase', '2026-09-12');
  assert.equal(added, 5); // 4 days + unsaved today_done
  assert.equal(s.days['2026-05-02'].legacy.unsaved, true);
  assert.equal(s.weeks['2026-04-13'].presentation.presented, true);
  assert.deepEqual(s.legacy.v1.firebase, V1_BLOB);
  // second import: nothing changes
  s.days['2026-04-13'].items.reading = { status: 'independent' };
  assert.equal(importLegacy(s, V1_BLOB, 'firebase', '2026-09-13'), 0);
  assert.equal(s.days['2026-04-13'].items.reading.status, 'independent');
  assert.equal(Object.keys(s.days).length, 5);
});

test('readLocalV1 merges ey_v5 with stray ey_today_* keys', () => {
  const storage = new MemoryStorage({
    ey_v5: JSON.stringify({ days: V1_BLOB.days.slice(0, 2), stats: {}, wExtra: {}, mExtra: {} }),
    'ey_today_2026-04-30': JSON.stringify({ done: { a1: true }, mode: 'haftaici' }),
    'ey_today_2026-05-01': JSON.stringify({ done: {}, mode: 'haftaici' }), // empty → ignored
  });
  const v1 = readLocalV1(storage);
  assert.equal(v1.days.length, 3);
  assert.equal(v1.days[2].unsaved, true);
});

test('store.init migrates local v1 into ey_v6 and never touches ey_v5', () => {
  const storage = new MemoryStorage({ ey_v5: JSON.stringify(V1_BLOB) });
  const store = createStore({ storage, now: () => new Date(2026, 8, 12, 9) });
  const st = store.init();
  assert.equal(st.schemaVersion, 6);
  assert.equal(Object.keys(st.days).length, 5);
  assert.equal(storage.getItem('ey_v5'), JSON.stringify(V1_BLOB));
  assert.ok(storage.getItem('ey_v6'));
  // second boot loads v2 without re-importing
  const store2 = createStore({ storage, now: () => new Date(2026, 8, 13, 9) });
  const st2 = store2.init();
  assert.equal(Object.keys(st2.days).length, 5);
  assert.equal(st2.legacy.sources.localStorage, '2026-09-12');
});

test('attachRemote: adopts newer remote, imports remote v1 once, pushes when local newer', async () => {
  const storage = new MemoryStorage();
  const store = createStore({ storage, now: () => new Date(2026, 8, 12, 9) });
  store.init();
  let written = null; let changeCb = null;
  const adapter = {
    readV2: async () => null,
    readV1: async () => V1_BLOB,
    write: async (s) => { written = JSON.parse(JSON.stringify(s)); },
    onChange: (cb) => { changeCb = cb; },
  };
  await store.attachRemote(adapter);
  assert.equal(Object.keys(store.state.days).length, 5);
  assert.equal(store.state.legacy.sources.firebase, '2026-09-12');
  await new Promise((r) => setTimeout(r, 700));
  assert.ok(written && written.legacy);
  // remote change from another writer with newer timestamp is adopted
  const incoming = JSON.parse(JSON.stringify(store.state));
  incoming.meta = { updatedAt: Date.now() + 1000, writer: 'other' };
  incoming.days['2026-09-12'] = { items: { reading: { status: 'independent' } } };
  changeCb(incoming);
  assert.equal(store.state.days['2026-09-12'].items.reading.status, 'independent');
  assert.deepEqual(store.state.days['2026-09-12'].steps, {}); // ensureShape restored containers
  // own echo ignored
  const echo = JSON.parse(JSON.stringify(store.state)); echo.meta.writer = store.writer; echo.meta.updatedAt += 5000; echo.days = {};
  changeCb(echo);
  assert.ok(Object.keys(store.state.days).length > 0);
});

test('ensureShape fills new config sections without overwriting', () => {
  const s = ensureShape({ config: { settings: { childName: 'X' } }, days: { '2026-01-01': {} } });
  assert.equal(s.config.settings.childName, 'X');
  assert.equal(s.config.settings.parentPin, '');
  assert.ok(s.config.physical.exercises.length === 5);
  assert.deepEqual(s.days['2026-01-01'].items, {});
});

test('attachRemote: a denied /data read does not break v2 sync (auth != null rules)', async () => {
  const storage = new MemoryStorage();
  const store = createStore({ storage, now: () => new Date(2026, 8, 12, 9) });
  store.init();
  let status = null; let changeCb = null; let writes = 0;
  const adapter = {
    readV2: async () => null,
    readV1: async () => { throw new Error('PERMISSION_DENIED'); },
    write: async () => { writes++; },
    onChange: (cb) => { changeCb = cb; },
  };
  await store.attachRemote(adapter, (s) => { status = s; });
  assert.equal(status, 'ok');
  assert.ok(typeof changeCb === 'function'); // realtime listener still attached
  assert.equal(store.state.legacy, null);      // import will be retried on a later boot
  await new Promise((r) => setTimeout(r, 700));
  assert.equal(writes, 1);                     // local state still pushed to /v2
});

test('attachRemote: a fresh install (second device) adopts the existing remote v2 instead of overwriting it', async () => {
  // phone: has real data on the shared node
  const node = { v2: null, subs: [] };
  const adapter = () => ({ readV2: async () => node.v2, readV1: async () => null, write: async (s) => { node.v2 = JSON.parse(JSON.stringify(s)); node.subs.forEach((cb) => cb(node.v2)); }, onChange: (cb) => node.subs.push(cb) });
  const phone = createStore({ storage: new MemoryStorage() }); phone.init();
  await phone.attachRemote(adapter());
  phone.update((s) => { s.config.settings.appIcon = 'growth'; s.days['2026-09-12'] = { items: { reading: { status: 'independent' } }, steps: {} }; });
  await new Promise((r) => setTimeout(r, 700));
  assert.equal(node.v2.config.settings.appIcon, 'growth');
  // tablet: brand-new install, boots later than the phone's last write
  const tablet = createStore({ storage: new MemoryStorage() }); tablet.init();
  assert.equal(tablet.state.meta.updatedAt, 0);
  await tablet.attachRemote(adapter());
  await new Promise((r) => setTimeout(r, 700));
  assert.equal(tablet.state.config.settings.appIcon, 'growth');
  assert.equal(tablet.state.days['2026-09-12'].items.reading.status, 'independent');
  assert.equal(node.v2.config.settings.appIcon, 'growth'); // remote untouched by the empty device
  // and a change on the tablet reaches the phone live
  tablet.update((s) => { s.config.settings.appIcon = 'dinosaur'; });
  await new Promise((r) => setTimeout(r, 700));
  assert.equal(phone.state.config.settings.appIcon, 'dinosaur');
  assert.equal(phone.state.days['2026-09-12'].items.reading.status, 'independent');
});
