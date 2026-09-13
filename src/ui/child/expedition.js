import { h, add, svg, openSheet } from '../dom.js';
import { icon, footprintStamp } from '../icons.js';
import { dino, hasDinoArt } from '../dinos.js';
import { glyph, zoneScene } from '../art.js';
import { PREMIUM, dinoFocus, noteArt, premiumHero } from '../../content/artwork.js';
import { PERIODS, PERIOD_LABEL, species, missingStats, STAT_KEYS, STAT_LABEL, FIELD_NOTES } from '../../content/dinopedia.js';
import { expeditionView, milestoneCounts } from '../../core/expedition.js';
import { formatShort, diffDays } from '../../core/dates.js';
import { DISCOVERY_REASON } from '../../core/celebration.js';
import { pageHero, sectionHead as sysSectionHead, sign, companion } from './components.js';

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

// Where the region nodes sit on the Keşif Haritası ground (percent of the
// 3:2 stage, which shows the middle of the 2:1 map). A winding trail from the
// lake at the bottom-left up past the waterfall to the cliffs on the right;
// the volcano stays clear. Positions are purely visual — the region list,
// order and states come from expeditionView(). Extra regions (if a family
// ever adds one) continue along the same line.
const MAP_NODES = [[13, 74], [42, 26], [58, 62], [74, 40], [89, 70]];
const nodeAt = (i, n) => MAP_NODES[Math.min(i, MAP_NODES.length - 1)] || [10 + (80 * i) / Math.max(1, n - 1), 55];

const sectionHead = (kicker, title, aside, opts = {}) => sysSectionHead(kicker, title, { count: aside || null, ...opts });

