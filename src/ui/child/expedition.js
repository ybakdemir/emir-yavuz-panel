import { h, add, openSheet } from '../dom.js';
import { icon } from '../icons.js';
import { dino, hasDinoArt } from '../dinos.js';
import { glyph, zoneScene, worldScene, companionArt } from '../art.js';
import { ARTWORK, dinoFocus, noteArt } from '../../content/artwork.js';
import { PERIODS, PERIOD_LABEL, species, missingStats, STAT_KEYS, STAT_LABEL, FIELD_NOTES } from '../../content/dinopedia.js';
import { expeditionView, milestoneCounts } from '../../core/expedition.js';
import { formatShort } from '../../core/dates.js';
import { DISCOVERY_REASON } from '../../core/celebration.js';

// Dinosaur Discovery Visual Redesign v1 (2026-09-12). The page is now
// "Dinozor Keşif Üssü": a cinematic hero on real artwork, a species atlas
// with period filters, Keşif Notları (the presentation's general slides) and
// the discovery map. Progression, eligibility and every core call are
// unchanged — the map still shows what expeditionView() says and nothing
// else; the atlas and notes are reference content that open nothing.

const TYPE_GLYPH = { location: 'flag', fossil: 'fossil', fact: 'footprint', card: null };
const TYPE_LABEL = { card: 'Dinozor Kartı', fossil: 'Fosil', location: 'Harita Noktası', fact: 'Biliyor muydun?' };
const TYPE_SHORT = { card: 'Dinozor', fossil: 'Fosil', location: 'Nokta', fact: 'Bilgi' };
// The development moment behind a discovery, as a two-word tag (never a number).
const REASON_SHORT = { mastered: 'Yeni beceri', presentations: 'Sunum', memory: 'Güçlü hafıza', english: 'İngilizce', month: 'Aylık yol', steps: 'İyi günler' };

let atlasFilter = 'all'; // session-only UI state; never stored

/** Hero artwork: the registered raster when present, else the built-in cinematic SVG. */
function heroArt() {
  const reg = ARTWORK.worldHero;
  if (reg?.src) {
    const img = h('img', { src: reg.src, alt: '', class: 'world-art', loading: 'eager', decoding: 'async', fetchpriority: 'high' });
    if (reg.focus) img.style.objectPosition = reg.focus;
    return img;
  }
  return worldScene();
}

/** Companion slot (map footer only): registered raster or the built-in friendly sauropod. */
function companion(size) {
  if (ARTWORK.companion) return h('img', { src: ARTWORK.companion, alt: '', class: 'companion companion-art', width: size, height: size, loading: 'lazy', decoding: 'async' });
  return companionArt(size);
}

const sectionHead = (kicker, title, aside) => h('div', { class: 'exp-sec-hd' },
  h('div', { class: 'grow' }, h('div', { class: 'kicker' }, kicker), h('h2', {}, title)), aside || null);

