import test from 'node:test';
import assert from 'node:assert/strict';
import { PERIODS, PERIOD_LABEL, SPECIES, species, missingStats, STAT_KEYS, FIELD_NOTES, fieldNote } from '../src/content/dinopedia.js';
import { DEFAULT_EXPEDITION } from '../src/content/defaults.js';

// The atlas is reference content: it must cover every species the map can
// reveal, use the presentation's six-fact structure, and never point at the
// web. It has no state and opens nothing (core/expedition.js is untouched).

const CARD_KINDS = [...new Set(DEFAULT_EXPEDITION.items.filter((it) => it.type === 'card').map((it) => it.dino))];

test('every expedition species has a complete atlas card', () => {
  for (const k of CARD_KINDS) {
    const sp = species(k);
    assert.ok(sp, `no species card for ${k}`);
    assert.ok(sp.name && sp.tagline && sp.didYouKnow && sp.summary, `${k} is missing copy`);
    assert.ok(PERIOD_LABEL[sp.period], `${k} has unknown period ${sp.period}`);
    assert.ok(['pptx', 'general'].includes(sp.source), `${k} source`);
    for (const s of STAT_KEYS) assert.ok(s in sp.stats, `${k} is missing stat ${s}`);
    assert.ok(sp.stats.diet && sp.stats.trait, `${k} needs the qualitative facts`);
  }
});

// Content integrity: only the presentation is a verifiable source in this
// repository. Its five species carry all six facts verbatim; the seven it
// does not cover keep size / weight / era / region null and no figures in
// their copy — nothing is presented as a scientific number without a source.
const NUMERIC = /\d/;
const PPTX = ['trex', 'triceratops', 'diplodocus', 'spinosaurus', 'mamenchisaurus'];

test('pptx species have all six facts filled', () => {
  for (const k of PPTX) {
    assert.equal(species(k).source, 'pptx');
    assert.deepEqual(missingStats(species(k)), []);
  }
});

test('general species carry no unsourced numbers', () => {
  const general = Object.keys(SPECIES).filter((k) => SPECIES[k].source === 'general');
  assert.equal(general.length, 7);
  for (const k of general) {
    const sp = SPECIES[k];
    assert.deepEqual(missingStats(sp), ['size', 'weight', 'era', 'region'], `${k} unsourced stats must be null`);
    for (const f of ['tagline', 'didYouKnow', 'summary']) assert.ok(!NUMERIC.test(sp[f]), `${k}.${f} has a figure without a source`);
    for (const s of ['diet', 'trait']) assert.ok(!NUMERIC.test(sp.stats[s]), `${k}.stats.${s} has a figure without a source`);
  }
});

test('atlas has no species the map cannot reveal (content stays in sync with defaults)', () => {
  for (const k of Object.keys(SPECIES)) assert.ok(CARD_KINDS.includes(k), `atlas species ${k} is not an expedition item`);
});

test('periods are the three eras in order and every species maps to Jura or Kretase today', () => {
  assert.deepEqual(PERIODS.map((p) => p.id), ['triyas', 'jura', 'kretase']);
  assert.equal(species('trex').period, 'kretase');
  assert.equal(species('diplodocus').period, 'jura');
});

test('Keşif Notları are the five presentation topics with unique ids and real points', () => {
  assert.deepEqual(FIELD_NOTES.map((n) => n.id), ['what', 'origin', 'eras', 'world', 'extinction']);
  assert.equal(new Set(FIELD_NOTES.map((n) => n.id)).size, FIELD_NOTES.length);
  for (const n of FIELD_NOTES) {
    assert.ok(n.title && n.kicker && n.teaser, `${n.id} copy`);
    assert.ok(n.points.length >= 4, `${n.id} points`);
    for (const p of n.points) assert.ok(p.head && p.text, `${n.id} point`);
  }
  assert.equal(fieldNote('extinction').numbered, true);
  assert.equal(fieldNote('nope'), null);
});

test('no content string references the web', () => {
  const text = JSON.stringify({ SPECIES, FIELD_NOTES, PERIODS });
  assert.ok(!/https?:\/\//i.test(text));
});
