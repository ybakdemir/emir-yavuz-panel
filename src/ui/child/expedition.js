import { h, add, openSheet } from '../dom.js';
import { icon } from '../icons.js';
import { dino } from '../dinos.js';
import { glyph, zoneScene, worldScene, companionArt } from '../art.js';
import { ARTWORK } from '../../content/artwork.js';
import { expeditionView, milestoneCounts } from '../../core/expedition.js';
import { formatShort } from '../../core/dates.js';
import { DISCOVERY_REASON } from '../../core/celebration.js';

// Visual pass only (2026-09-12): the hero, discovery cards, locked cards and
// the reveal/detail sheets were redesigned around the Premium Friendly
// Expedition direction. Progression, eligibility and every core call are
// unchanged; the map still shows what expeditionView() says and nothing else.

const TYPE_GLYPH = { location: 'flag', fossil: 'fossil', fact: 'footprint', card: null };
const TYPE_LABEL = { card: 'Dinozor Kartı', fossil: 'Fosil', location: 'Harita Noktası', fact: 'Biliyor muydun?' };
const TYPE_SHORT = { card: 'Dinozor', fossil: 'Fosil', location: 'Nokta', fact: 'Bilgi' };
// The development moment behind a discovery, as a two-word tag (never a number).
const REASON_SHORT = { mastered: 'Yeni beceri', presentations: 'Sunum', memory: 'Güçlü hafıza', english: 'İngilizce', month: 'Aylık yol', steps: 'İyi günler' };

/** Hero artwork: the registered AI concept when present, else the built-in cinematic SVG. */
function heroArt() {
  const reg = ARTWORK.worldHero;
  if (reg?.src) {
    const img = h('img', { src: reg.src, alt: '', class: 'world-art', loading: 'eager', decoding: 'async', fetchpriority: 'high' });
    if (reg.focus) img.style.objectPosition = reg.focus;
    return img;
  }
  return worldScene();
}

/** Companion slot: registered raster or the built-in friendly sauropod. */
function companion(size) {
  if (ARTWORK.companion) return h('img', { src: ARTWORK.companion, alt: '', class: 'companion companion-art', width: size, height: size, loading: 'lazy', decoding: 'async' });
  return companionArt(size);
}

export function renderExpedition(main, ctx) {
  const { state, today } = ctx;
  const view = expeditionView(state);
  const ms = milestoneCounts(state, today);
  const cfg = state.config.expedition.milestones || {};
  const memNeed = Math.max(1, cfg.memoryDays || 7), engNeed = Math.max(1, cfg.englishDays || 10);
  const fresh = new Set(ctx.takeDiscoveries());
  const name = state.config.settings.childName || 'Emir';
  const pctDone = view.total ? (view.discoveredCount / view.total) * 100 : 0;
  const currentZone = view.regions.find((r) => r.state === 'active') || [...view.regions].reverse().find((r) => r.state === 'complete') || view.regions[0];
  const regionName = Object.fromEntries(view.regions.map((r) => [r.id, r.name]));

  // ── Hero: artwork → shade → copy. Real progress only; no points, no task counts.
  const hero = h('section', { class: 'exp-hero', 'aria-label': 'Keşif yolculuğu' },
    h('div', { class: 'exp-hero-art', 'aria-hidden': 'true' }, heroArt()),
    h('div', { class: 'exp-hero-shade', 'aria-hidden': 'true' }),
    h('div', { class: 'exp-companion', 'aria-hidden': 'true' }, companion(96)),
    h('div', { class: 'exp-hero-body' },
      h('div', { class: 'kicker' }, 'Keşif yolculuğu'),
      h('h1', {}, `${name}'in Dinozor Keşifleri`),
      h('p', { class: 'exp-hero-sub' }, 'Her gelişim anı yeni bir keşfe dönüşebilir.'),
      h('div', { class: 'exp-hero-meta' },
        h('div', { class: 'exp-count' }, h('b', {}, view.discoveredCount), h('span', {}, ` / ${view.total} keşif`)),
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

  const panel = h('section', { class: 'cinematic map', 'aria-label': 'Keşif haritası' }, hero, nextInfo);

  // ── Zones + discovery cards
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
 * One discovery card. Discovered: artwork on a tinted scene, expedition-paper
 * body with name, semantic line, short fact and "Keşfi Aç". Locked: the same
 * silhouette in mist behind a darker overlay — visible, mysterious, never a
 * grey disabled tile and never a "do N more" instruction.
 */
function discoveryCard(it, { state, view, fresh, tone, regionName }) {
  const on = !!it.discoveredAt;
  const isNext = view.next?.id === it.id;
  const reasonKey = state?.expedition?.reasons?.[it.id];
  const art = it.type === 'card' ? dino(it.dino, { size: 160 }) : glyph(TYPE_GLYPH[it.type] || 'flag', 56);
  const open = () => openDetail(it, state, regionName);
  const semantic = on
    ? [TYPE_SHORT[it.type], REASON_SHORT[reasonKey] || regionName[it.region]].filter(Boolean).join(' · ')
    : TYPE_SHORT[it.type];
  return h('article', { class: `disc ${on ? 'on' : 'off'} ${isNext ? 'next' : ''} ${fresh.has(it.id) ? 'fresh' : ''} tone-${tone}`,
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

/**
 * Detail sheet, laid out like the family's dinosaur presentation (artwork →
 * name → small facts → "Biliyor muydun?"). Only fields that exist in the
 * content are shown: type, zone, discovery date, the one fact, and the
 * development moment that opened it. Nothing is invented.
 */
function openDetail(it, state, regionName) {
  const why = DISCOVERY_REASON[state?.expedition?.reasons?.[it.id]] || null;
  const tone = state.config.expedition.regions.find((r) => r.id === it.region)?.tone || 'green';
  const at = it.discoveredAt || state?.expedition?.discovered?.[it.id] || null; // reveal passes the raw config item
  const close = openSheet([
    h('div', { class: `detail-art tone-${tone}` },
      h('div', { class: 'disc-light', 'aria-hidden': 'true' }),
      it.type === 'card' ? dino(it.dino, { size: 320, eager: true }) : h('div', { class: 'cine-glyph' }, glyph(TYPE_GLYPH[it.type] || 'flag', 72))),
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