export function renderExpedition(main, ctx) {
  const { state, today } = ctx;
  const view = expeditionView(state);
  const ms = milestoneCounts(state, today);
  const cfg = state.config.expedition.milestones || {};
  const memNeed = Math.max(1, cfg.memoryDays || 7), engNeed = Math.max(1, cfg.englishDays || 10);
  const fresh = new Set(ctx.takeDiscoveries());
  const currentZone = view.regions.find((r) => r.state === 'active') || [...view.regions].reverse().find((r) => r.state === 'complete') || view.regions[0];
  const regionName = Object.fromEntries(view.regions.map((r) => [r.id, r.name]));
  const discovered = state.expedition?.discovered || {};
  const cards = state.config.expedition.items.filter((it) => it.type === 'card');
  const speciesFound = cards.filter((it) => discovered[it.id]).length;

  // ── 1. Hero (reference 03-EXPLORE): "KEŞİF ATLASI" sign, the invitation, one line. Progress lives on the map below.
  add(main, pageHero({
    variant: 'full', hero: 'explore', cls: 'exp-hero', label: 'Keşif Atlası',
    kicker: 'Keşif Atlası', title: 'Dünyanın en harika canlılarını keşfet!', sparkle: true, sub: 'Dinozorlar, doğa ve çok daha fazlası seni bekliyor!',
    extra: [h('a', { href: '#/parent', class: 'parent-link', 'aria-label': 'Ebeveyn modu' }, icon('gear', 22))],
  }));

  // ── 2. Keşif Haritası — torn parchment overlapping the hero, the premium
  // map ground (000006) as the stage, real region nodes and a dashed trail
  // laid over it in HTML/SVG. Same progression data as the detailed zone map
  // further down; a node jumps to its zone.
  const jump = (id) => { const el = document.getElementById(`zone-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const n = view.regions.length;
  const pts = view.regions.map((_, i) => nodeAt(i, n));
  const route = pts.map(([x, y], i) => {
    if (!i) return `M${x * 1.5} ${y}`;
    const [px, py] = pts[i - 1];
    return `Q${((px + x) / 2) * 1.5} ${py + (y - py) * 0.15 + (i % 2 ? 10 : -10)} ${x * 1.5} ${y}`;
  }).join(' ');
  const routeEl = svg(`<path d="${route}" fill="none" stroke="#5E3A16" stroke-width="4" stroke-linecap="round" stroke-dasharray="9 8" opacity=".78" vector-effect="non-scaling-stroke"/>`, { viewBox: '0 0 150 100', cls: 'mp-route' });
  routeEl.setAttribute('preserveAspectRatio', 'none');
  add(main, h('section', { class: 'paper torn map-paper', 'aria-label': 'Keşif haritası' },
    h('div', { class: 'mp-head' },
      h('div', { class: 'grow' }, h('h2', {}, 'Keşif Haritası'), h('div', { class: 'mp-sub' }, 'Ayak izlerini takip et, yeni dinozorları aç!')),
      sign(view.next ? 'Daha fazla keşif seni bekliyor!' : 'Haritanın tamamı keşfedildi!', { size: '2', cls: 'mp-sign' })),
    h('div', { class: 'mp-stage', role: 'list' },
      PREMIUM.map ? h('img', { src: PREMIUM.map, alt: '', class: 'mp-ground', loading: 'eager', decoding: 'async' }) : null,
      routeEl,
      view.regions.map((region, idx) => {
        const last = idx === n - 1;
        const [x, y] = pts[idx];
        return h('button', { type: 'button', class: `mp-node ${region.state} ${last ? 'last' : ''} ${x < 25 ? 'edge-l' : x > 75 ? 'edge-r' : ''}`, role: 'listitem', style: { left: `${x}%`, top: `${y}%` },
          'aria-label': `${region.name} · ${region.found}/${region.total}${region.state === 'active' ? ' · buradasın' : region.state === 'locked' ? ' · kilitli' : ' · keşfedildi'}`, onclick: () => jump(region.id) },
          region.state === 'active' ? sign(`Buradasın ${idx + 1}/${n}`, { size: 'sm', cls: 'mp-here' }) : null,
          h('span', { class: 'mp-rock' },
            region.state === 'locked' && last ? dino('trex', { size: 64, silhouette: true }) : region.state === 'complete' ? icon('check', 24) : footprintStamp(region.state === 'active' ? 28 : 22),
            region.state === 'locked' ? h('span', { class: 'mp-lock' }, icon('lock', 12)) : null),
          h('span', { class: 'mp-name' }, region.name));
      })),
    h('div', { class: 'mp-foot' },
      h('span', { class: 'count-pill' }, glyph('footprint', 14), `${view.discoveredCount} / ${view.total} keşif`),
      h('span', { class: 'count-pill soft' }, glyph('fossil', 14), `${speciesFound} / ${cards.length} tür`),
      view.next ? h('span', { class: 'mp-ms' }, `Hafıza ${ms.memoryDays % memNeed}/${memNeed} · İngilizce ${ms.englishDays % engNeed}/${engNeed}`) : null)));

  // ── 3. Öne Çıkan Dinozorlar: every species the map can reveal, filterable by period.
  // Discovered species are vivid and first; the rest wait in mist but stay readable.
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
  add(main, h('section', { class: 'card atlas', 'aria-label': 'Öne Çıkan Dinozorlar' },
    h('div', { class: 'card-head' }, glyph('compass', 30), h('div', { class: 'grow' }, h('h2', {}, 'Öne Çıkan Dinozorlar')),
      h('button', { type: 'button', class: 'link-arrow aside', onclick: () => { atlasFilter = 'all'; paintAtlas(); } }, 'Tümünü Gör', icon('chevron', 16))),
    pills, shelf));

  // ── 4. Bugünün Keşfi + Kaşif Notları (two-up)
  const pool = cards.filter((it) => species(it.dino)?.didYouKnow);
  const pick = pool.length ? pool[Math.abs(diffDays('2026-01-01', today)) % pool.length] : null;
  const notesEl = h('section', { class: 'card notes', id: 'kesif-notlari', 'aria-label': 'Keşif Notları' },
    h('div', { class: 'card-head' }, glyph('book', 30), h('div', { class: 'grow' }, h('h2', {}, 'Keşif Notları'), h('div', { class: 'sub' }, 'Dinozorların dünyası'))),
    h('div', { class: 'note-list' }, FIELD_NOTES.map((n) => noteCard(n))));
  add(main, h('div', { class: 'two-up' },
    h('section', { class: 'card fact-card', 'aria-label': 'Bugünün keşfi' },
      h('div', { class: 'fc-head' }, glyph('sun', 26), h('h3', {}, 'Bugünün Keşfi')),
      h('div', { class: 'fc-k' }, 'Biliyor muydun?'),
      h('div', { class: 'fc-t' }, pick ? species(pick.dino).didYouKnow : 'Her keşif bir gelişim anıyla açılır.'),
      pick ? h('button', { type: 'button', class: 'btn btn-forest btn-sm', onclick: () => openSpecies(pick, state, regionName) }, 'Daha Fazla Bilgi', icon('chevron', 16)) : null,
      h('div', { class: 'fc-art', 'aria-hidden': 'true' }, glyph('fossil', 44))),
    h('section', { class: 'card note-cta', 'aria-label': 'Kaşif notları' },
      h('div', { class: 'fc-head' }, glyph('scroll', 26), h('h3', {}, 'Kaşif Notları')),
      h('div', { class: 'fc-t' }, `${FIELD_NOTES.length} not seni bekliyor. Dinozorların dünyasını keşfet!`),
      h('button', { type: 'button', class: 'btn btn-forest btn-sm', onclick: () => notesEl.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 'Notları Aç', icon('chevron', 16)),
      h('div', { class: 'fc-art print', 'aria-hidden': 'true' }, footprintStamp(40)))));
  add(main, notesEl);

  // ── 5. Adventure banner (reference copy) on the secondary artwork — opens the "world" note
  const worldNote = FIELD_NOTES.find((n) => n.id === 'world');
  const banner = premiumHero('secondary');
  const bannerArt = banner?.src || noteArt('world');
  add(main, h('button', { type: 'button', class: 'photo-banner', onclick: () => worldNote && openNote(worldNote) },
    bannerArt ? h('img', { src: bannerArt, alt: '', loading: 'lazy', decoding: 'async', style: banner ? { objectPosition: '50% 30%' } : null }) : null,
    h('span', { class: 'pb-shade', 'aria-hidden': 'true' }),
    h('span', { class: 'pb-t' }, 'Doğayı keşfet,', h('br'), 'daha iyi bir gelecek için koru!'),
    h('span', { class: 'pb-leaf', 'aria-hidden': 'true' }, glyph('leaf', 22)), icon('chevron', 20)));

  // ── 6. Bölge bölge harita: zones + discovery cards (progression, unchanged).
  const panel = h('section', { class: 'paper map', 'aria-label': 'Bölge haritası' },
    sectionHead('Keşif Haritası', 'Bölge bölge ilerle', h('span', { class: 'count-pill' }, `${view.discoveredCount} / ${view.total}`), { sub: 'Her bölge bir gelişim anıyla açılır.' }));
  const trailEl = h('div', { class: 'map-trail trail-line' });
  view.regions.forEach((region, idx) => {
    const reached = region.state !== 'locked';
    const zone = h('section', { class: `zone ${region.state} tone-${region.tone}`, id: `zone-${region.id}`, 'aria-label': region.name },
      h('div', { class: 'zone-scene-wrap' }, zoneScene(region.tone), h('div', { class: 'zone-mist' })),
      h('div', { class: 'zone-hd' },
        h('div', { class: 'grow' },
          h('div', { class: 'zone-state' }, sign(region.state === 'complete' ? 'Keşfedildi' : region.state === 'active' ? 'Şu an buradasın' : 'Keşfedilecek', { size: 'sm' })),
          h('div', { class: 'n' }, region.name),
          h('div', { class: 'tg' }, region.tagline)),
        h('div', { class: 'zone-count' }, `${region.found}/${region.total}`)),
      h('div', { class: 'finds' }, region.items.map((it) => discoveryCard(it, { state, view, fresh, tone: region.tone, regionName }))));
    if (!reached) zone.setAttribute('aria-disabled', 'true');
    add(trailEl, h('div', { class: `zone-wrap ${region.state}` },
      h('div', { class: `trail-post zone-node ${region.state !== 'locked' ? 'on' : ''}`, 'aria-hidden': 'true' }, region.state === 'complete' ? icon('check', 18) : h('span', {}, idx + 1)), zone));
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
  const isNew = opts.fresh.has(it.id);
  return h('article', { class: `sp-card ${on ? 'on' : 'off'} ${hasDinoArt(it.dino) ? 'has-art' : 'no-art'} ${isNew ? 'fresh' : ''}`, role: 'listitem' },
    h('button', { type: 'button', class: 'sp-btn', 'aria-label': `${sp?.name || it.title} — tür kartını aç`, onclick: open },
      h('div', { class: 'sp-cover' }, art, on ? null : h('div', { class: 'sp-mist', 'aria-hidden': 'true' }),
        isNew ? h('span', { class: 'sp-new' }, 'YENİ') : on ? null : h('span', { class: 'sp-state' }, icon('lock', 11), PERIOD_LABEL[sp?.period] || TYPE_SHORT.card)),
      h('div', { class: 'sp-body' },
        h('div', { class: 'grow' },
          h('div', { class: 'sp-name' }, sp?.name || it.title),
          h('div', { class: 'sp-tag' }, sp?.tagline || it.fact)),
        h('span', { class: 'chev-btn', 'aria-hidden': 'true' }, icon('chevron', 18)))));
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