export function renderExpedition(main, ctx) {
  const { state, today } = ctx;
  const view = expeditionView(state);
  const ms = milestoneCounts(state, today);
  const cfg = state.config.expedition.milestones || {};
  const memNeed = Math.max(1, cfg.memoryDays || 7), engNeed = Math.max(1, cfg.englishDays || 10);
  const fresh = new Set(ctx.takeDiscoveries());
  const pctDone = view.total ? (view.discoveredCount / view.total) * 100 : 0;
  const currentZone = view.regions.find((r) => r.state === 'active') || [...view.regions].reverse().find((r) => r.state === 'complete') || view.regions[0];
  const regionName = Object.fromEntries(view.regions.map((r) => [r.id, r.name]));
  const discovered = state.expedition?.discovered || {};
  const cards = state.config.expedition.items.filter((it) => it.type === 'card');
  const speciesFound = cards.filter((it) => discovered[it.id]).length;

  // ── 1. Base: cinematic hero on real artwork. Real progress only; no points, no task counts.
  const hero = h('section', { class: 'exp-hero', 'aria-label': 'Dinozor Keşif Üssü' },
    h('div', { class: 'exp-hero-art', 'aria-hidden': 'true' }, heroArt()),
    h('div', { class: 'exp-hero-shade', 'aria-hidden': 'true' }),
    h('div', { class: 'exp-hero-body' },
      h('div', { class: 'kicker' }, 'Keşif yolculuğu'),
      h('h1', {}, 'Dinozor Keşif Üssü'),
      h('p', { class: 'exp-hero-sub' }, 'Her gelişim anı yeni bir keşfe dönüşür.'),
      h('div', { class: 'exp-hero-meta' },
        h('div', { class: 'exp-count' }, h('b', {}, view.discoveredCount), h('span', {}, ` / ${view.total} keşif`)),
        h('div', { class: 'exp-zone' }, glyph('fossil', 16), `${speciesFound} / ${cards.length} tür`),
        currentZone ? h('div', { class: 'exp-zone' }, glyph('map', 16), currentZone.name) : null),
      h('div', { class: 'exp-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(view.total), 'aria-valuenow': String(view.discoveredCount) },
        h('i', { style: { width: `${pctDone}%` } }))));

  const nextInfo = view.next
    ? h('div', { class: 'exp-next' },
      h('div', { class: 'exp-next-t' }, glyph('footprint', 18), 'Sıradaki keşif bir gelişim anıyla açılır: sunum, yeni beceri ya da kilometre taşı.'),
      h('div', { class: 'exp-milestones' },
        h('span', { class: 'exp-ms' }, glyph('book', 14), `Hafıza ${ms.memoryDays % memNeed}/${memNeed}`),
        h('span', { class: 'exp-ms' }, glyph('compass', 14), `İngilizce ${ms.englishDays % engNeed}/${engNeed}`)))
    : h('div', { class: 'exp-next' }, h('div', { class: 'exp-next-t' }, glyph('flag', 18), 'Haritanın tamamını keşfettin.'));

  add(main, h('section', { class: 'exp-top' }, hero, nextInfo));

  // ── 2. Tür Atlası: every species the map can reveal, filterable by period.
  // Discovered species are vivid and first; the rest wait in mist but stay
  // readable — the atlas is knowledge, the map is the reward.
  const shelf = h('div', { class: 'sp-shelf', role: 'list' });
  const pills = h('div', { class: 'period-pills', role: 'tablist', 'aria-label': 'Dönem filtresi' });
  const paintAtlas = () => {
    shelf.replaceChildren();
    pills.querySelectorAll('.pp').forEach((b) => { const on = b.dataset.id === atlasFilter; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    const list = cards
      .map((it) => ({ it, sp: species(it.dino), on: !!discovered[it.id] }))
      .filter(({ sp }) => atlasFilter === 'all' || sp?.period === atlasFilter)
      .sort((a, b) => Number(b.on) - Number(a.on));
    if (!list.length) {
      const p = PERIODS.find((x) => x.id === atlasFilter);
      add(shelf, h('div', { class: 'atlas-empty', role: 'listitem' },
        h('div', { class: 'kicker' }, p ? `${p.label} · ${p.range}` : 'Bu dönem'),
        h('div', { class: 'atlas-empty-t' }, p?.blurb || ''),
        h('div', { class: 'atlas-empty-s' }, 'Bu dönemden bir tür atlasa henüz eklenmedi.')));
      return;
    }
    add(shelf, list.map(({ it, sp, on }) => speciesCard(it, sp, on, { state, regionName, fresh })));
  };
  add(pills, [{ id: 'all', label: 'Tümü' }, ...PERIODS].map((p) =>
    h('button', { class: 'pp', type: 'button', role: 'tab', dataset: { id: p.id }, onclick: () => { atlasFilter = p.id; paintAtlas(); } }, p.label)));
  paintAtlas();
  add(main, h('section', { class: 'atlas', 'aria-label': 'Tür Atlası' },
    sectionHead('Tür Atlası', 'Keşfedilecek türler', h('span', { class: 'sec-count' }, `${speciesFound} / ${cards.length}`)),
    pills, shelf));

  // ── 3. Keşif Notları: the presentation's general slides, always readable.
  add(main, h('section', { class: 'notes', 'aria-label': 'Keşif Notları' },
    sectionHead('Keşif Notları', 'Dinozorların dünyası'),
    h('div', { class: 'note-list' }, FIELD_NOTES.map((n) => noteCard(n)))));

  // ── 4. Keşif Haritası: zones + discovery cards (progression, unchanged).
  const panel = h('section', { class: 'cinematic map', 'aria-label': 'Keşif haritası' },
    sectionHead('Keşif Haritası', 'Bölge bölge ilerle', h('span', { class: 'sec-count' }, `${view.discoveredCount} / ${view.total}`)));
  const trailEl = h('div', { class: 'map-trail' });
  view.regions.forEach((region, idx) => {
    const reached = region.state !== 'locked';
    const zone = h('section', { class: `zone ${region.state} tone-${region.tone}`, 'aria-label': region.name },
      h('div', { class: 'zone-scene-wrap' }, zoneScene(region.tone), h('div', { class: 'zone-mist' })),
      h('div', { class: 'zone-hd' },
        h('div', { class: 'grow' },
          h('div', { class: 'zone-state' }, region.state === 'complete' ? 'Keşfedildi' : region.state === 'active' ? 'Şu an buradasın' : 'Keşfedilecek'),
          h('div', { class: 'n' }, region.name),
          h('div', { class: 'tg' }, region.tagline)),
        h('div', { class: 'zone-count' }, `${region.found}/${region.total}`)),
      h('div', { class: 'finds' }, region.items.map((it) => discoveryCard(it, { state, view, fresh, tone: region.tone, regionName }))));
    if (!reached) zone.setAttribute('aria-disabled', 'true');
    add(trailEl, h('div', { class: `zone-wrap ${region.state}` },
      h('div', { class: 'zone-node', 'aria-hidden': 'true' }, region.state === 'complete' ? icon('check', 18) : h('span', {}, idx + 1)), zone));
  });
  add(panel, trailEl,
    h('div', { class: 'map-foot' },
      h('div', { class: 'map-foot-companion', 'aria-hidden': 'true' }, companion(56)),
      h('div', {}, 'Her keşif bir gelişim anı. Keşfedilen hiçbir şey geri alınmaz.')));
  add(main, panel);
  // Reveal the newest discovery once, not one sheet per item.
  const newest = [...fresh].map((id) => state.config.expedition.items.find((it) => it.id === id)).filter(Boolean).pop();
  if (newest) setTimeout(() => openReveal(newest, state, regionName), 350);
}

/**
 * Atlas cover card: portrait artwork (registered raster with its focus, or
 * the SVG silhouette on a tinted scene), period tag, discovery state, name
 * and the species tagline. Opens the species card; undiscovered species are
 * shown in mist but stay readable — no counts, no instructions.
 */
function speciesCard(it, sp, on, opts) {
  const open = () => openSpecies(it, opts.state, opts.regionName);
  const art = dino(it.dino, { size: 320 });
  return h('article', { class: `sp-card ${on ? 'on' : 'off'} ${hasDinoArt(it.dino) ? 'has-art' : 'no-art'} ${opts.fresh.has(it.id) ? 'fresh' : ''}`, role: 'listitem' },
    h('button', { type: 'button', class: 'sp-btn', 'aria-label': `${sp?.name || it.title} — tür kartını aç`, onclick: open },
      h('div', { class: 'sp-cover' }, art, h('div', { class: 'sp-shade', 'aria-hidden': 'true' })),
      h('span', { class: 'sp-period' }, PERIOD_LABEL[sp?.period] || TYPE_SHORT.card),
      h('span', { class: `sp-state ${on ? 'on' : ''}` }, on ? icon('check', 12) : null, on ? 'Keşfedildi' : 'Keşfedilmedi'),
      h('div', { class: 'sp-body' },
        h('div', { class: 'sp-name' }, sp?.name || it.title),
        h('div', { class: 'sp-tag' }, sp?.tagline || it.fact))));
}

/** Keşif Notu row: cover thumb, title, teaser. */
function noteCard(n) {
  const cover = noteArt(n.id);
  return h('button', { type: 'button', class: 'note-card', onclick: () => openNote(n) },
    h('div', { class: 'note-thumb', 'aria-hidden': 'true' },
      cover ? h('img', { src: cover, alt: '', loading: 'lazy', decoding: 'async' }) : glyph('book', 30)),
    h('div', { class: 'grow' },
      h('div', { class: 'note-k' }, n.kicker),
      h('div', { class: 'note-t' }, n.title),
      h('div', { class: 'note-s' }, n.teaser)),
    icon('chevron', 20));
}

/**
 * One discovery card on the map. Discovered: artwork on a tinted scene,
 * expedition-paper body with name, semantic line, short fact and "Keşfi Aç".
 * Locked: the same silhouette in mist behind a darker overlay — visible,
 * mysterious, never a grey disabled tile and never a "do N more" instruction.
 */
function discoveryCard(it, { state, view, fresh, tone, regionName }) {
  const on = !!it.discoveredAt;
  const isNext = view.next?.id === it.id;
  const reasonKey = state?.expedition?.reasons?.[it.id];
  const art = it.type === 'card' ? dino(it.dino, { size: 160, silhouette: !on }) : glyph(TYPE_GLYPH[it.type] || 'flag', 56);
  const open = () => openDetail(it, state, regionName);
  const semantic = on
    ? [TYPE_SHORT[it.type], REASON_SHORT[reasonKey] || regionName[it.region]].filter(Boolean).join(' · ')
    : TYPE_SHORT[it.type];
  return h('article', { class: `disc ${on ? 'on' : 'off'} ${isNext ? 'next' : ''} ${fresh.has(it.id) ? 'fresh' : ''} tone-${tone}`, id: `find-${it.id}`,
    role: on ? 'button' : null, tabindex: on ? '0' : null,
    'aria-label': on ? `${it.title} — keşfi aç` : isNext ? 'Sıradaki keşif — yeni bir gelişim anı bekliyor' : 'Henüz keşfedilmedi',
    onclick: () => { if (on) open(); }, onkeydown: (e) => { if (on && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } } },
    h('div', { class: 'disc-art' },
      h('div', { class: 'disc-light', 'aria-hidden': 'true' }),
      art,
      on ? null : h('div', { class: 'disc-mist', 'aria-hidden': 'true' }),
      on ? null : h('div', { class: 'disc-lock', 'aria-hidden': 'true' }, isNext ? glyph('footprint', 16) : h('span', {}, '?'))),
    h('div', { class: 'disc-body' },
      h('div', { class: 'disc-meta' }, semantic),
      h('div', { class: 'disc-name' }, on ? it.title : isNext ? 'Sıradaki keşif' : 'Henüz keşfedilmedi'),
      on ? h('div', { class: 'disc-fact' }, it.fact) : h('div', { class: 'disc-fact' }, isNext ? 'Yeni bir gelişim anı bekliyor.' : 'Sisin ardında bir şey var.'),
      on ? h('div', { class: 'disc-cta' }, 'Keşfi Aç', icon('chevron', 16)) : null));
}

/** Cinematic reveal for a discovery that just opened: kicker → artwork → name → why → CTA into the detail. */
function openReveal(it, state, regionName) {
  const why = DISCOVERY_REASON[state?.expedition?.reasons?.[it.id]] || 'Bir gelişim anı bu keşfi açtı.';
  const close = openSheet([
    h('div', { class: 'reveal-light', 'aria-hidden': 'true' }),
    h('div', { class: 'lbl' }, 'Yeni keşif'),
    h('div', { class: 'reveal-art' }, it.type === 'card' ? dino(it.dino, { size: 300, eager: true }) : h('div', { class: 'cine-glyph' }, glyph(TYPE_GLYPH[it.type] || 'flag', 72))),
    h('div', { class: 'reveal-name' }, it.title),
    h('div', { class: 'reveal-why' }, why),
    h('div', { class: 'reveal-note' }, 'Merak etmeye ve öğrenmeye devam et.'),
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-primary', onclick: () => { close(); openDetail(it, state, regionName); } }, 'Keşfi İncele')),
  ], { cls: 'cine reveal' });
}

/** Detail for any find: species get the full atlas card, other finds the compact sheet. */
function openDetail(it, state, regionName) {
  if (it.type === 'card' && species(it.dino)) return openSpecies(it, state, regionName);
  return openFindDetail(it, state, regionName);
}

/**
 * Species card, laid out like the family's presentation: hero artwork →
 * period → name → tagline → six facts → "Biliyor muydun?" → summary. The
 * discovery block (zone, date, the development moment) appears only once
 * the map has revealed the species; before that a single quiet line says how
 * it opens and the CTA jumps to its place on the map.
 */
function openSpecies(it, state, regionName) {
  const sp = species(it.dino);
  const missing = missingStats(sp);
  const at = state?.expedition?.discovered?.[it.id] || null;
  const why = at ? DISCOVERY_REASON[state?.expedition?.reasons?.[it.id]] || null : null;
  const tone = state.config.expedition.regions.find((r) => r.id === it.region)?.tone || 'green';
  const art = dino(it.dino, { size: 480, eager: true });
  const focus = dinoFocus(it.dino);
  if (focus && art.tagName === 'IMG') art.style.objectPosition = focus;
  const goToMap = () => {
    close();
    const el = document.getElementById(`find-${it.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('spot'); setTimeout(() => el.classList.remove('spot'), 2400);
  };
  const close = openSheet([
    h('div', { class: `sp-hero tone-${tone} ${at ? 'on' : 'off'}` },
      h('div', { class: 'disc-light', 'aria-hidden': 'true' }), art,
      h('span', { class: 'sp-period' }, PERIOD_LABEL[sp.period]),
      at ? h('span', { class: 'sp-state on' }, icon('check', 12), 'Keşfedildi') : null),
    h('div', { class: 'lbl' }, `Tür kartı · ${PERIOD_LABEL[sp.period]}`),
    h('div', { class: 'sheet-title detail-name' }, sp.name),
    h('div', { class: 'sp-tagline' }, sp.tagline),
    h('div', { class: 'sp-stats' }, STAT_KEYS.map((k) => sp.stats[k] ? h('div', { class: 'sp-stat' }, h('div', { class: 'k' }, STAT_LABEL[k]), h('div', { class: 'v' }, sp.stats[k])) : null)),
    // Unsourced facts are null in the atlas, never invented: name them once, quietly.
    missing.length ? h('div', { class: 'sp-pending' }, glyph('leaf', 14), `${missing.map((k) => STAT_LABEL[k]).join(', ')} bilgisi hazırlanıyor.`) : null,
    h('div', { class: 'detail-fact' }, h('div', { class: 'detail-fact-k' }, 'Biliyor muydun?'), h('div', {}, sp.didYouKnow)),
    h('p', { class: 'sp-summary' }, sp.summary),
    at ? h('div', { class: 'detail-chips' },
      regionName[it.region] ? h('span', { class: 'detail-chip' }, glyph('map', 14), regionName[it.region]) : null,
      h('span', { class: 'detail-chip' }, icon('flag', 14), formatShort(at))) : null,
    why ? h('div', { class: 'cine-why' }, glyph('footprint', 16), why) : null,
    at ? null : h('div', { class: 'sp-locked' }, glyph('footprint', 16), `${regionName[it.region] || 'Harita'} bölgesinde bir gelişim anıyla keşfedilir.`),
    h('div', { class: 'sheet-actions' },
      at ? h('button', { class: 'btn btn-primary', onclick: () => close() }, 'Harika')
        : h('button', { class: 'btn btn-primary', onclick: goToMap }, 'Haritada gör', icon('chevron', 18))),
  ], { cls: 'cine detail species' });
}

/** Keşif Notu sheet: cover → kicker → title → points (numbered for a sequence) → closing line. */
function openNote(n) {
  const cover = noteArt(n.id);
  const close = openSheet([
    h('div', { class: 'note-hero' }, cover ? h('img', { src: cover, alt: '', loading: 'eager', decoding: 'async' }) : h('div', { class: 'cine-glyph' }, glyph('book', 72))),
    h('div', { class: 'lbl' }, n.kicker),
    h('div', { class: 'sheet-title detail-name' }, n.title),
    h('ol', { class: `note-points ${n.numbered ? 'numbered' : ''}` }, n.points.map((p) =>
      h('li', {}, h('span', { class: 'np-mark', 'aria-hidden': 'true' }), h('div', {}, h('div', { class: 'np-h' }, p.head), h('div', { class: 'np-t' }, p.text))))),
    n.closing ? h('div', { class: 'detail-fact' }, h('div', { class: 'detail-fact-k' }, 'Biliyor muydun?'), h('div', {}, n.closing)) : null,
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-primary', onclick: () => close() }, 'Harika')),
  ], { cls: 'cine detail fieldnote' });
}

/**
 * Compact detail for non-species finds (fossils, map points, facts). Only
 * fields that exist in the content are shown: type, zone, discovery date,
 * the one fact, and the development moment that opened it. Nothing is invented.
 */
function openFindDetail(it, state, regionName) {
  const why = DISCOVERY_REASON[state?.expedition?.reasons?.[it.id]] || null;
  const tone = state.config.expedition.regions.find((r) => r.id === it.region)?.tone || 'green';
  const at = it.discoveredAt || state?.expedition?.discovered?.[it.id] || null; // reveal passes the raw config item
  const close = openSheet([
    h('div', { class: `detail-art tone-${tone}` },
      h('div', { class: 'disc-light', 'aria-hidden': 'true' }),
      h('div', { class: 'cine-glyph' }, glyph(TYPE_GLYPH[it.type] || 'flag', 72))),
    h('div', { class: 'lbl' }, TYPE_LABEL[it.type] || 'Keşif'),
    h('div', { class: 'sheet-title detail-name' }, it.title),
    h('div', { class: 'detail-chips' },
      regionName[it.region] ? h('span', { class: 'detail-chip' }, glyph('map', 14), regionName[it.region]) : null,
      at ? h('span', { class: 'detail-chip' }, icon('flag', 14), formatShort(at)) : null),
    h('div', { class: 'detail-fact' }, h('div', { class: 'detail-fact-k' }, 'Biliyor muydun?'), h('div', {}, it.fact)),
    why ? h('div', { class: 'cine-why' }, glyph('footprint', 16), why) : null,
    h('div', { class: 'sheet-actions' }, h('button', { class: 'btn btn-primary', onclick: () => close() }, 'Harika')),
  ], { cls: 'cine detail' });
}
