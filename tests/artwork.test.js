import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ARTWORK, PREMIUM, dinoArt, dinoFocus, noteArt, premiumHero, dailyIcon } from '../src/content/artwork.js';
import { DEFAULT_EXPEDITION } from '../src/content/defaults.js';
import { FIELD_NOTES } from '../src/content/dinopedia.js';

// The artwork registry is the only place raster art may come from. These
// guard the rules docs/ARTWORK.md sets: relative in-repo paths only (never a
// web image), files that actually exist, and keys that the UI knows.

const SLOTS = ['worldHero', 'dinos', 'scenes', 'notes', 'companion'];
const isLocal = (p) => typeof p === 'string' && p.length > 0 && !/^(https?:)?\/\//i.test(p) && !p.startsWith('/') && !p.startsWith('data:');
const src = (v) => (typeof v === 'string' ? v : v?.src);
const premium = () => [...Object.values(PREMIUM.heroes).map(src), PREMIUM.map, PREMIUM.sign, PREMIUM.badge, PREMIUM.littleExplorer, ...Object.values(PREMIUM.daily)].filter(Boolean);
const all = () => [ARTWORK.worldHero?.src, ARTWORK.companion, ...Object.values(ARTWORK.dinos).map(src), ...Object.values(ARTWORK.scenes).map(src), ...Object.values(ARTWORK.notes), ...premium()].filter(Boolean);

test('artwork registry has exactly the documented slots', () => {
  assert.deepEqual(Object.keys(ARTWORK).sort(), [...SLOTS].sort());
  assert.equal(typeof ARTWORK.dinos, 'object');
  assert.equal(typeof ARTWORK.scenes, 'object');
  assert.equal(typeof ARTWORK.notes, 'object');
});

test('every registered path is a relative in-repo path, never a web image', () => {
  for (const p of all()) assert.ok(isLocal(p), p);
});

test('every registered file exists in the repo (no missing asset at runtime)', () => {
  for (const p of all()) assert.ok(existsSync(new URL('../' + p, import.meta.url)), `missing ${p}`);
});

test('registered dino keys, scene tones and note ids match the content', () => {
  const kinds = new Set(DEFAULT_EXPEDITION.items.filter((it) => it.type === 'card').map((it) => it.dino));
  const tones = new Set(DEFAULT_EXPEDITION.regions.map((r) => r.tone));
  const notes = new Set(FIELD_NOTES.map((n) => n.id));
  for (const k of Object.keys(ARTWORK.dinos)) assert.ok(kinds.has(k), `unknown dino kind ${k}`);
  for (const t of Object.keys(ARTWORK.scenes)) assert.ok(tones.has(t), `unknown scene tone ${t}`);
  for (const n of Object.keys(ARTWORK.notes)) assert.ok(notes.has(n), `unknown note ${n}`);
});

test('dinoArt / dinoFocus / noteArt fall back to null so the SVG is drawn', () => {
  assert.equal(dinoArt('trex'), ARTWORK.dinos.trex.src);
  assert.equal(dinoFocus('trex'), ARTWORK.dinos.trex.focus);
  assert.equal(dinoArt('mamenchisaurus'), null); // no clean source image → silhouette
  assert.equal(dinoFocus('mamenchisaurus'), null);
  assert.equal(dinoArt('not-a-dino'), null);
  assert.equal(noteArt('what'), ARTWORK.notes.what);
  assert.equal(noteArt('nope'), null);
});

test('premium package: web derivatives exist for every slot and helpers fall back to null', () => {
  for (const k of ['today', 'week', 'explore', 'secondary']) assert.ok(premiumHero(k)?.src, k);
  assert.equal(premiumHero('nope'), null);
  assert.ok(dailyIcon('face')); assert.ok(dailyIcon('homework')); assert.ok(dailyIcon('teeth'));
  assert.equal(dailyIcon('physical'), null); // no matching premium icon → glyph tile
  for (const p of premium()) assert.ok(p.endsWith('.webp') && p.startsWith('assets/artwork/web/'), p);
});
