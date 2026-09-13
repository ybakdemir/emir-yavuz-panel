import { h, svg } from '../dom.js';
import { icon, footprintStamp } from '../icons.js';
import { glyph, GLYPH_NAMES, heroScene, masteryBadge, companionArt } from '../art.js';
import { dino } from '../dinos.js';
import { ARTWORK, PREMIUM, premiumHero, dailyIcon } from '../../content/artwork.js';
import { STATUS, STATUS_LABEL } from '../../content/defaults.js';

// ── Design-system primitives (styles/system.css) ─────────────────────
// Every child screen opens with pageHero() and groups content with
// sectionHead(); kickers are wooden signposts. Screens never restyle these.

/** Wooden signpost label — the kicker of every hero and the map's wayfinding. */
export function sign(text, { icon: ic = null, soft = false, size = '', cls = '' } = {}) {
  return h('span', { class: `sign ${soft ? 'sign-soft' : ''} ${size ? 'sign-' + size : ''} ${cls}` }, ic ? glyph(ic, 14) : null, text);
}

/**
 * Hero backdrop: the premium hero for the screen (`key`: today / week /
 * explore / secondary), else the registered valley, else the SVG valley.
 * Only the hero is loaded eagerly; the sign, copy and controls stay HTML.
 */
export function heroArt(key = null) {
  const reg = (key && premiumHero(key)) || ARTWORK.worldHero;
  if (reg?.src) {
    const img = h('img', { src: reg.src, alt: '', class: 'world-art', loading: 'eager', decoding: 'async', fetchpriority: 'high' });
    if (reg.focus) img.style.objectPosition = reg.focus;
    return img;
  }
  return heroScene();
}

/** Achievement badge (premium 000008) at `size` px; the SVG mastery badge when unregistered. */
export function badgeArt(size = 72, cls = '') {
  if (PREMIUM.badge) return h('img', { src: PREMIUM.badge, alt: '', class: `badge-art ${cls}`, width: size, height: size, loading: 'lazy', decoding: 'async' });
  return masteryBadge(size, cls);
}

/** The explorer companion (premium 000004) at `size` px wide; the SVG companion when unregistered. */
export function companion(size = 96, cls = '') {
  if (ARTWORK.companion) return h('img', { src: ARTWORK.companion, alt: '', class: `companion companion-art ${cls}`, width: size, height: Math.round(size * 635 / 480), loading: 'eager', decoding: 'async' });
  return companionArt(size, cls);
}

/** Small yellow sparkle after a headline (reference: "Merhaba Emir ✧"). */
export function spark() {
  return svg('<g stroke="#F4C54A" stroke-width="3.2" stroke-linecap="round"><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></g>', { size: 20, cls: 'spark' });
}

/** Speech bubble (progress paper, streak card). */
export function bubble(text, { tone = '', side = '' } = {}) {
  return h('div', { class: `bubble ${tone} ${side}` }, text);
}

/**
 * Scenic page header. `variant`: 'full' (Bugün, Haftam, Keşif) or 'compact'
 * (Becerilerim, Arşivim). `hero` picks the premium artwork (PREMIUM.heroes
 * key); `art` overrides it with a node; `dinoKind` puts a silhouette on the
 * ridge only when there is no real artwork for the screen;
 * `aside` sits beside the title (a date chip, a count); `foot` is the bottom
 * strip (Today's copy + progress, Keşif's meta + bar); `extra` are raw nodes.
 */
export function pageHero({ variant = 'compact', kicker, title, sub = null, sub2 = null, aside = null, foot = null, art = null, hero = null, dinoKind = null, cls = '', label = null, extra = [], sparkle = false }) {
  return h('section', { class: `phero ${variant} ${cls}`, 'aria-label': label || (typeof title === 'string' ? title : null) },
    h('div', { class: 'phero-art', 'aria-hidden': 'true' }, art || heroArt(hero)),
    h('div', { class: 'phero-shade', 'aria-hidden': 'true' }),
    dinoKind ? h('div', { class: 'phero-dino', 'aria-hidden': 'true' }, dino(dinoKind, { silhouette: true })) : null,
    extra,
    h('div', { class: 'phero-body' },
      h('div', { class: 'phero-top' },
        h('div', { class: 'grow' }, kicker ? sign(kicker) : null, h('h1', {}, title, sparkle ? spark() : null), sub ? h('p', { class: 'phero-sub' }, sub) : null, sub2 ? h('p', { class: 'phero-sub2' }, sub2) : null),
        aside ? h('div', { class: 'phero-aside' }, aside) : null),
      foot ? h('div', { class: 'phero-foot' }, foot) : null));
}

/** Section head: signpost kicker + title (+ sub) and an optional count pill on the right. */
export function sectionHead(kicker, title, { count = null, sub = null, tight = false, cls = '', glyph: g = null } = {}) {
  return h('div', { class: `sec-hd ${tight ? 'tight' : ''} ${cls}` },
    g ? h('span', { class: 'sec-glyph', 'aria-hidden': 'true' }, glyph(g, 30)) : null,
    h('div', { class: 'grow' }, kicker ? h('span', { class: 'sr' }, kicker + ' · ') : null, h('h2', {}, title), sub ? h('div', { class: 'sec-sub' }, sub) : null),
    count != null ? (count instanceof Node ? count : h('span', { class: 'count-pill' }, count)) : null);
}

