import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { APP_ICONS, DEFAULT_APP_ICON, PLATFORM_ICON, appIcon } from '../src/content/appIcons.js';
import { DEFAULT_SETTINGS } from '../src/content/defaults.js';
import { buildInitialState, ensureShape } from '../src/core/migrate.js';
import { createStore } from '../src/core/store.js';

const here = (p) => new URL('../' + p, import.meta.url);

test('icon registry: calendar default, dinosaur and growth alternatives, every file present', () => {
  assert.deepEqual(APP_ICONS.map((i) => i.id), ['calendar', 'dinosaur', 'growth']);
  assert.equal(DEFAULT_APP_ICON, 'calendar');
  assert.equal(DEFAULT_SETTINGS.appIcon, 'calendar');
  for (const i of APP_ICONS) assert.ok(existsSync(here(i.src)), `missing ${i.src}`);
  for (const p of [PLATFORM_ICON.favicon, PLATFORM_ICON.apple, ...PLATFORM_ICON.manifest]) assert.ok(existsSync(here(p)), `missing ${p}`);
});

test('appIcon() resolves ids and falls back to the default for unknown / missing values', () => {
  assert.equal(appIcon('dinosaur').id, 'dinosaur');
  assert.equal(appIcon('growth').label, 'Growth');
  assert.equal(appIcon(undefined).id, 'calendar');
  assert.equal(appIcon('nope').id, 'calendar');
});

test('index.html and the manifest point at the real calendar platform icon', () => {
  const html = readFileSync(here('index.html'), 'utf8');
  assert.ok(html.includes(`rel="icon" type="image/png" sizes="192x192" href="${PLATFORM_ICON.favicon}"`));
  assert.ok(html.includes(`rel="apple-touch-icon" sizes="180x180" href="${PLATFORM_ICON.apple}"`));
  assert.ok(html.includes('rel="manifest" href="manifest.webmanifest"'));
  const manifest = JSON.parse(readFileSync(here('manifest.webmanifest'), 'utf8'));
  assert.deepEqual(manifest.icons.map((i) => i.src), PLATFORM_ICON.manifest);
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
});

test('the choice persists through the normal settings path and older states get the default', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const store = createStore({ storage });
  store.init();
  assert.equal(store.state.config.settings.appIcon, 'calendar');
  store.update((s) => { s.config.settings.appIcon = 'dinosaur'; });
  const reloaded = createStore({ storage });
  reloaded.init();
  assert.equal(reloaded.state.config.settings.appIcon, 'dinosaur');
  // a state saved before the setting existed is back-filled, never broken
  const old = buildInitialState('2026-09-12');
  delete old.config.settings.appIcon;
  assert.equal(ensureShape(old, '2026-09-13').config.settings.appIcon, 'calendar');
});
