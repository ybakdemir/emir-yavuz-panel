import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTWORK, dinoArt } from '../src/content/artwork.js';
import { DEFAULT_EXPEDITION } from '../src/content/defaults.js';

// The artwork registry is the only place raster art may come from. These
// guard the two rules docs/ARTWORK.md sets: relative in-repo paths only
// (never a web image), and keys that the UI actually knows.

const SLOTS = ['worldHero', 'dinos', 'scenes', 'companion'];
const isLocal = (p) => typeof p === 'string' && p.length > 0 && !/^(https?:)?\/\//i.test(p) && !p.startsWith('/') && !p.startsWith('data:');

test('artwork registry has exactly the documented slots', () => {
  assert.deepEqual(Object.keys(ARTWORK).sort(), [...SLOTS].sort());
  assert.equal(typeof ARTWORK.dinos, 'object');
  assert.equal(typeof ARTWORK.scenes, 'object');
});

test('every registered path is a relative in-repo path, never a web image', () => {
  if (ARTWORK.worldHero) assert.ok(isLocal(ARTWORK.worldHero.src), 'worldHero.src');
  if (ARTWORK.companion) assert.ok(isLocal(ARTWORK.companion), 'companion');
  for (const [k, p] of Object.entries(ARTWORK.dinos)) assert.ok(isLocal(p), `dinos.${k}`);
  for (const [k, p] of Object.entries(ARTWORK.scenes)) assert.ok(isLocal(p), `scenes.${k}`);
});

test('registered dino keys and scene tones match the expedition content', () => {
  const kinds = new Set(DEFAULT_EXPEDITION.items.filter((it) => it.type === 'card').map((it) => it.dino));
  const tones = new Set(DEFAULT_EXPEDITION.regions.map((r) => r.tone));
  for (const k of Object.keys(ARTWORK.dinos)) assert.ok(kinds.has(k), `unknown dino kind ${k}`);
  for (const t of Object.keys(ARTWORK.scenes)) assert.ok(tones.has(t), `unknown scene tone ${t}`);
});

test('dinoArt falls back to null so the SVG silhouette is drawn', () => {
  assert.equal(dinoArt('mamenchisaurus'), ARTWORK.dinos.mamenchisaurus || null);
  assert.equal(dinoArt('not-a-dino'), null);
});