/** "done / total" pill for section heads and headers. */
export function countPill(done, total, { soft = false, icon: ic = null } = {}) {
  return h('span', { class: `count-pill ${soft ? 'soft' : ''}` }, ic ? glyph(ic, 14) : null, `${done} / ${total}`);
}

/** Category tone per item — drives the glyph tile colour and the card accent. */
export const ICON_TONE = { morning: 'dawn', homework: 'sky', explorer: 'sky', reading: 'fossil', quran: 'forest', prayer: 'forest', physical: 'clay', skill: 'gold', presentation: 'sky', evening: 'night' };

/**
 * Progress ring. `tone: 'hero'` draws ivory-on-forest with a gold arc for the
 * Today hero; the default is green-on-cream for light surfaces.
 */
export function ring(done, total, size = 66, tone = '') {
  const r = (size - 10) / 2, c = 2 * Math.PI * r, ratio = total ? done / total : 0;
  const track = tone === 'hero' ? 'rgba(246,240,228,.18)' : 'rgba(23,63,53,.10)';
  const arc = tone === 'hero' ? 'var(--gold)' : 'var(--green)';
  return h('div', { class: `ring ${tone ? 'ring-' + tone : ''}`, role: 'img', 'aria-label': `${done} / ${total} görev tamamlandı` },
    svg(`<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="8"/>
         <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${arc}" stroke-width="8" stroke-linecap="round"
           stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - ratio)}" style="transition:stroke-dashoffset .6s var(--ease)"/>`, { size, viewBox: `0 0 ${size} ${size}` }),
    h('div', { class: 'lbl' }, h('b', {}, done), h('small', {}, `/${total}`)));
}

/** Footprint trail: one print per core task, filled as they complete. */
export function trail(done, total) {
  return h('div', { class: 'trail', 'aria-hidden': 'true' },
    Array.from({ length: total }, (_, i) => h('span', { class: `tp ${i < done ? 'on' : ''}` }, footprintStamp(18))));
}

/**
 * Optional "How did it go?" chips shown after completion. The tap itself only
 * records "Yaptım" (unspecified); nothing is selected until Emir picks one.
 * Nothing here is mandatory — moving on leaves the task completed-unspecified.
 */
export function howChips(status, onPick, { open = true, onToggle = null } = {}) {
  const opts = [
    [STATUS.INDEPENDENT, '', 'Kendim yaptım'],
    [STATUS.REMINDER, 'warm', 'Hatırlatılınca yaptım'],
    [STATUS.ASSISTED, 'sky', 'Birlikte yaptık'],
  ];
  const cur = opts.find((o) => o[0] === status) || null;
  if (!open) {
    return h('div', { class: 'how compact' },
      h('button', { class: `chip ${cur ? cur[1] : 'muted'} on`, 'aria-expanded': 'false', onclick: (e) => { e.stopPropagation(); onToggle && onToggle(); } },
        icon('check', 16), cur ? cur[2] : STATUS_LABEL[status] || 'Yaptım', icon('chevronDown', 16)));
  }
  return h('div', { class: 'how' },
    cur ? null : h('div', { class: 'lbl' }, 'Nasıl yaptın?'),
    opts.map(([val, tone, label]) => h('button', {
      class: `chip ${tone} ${status === val ? 'on' : ''}`, 'aria-pressed': status === val ? 'true' : 'false',
      onclick: (e) => { e.stopPropagation(); onPick(status === val ? STATUS.COMPLETED_UNSPECIFIED : val); },
    }, status === val ? icon('check', 16) : null, label)));
}

/**
 * Category tile. With `id`, a premium daily icon (PREMIUM.daily) or the
 * Little Explorer identity is drawn as an image on a soft mint tile; without
 * one, the duotone glyph (or line icon) on the toned tile as before.
 */
export function taskIcon(name, tone = '', size = '', id = null) {
  const art = id === 'explorer' ? PREMIUM.littleExplorer : id ? dailyIcon(id) : null;
  if (art) return h('div', { class: `tile task-icon art ${id === 'explorer' ? 'identity' : ''} ${size}` }, h('img', { src: art, alt: '', loading: 'lazy', decoding: 'async', width: 48, height: 48 }));
  return h('div', { class: `tile task-icon ${tone} ${size}` }, GLYPH_NAMES.includes(name) ? glyph(name, size === 'lg' ? 34 : 28) : icon(name, size === 'lg' ? 30 : 26));
}

/** Routine step tile: the premium icon for the step when one exists, else the numbered / footprint tile. */
export function stepTile(stepId, index, on) {
  const art = dailyIcon(stepId);
  if (art) return h('span', { class: `step-tile art ${on ? 'on' : ''}`, 'aria-hidden': 'true' }, h('img', { src: art, alt: '', loading: 'lazy', decoding: 'async', width: 40, height: 40 }));
  return h('span', { class: 'step-tile', 'aria-hidden': 'true' }, on ? footprintStamp(18) : h('b', {}, String(index + 1)));
}

export function checkCircle(done, onClick) {
  return h('button', { class: 'task-check', 'aria-label': done ? 'Geri al' : 'Tamamla', 'aria-pressed': done ? 'true' : 'false', onclick: (e) => { e.stopPropagation(); onClick(); } }, icon('check', 26));
}

export function stamp() { return h('div', { class: 'task-stamp' }, footprintStamp(34)); }

export { STATUS_LABEL };
