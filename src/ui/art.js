import { svg } from './dom.js';

// Original SVG artwork for the child experience: duotone task glyphs, exercise
// pictograms, the Today hero landscape, expedition map zones, the mastery
// badge and the desktop "world" backdrop. Everything is drawn with plain
// shapes and CSS-variable colours, so there are no image payloads at all.

// ── Duotone task glyphs (32×32). `currentColor` = main tone, --g2 = soft tone.
const G2 = 'var(--g2, currentColor)';
const GLYPH = {
  sun: `<path d="M4 24h24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M6 22c4-6 9-8 14-6 3 1 5 2 6 6z" fill="${G2}" opacity=".55"/>
    <path d="M9 24a7 7 0 0 1 14 0z" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M16 7v3M8.5 10l2 2M23.5 10l-2 2M4 17h3M25 17h3"/></g>`,
  pencil: `<path d="M20.5 5.5l6 6L11 27l-7 1 1-7z" fill="${G2}" opacity=".55"/>
    <path d="M5 21l6 6-7 1z" fill="currentColor"/>
    <path d="M20.5 5.5l6 6-3 3-6-6z" fill="currentColor"/>
    <path d="M9 23l12-12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  compass: `<circle cx="16" cy="16" r="12" fill="${G2}" opacity=".55"/>
    <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <path d="M16 6l3 8-3 2-3-2z" fill="currentColor"/><path d="M16 26l-3-8 3-2 3 2z" fill="currentColor" opacity=".45"/>
    <circle cx="16" cy="16" r="2" fill="#fff"/>`,
  book: `<path d="M16 8c-3-2-7-2.6-11-2v18c4-.6 8 0 11 2z" fill="${G2}" opacity=".6"/>
    <path d="M16 8c3-2 7-2.6 11-2v18c-4-.6-8 0-11 2z" fill="currentColor"/>
    <path d="M16 8v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 11c2 0 4 .3 5.5 1M8 15c2 0 4 .3 5.5 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
  quran: `<rect x="6" y="4" width="20" height="24" rx="3" fill="${G2}" opacity=".6"/>
    <path d="M6 7a3 3 0 0 1 3-3h17v20H9a3 3 0 0 0-3 3z" fill="currentColor"/>
    <path d="M19.5 10.5a4.5 4.5 0 1 0 2.6 8.2 4 4 0 1 1 0-6.4 4.5 4.5 0 0 0-2.6-1.8z" fill="#fff" opacity=".95"/>
    <path d="M10 22h15" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
  prayer: `<path d="M5 27h22" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M9 27V18a7 7 0 0 1 14 0v9z" fill="currentColor"/>
    <path d="M16 6l-4 6h8z" fill="${G2}" opacity=".7"/><path d="M16 4v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 27V13l-1.5-3-1.5 3v14" fill="${G2}" opacity=".7"/><path d="M6 27V15l-1.5-3L3 15v12" fill="${G2}" opacity=".7"/>
    <path d="M16 27v-6a2 2 0 0 1 4 0v6" fill="#fff" opacity=".9"/>`,
  bolt: `<circle cx="16" cy="6" r="3.2" fill="currentColor"/>
    <path d="M16 9.5v9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M16 12l-7-6M16 12l7-6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M16 18.5l-6 9M16 18.5l6 9" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M4 12l2-2M28 12l-2-2" stroke="${G2}" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
  seed: `<path d="M5 26c3-3 8-3.5 11-2 3-1.5 8-1 11 2z" fill="${G2}" opacity=".6"/>
    <path d="M16 24V13" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M16 14c0-5 3.5-8 9-8 0 5-3.5 8-9 8z" fill="currentColor"/>
    <path d="M16 18c0-3.5-2.6-6-6.5-6 0 3.5 2.6 6 6.5 6z" fill="currentColor" opacity=".7"/>`,
  mic: `<rect x="11" y="3" width="10" height="16" rx="5" fill="currentColor"/>
    <path d="M7 14a9 9 0 0 0 18 0" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M16 23v5M11 28h10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M13 8h6M13 12h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>`,
  moon: `<path d="M22 5a11 11 0 1 0 5 20 9 9 0 0 1-5-20z" fill="currentColor"/>
    <g fill="${G2}"><circle cx="24" cy="8" r="1.4"/><circle cx="27.5" cy="13" r="1"/><circle cx="6" cy="9" r="1"/></g>`,
  map: `<path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3z" fill="${G2}" opacity=".6"/>
    <path d="M12 5v19M20 8v19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M15 14l3-3M22 20l3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  gift: `<rect x="4" y="12" width="24" height="6" rx="1.5" fill="currentColor"/>
    <rect x="6" y="18" width="20" height="10" rx="2" fill="${G2}" opacity=".65"/>
    <path d="M16 12v16" stroke="#fff" stroke-width="2.4"/><path d="M16 12c-3-5-9-4-8-1s5 1 8 1zM16 12c3-5 9-4 8-1s-5 1-8 1z" fill="currentColor"/>`,
  flag: `<path d="M7 28V5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M8 6h16l-3 5 3 5H8z" fill="currentColor"/><path d="M8 10h11l-1.5 2 1.5 2H8z" fill="${G2}" opacity=".5"/>`,
  fossil: `<path d="M16 28a12 12 0 1 1 0-24 8 8 0 1 1 0 16 4 4 0 1 1 0-8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="16" cy="16" r="12" fill="${G2}" opacity=".25"/>`,
  hand: `<path d="M8 15V8a2 2 0 0 1 4 0v6M12 12V6a2 2 0 0 1 4 0v8M16 12V7a2 2 0 0 1 4 0v8M20 15v-3a2 2 0 0 1 4 0v8a8 8 0 0 1-8 8h-1a8 8 0 0 1-7-4l-4-7a2 2 0 0 1 3.4-2L8 18" fill="${G2}" opacity=".6" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
  footprint: `<g fill="currentColor"><ellipse cx="15" cy="19" rx="5.5" ry="8"/><circle cx="8.5" cy="10" r="2.3"/><circle cx="13" cy="7" r="2.3"/><circle cx="18.5" cy="7" r="2.3"/><circle cx="23.5" cy="10" r="2.3"/></g>`,
  // Learning memory layer
  archive: `<path d="M4 12h24v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="${G2}" opacity=".6"/>
    <path d="M3 7a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v5H3z" fill="currentColor"/>
    <path d="M13 16h6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M4 12h24" stroke="currentColor" stroke-width="1.6" opacity=".5"/>`,
  library: `<path d="M5 6h5v20H5zM11 6h5v20h-5z" fill="${G2}" opacity=".6"/>
    <path d="M5 6h5v4H5zM11 6h5v4h-5z" fill="currentColor"/>
    <path d="M17.5 7.5l4.5-1.2 5 18.6-4.5 1.2z" fill="currentColor"/>
    <path d="M5 22h11M18.8 20.2l4.4-1.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
  scroll: `<path d="M8 6h16a3 3 0 0 1 3 3v1H11z" fill="currentColor"/>
    <path d="M8 6a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3V10H8z" fill="${G2}" opacity=".6"/>
    <path d="M5 23a3 3 0 0 0 3 3h13" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M11 15h8M11 19h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  leaf: `<path d="M5 27C5 15 12 7 27 5c-1 15-8 22-22 22z" fill="${G2}" opacity=".6"/>
    <path d="M5 27C9 19 15 13 22 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M12 21c3 0 5-1 7-3M9 24c2 0 4-.5 5-1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`,
};

export function glyph(name, size = 28, cls = '') {
  return svg(GLYPH[name] || GLYPH.flag, { size, viewBox: '0 0 32 32', cls: `glyph glyph-${name} ${cls}` });
}
export const GLYPH_NAMES = Object.keys(GLYPH);

// ── Exercise pictograms (48×32): stick figures, stroke = currentColor.
const FIG = 'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';
const HEAD = (x, y) => `<circle cx="${x}" cy="${y}" r="3.4" fill="currentColor"/>`;
const EXERCISE = {
  pushup: `${HEAD(8, 15)}<path d="M12 18h26l6 2" ${FIG}/><path d="M16 18l-2 8 4 0M32 19l-2 7" ${FIG}/><path d="M4 28h40" stroke="var(--g2,currentColor)" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
  plank: `${HEAD(8, 13)}<path d="M12 16h24l7 3" ${FIG}/><path d="M16 16l-4 8h6M35 17l-2 7" ${FIG}/><path d="M4 28h40" stroke="var(--g2,currentColor)" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
  jumping: `${HEAD(24, 6)}<path d="M24 10v10" ${FIG}/><path d="M24 12l-9-7M24 12l9-7" ${FIG}/><path d="M24 20l-7 9M24 20l7 9" ${FIG}/>`,
  squat: `${HEAD(22, 6)}<path d="M22 10v9" ${FIG}/><path d="M22 12h11M22 19l-7 3 3 7M22 19l7 3-3 7" ${FIG}/><path d="M4 30h40" stroke="var(--g2,currentColor)" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
  hang: `<path d="M6 5h36" stroke="var(--g2,currentColor)" stroke-width="3" stroke-linecap="round"/>${HEAD(24, 13)}<path d="M24 16v9" ${FIG}/><path d="M18 5v8l6 3 6-3V5" ${FIG}/><path d="M24 25l-4 6M24 25l4 6" ${FIG}/>`,
};
export function exerciseGlyph(id, size = 44, cls = '') {
  return svg(EXERCISE[id] || EXERCISE.jumping, { size, viewBox: '0 0 48 32', cls: `exg exg-${id} ${cls}` });
}

// ── Today hero landscape (400×220, slice-fitted). Dawn light over layered
// forest ridges, ferns in the foreground. (The footprint trail is DOM: see components.trail.)
export function heroScene() {
  const inner = `
    <defs>
      <radialGradient id="hs-sun" cx="78%" cy="18%" r="45%"><stop offset="0" stop-color="#F1D7A3" stop-opacity=".55"/><stop offset=".5" stop-color="#D9A64A" stop-opacity=".18"/><stop offset="1" stop-color="#D9A64A" stop-opacity="0"/></radialGradient>
      <linearGradient id="hs-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F0E4" stop-opacity="0"/><stop offset="1" stop-color="#F6F0E4" stop-opacity=".08"/></linearGradient>
    </defs>
    <rect width="400" height="220" fill="url(#hs-sun)"/>
    <circle cx="312" cy="40" r="22" fill="#F1D7A3" opacity=".9"/>
    <g fill="#276252"><path d="M-10 150 L40 92 L78 124 L118 76 L166 128 L206 96 L246 130 L288 100 L326 128 L362 104 L410 140 L410 230 L-10 230z"/></g>
    <path d="M-10 150 L40 92 L78 124 L118 76 L166 128 L206 96 L246 130 L288 100 L326 128 L362 104 L410 140 L410 230 L-10 230z" fill="url(#hs-mist)"/>
    <g fill="#215446"><path d="M-10 172 C50 150 90 158 130 146 C170 134 200 150 240 142 C290 132 330 150 410 138 L410 230 L-10 230z"/></g>
    <g fill="#173F35"><path d="M-10 196 C60 178 120 190 170 176 C220 162 280 184 330 172 C370 164 390 170 410 174 L410 230 L-10 230z"/></g>
    <g fill="#10302A"><path d="M-10 214 C80 200 160 212 240 202 C320 192 370 206 410 200 L410 230 L-10 230z"/></g>
    <!-- ferns -->
    <g fill="none" stroke="#2F7659" stroke-width="2.4" stroke-linecap="round" opacity=".9">
      <path d="M22 214 C26 190 34 176 48 166"/><path d="M30 196 C22 194 16 196 12 202"/><path d="M34 186 C28 182 22 182 18 186"/><path d="M40 176 C46 170 52 170 58 172"/><path d="M36 182 C42 180 48 182 52 186"/>
      <path d="M62 216 C60 200 62 188 70 178"/><path d="M66 198 C60 196 56 198 52 204"/><path d="M68 190 C74 186 80 188 84 192"/>
      <path d="M378 216 C376 200 380 190 390 182"/><path d="M382 202 C376 200 372 202 368 208"/><path d="M384 194 C390 190 396 192 400 196"/>
    </g>
    `;
  const el = svg(inner, { viewBox: '0 0 400 220', cls: 'hero-scene' });
  el.setAttribute('preserveAspectRatio', 'xMidYMax slice');
  el.removeAttribute('width'); el.removeAttribute('height');
  return el;
}

// ── Expedition zone scenes (400×150, slice-fitted, sit inside the cinematic panel).
const ZONE = {
  warm: `
    <path d="M-10 118 C60 104 120 112 200 106 C280 100 340 110 410 104 L410 160 L-10 160z" fill="#3B2E23"/>
    <path d="M-10 132 C80 124 160 130 250 124 C320 120 370 126 410 122 L410 160 L-10 160z" fill="#2A211A"/>
    <g fill="#F6F0E4" opacity=".9"><path d="M96 118 L128 70 L160 118z"/><path d="M128 70 L136 118 L120 118z" fill="#D9A64A"/></g>
    <g fill="#F6F0E4" opacity=".7"><path d="M250 122 L272 92 L294 122z"/></g>
    <g><path d="M190 120 l6 -18 l6 18z" fill="#D9A64A"/><path d="M196 102 l5 -12 l5 12z" fill="#F1D7A3"/><path d="M180 122 h32" stroke="#6B4A2E" stroke-width="3" stroke-linecap="round"/></g>
    <g stroke="#F6F0E4" stroke-width="2.4" stroke-linecap="round"><path d="M330 118 V76"/><path d="M330 76 h22 l-4 7 4 7 h-22" fill="#D9A64A"/></g>
    <g fill="#F1D7A3" opacity=".5"><circle cx="40" cy="30" r="1.4"/><circle cx="90" cy="18" r="1"/><circle cx="360" cy="26" r="1.2"/><circle cx="300" cy="40" r=".9"/></g>`,
  green: `
    <path d="M-10 60 L60 22 L110 56 L170 18 L230 58 L290 26 L350 60 L410 34 L410 160 L-10 160z" fill="#1E4A3C" opacity=".8"/>
    <path d="M-10 112 C60 96 120 104 200 96 C280 88 340 100 410 92 L410 160 L-10 160z" fill="#2B6A56"/>
    <path d="M120 122 C170 106 260 108 330 122 C280 134 170 136 120 122z" fill="#3D7EA6" opacity=".55"/>
    <path d="M-10 134 C80 124 160 132 250 126 C320 120 370 128 410 124 L410 160 L-10 160z" fill="#173F35"/>
    <g fill="none" stroke="#9FCB9B" stroke-width="2.6" stroke-linecap="round" opacity=".85">
      <path d="M30 136 C34 110 44 94 60 82"/><path d="M40 118 C30 114 22 116 16 124"/><path d="M46 104 C38 98 30 98 24 102"/><path d="M52 94 C60 86 68 86 76 90"/>
      <path d="M370 136 C368 116 374 104 386 96"/><path d="M374 124 C366 120 360 122 354 130"/><path d="M378 110 C386 104 392 106 398 112"/>
    </g>
    <g fill="#10302A"><path d="M228 96 C240 96 250 100 256 106 C262 100 266 88 274 80 C280 74 286 74 290 78 C282 86 280 94 280 100 C288 104 294 112 294 122 L226 122z"/><path d="M234 122 l0 12M252 122 l0 12M276 122 l0 12M288 122 l0 12" stroke="#10302A" stroke-width="6" stroke-linecap="round"/></g>`,
  amber: `
    <g><path d="M-10 60 L30 40 L70 62 L110 30 L150 64 L200 36 L250 66 L300 34 L350 62 L410 40 L410 160 L-10 160z" fill="#6B4A2E" opacity=".8"/>
    <path d="M-10 84 L410 74 L410 160 L-10 160z" fill="#8A5A3C" opacity=".7"/><path d="M-10 100 L410 92 L410 160 L-10 160z" fill="#A66B3E" opacity=".55"/>
    <path d="M-10 118 L410 110 L410 160 L-10 160z" fill="#5C3A22"/><path d="M-10 134 L410 128 L410 160 L-10 160z" fill="#3B2617"/></g>
    <g fill="none" stroke="#F1D7A3" stroke-width="3" stroke-linecap="round" opacity=".85">
      <path d="M120 122 c0 -20 12 -30 30 -30 s30 10 30 30"/><path d="M132 122 c0 -12 8 -18 18 -18 s18 6 18 18"/><path d="M144 122 c0 -6 3 -9 6 -9 s6 3 6 9"/>
      <path d="M260 124 l14 -16 M262 116 l6 -6 M270 124 l10 -10"/></g>
    <g fill="#F1D7A3" opacity=".9"><circle cx="330" cy="116" r="4"/><circle cx="342" cy="120" r="2.6"/></g>
    <g fill="none" stroke="#D9A64A" stroke-width="2.2" stroke-linecap="round"><path d="M46 122 c-8 -2 -12 -8 -10 -16 c6 4 10 10 10 16z"/><path d="M52 122 c0 -12 6 -18 14 -20 c-2 8 -6 16 -14 20z"/></g>`,
  blue: `
    <path d="M-10 70 L40 40 L80 72 L130 44 L180 74 L410 60 L410 160 L-10 160z" fill="#234E68" opacity=".7"/>
    <path d="M-10 92 L120 84 L150 60 L180 92 L410 86 L410 160 L-10 160z" fill="#3B2E23"/>
    <path d="M-10 108 C60 98 120 112 200 102 C280 92 340 108 410 100 L410 160 L-10 160z" fill="#3D7EA6"/>
    <path d="M-10 124 C60 116 120 128 200 120 C280 112 340 126 410 118 L410 160 L-10 160z" fill="#2B5F7E"/>
    <g fill="none" stroke="#DCEAF3" stroke-width="2.2" stroke-linecap="round" opacity=".8"><path d="M40 118 c8 -6 16 -6 24 0"/><path d="M200 112 c8 -6 16 -6 24 0"/><path d="M300 126 c8 -6 16 -6 24 0"/><path d="M120 132 c8 -6 16 -6 24 0"/></g>
    <g fill="#F6F0E4" opacity=".85"><path d="M262 44 L232 30 L242 44 L262 50 L282 44 L292 30z"/><path d="M262 44 L256 40 L266 32 L272 36z"/></g>
    <g fill="#F1D7A3" opacity=".8"><path d="M340 96 c4 -14 16 -14 20 0 c-4 6 -16 6 -20 0z"/><path d="M350 96 v-8" stroke="#3B2E23" stroke-width="1.2"/></g>`,
  ice: `
    <g fill="#DCEAF3" opacity=".22"><circle cx="40" cy="26" r="1.6"/><circle cx="120" cy="14" r="1.2"/><circle cx="210" cy="30" r="1"/><circle cx="300" cy="18" r="1.4"/><circle cx="370" cy="36" r="1"/><circle cx="160" cy="48" r=".8"/></g>
    <path d="M-10 128 L50 56 L90 96 L140 34 L190 92 L240 48 L290 100 L340 62 L410 118 L410 160 L-10 160z" fill="#2C4A5E"/>
    <g fill="#F6F0E4"><path d="M50 56 L36 74 L50 70 L64 76z"/><path d="M140 34 L122 58 L140 50 L158 60z"/><path d="M240 48 L226 66 L240 60 L254 68z"/><path d="M340 62 L326 78 L340 72 L354 80z"/></g>
    <path d="M-10 142 C60 132 120 140 200 134 C280 128 340 138 410 132 L410 160 L-10 160z" fill="#DCEAF3" opacity=".9"/>
    <path d="M-10 150 C80 144 160 150 250 146 C320 142 370 148 410 146 L410 160 L-10 160z" fill="#F6F0E4"/>
    <g stroke="#D9A64A" stroke-width="2.4" stroke-linecap="round"><path d="M140 34 V16"/><path d="M140 16 h14 l-3 5 3 5 h-14" fill="#D9A64A"/></g>`,
};
export function zoneScene(tone) {
  const el = svg(ZONE[tone] || ZONE.green, { viewBox: '0 0 400 150', cls: `zone-scene zone-${tone}` });
  el.setAttribute('preserveAspectRatio', 'xMidYMax slice');
  el.removeAttribute('width'); el.removeAttribute('height');
  return el;
}

// ── Mastery badge (48×48): gold medal with a footprint, leaf sprigs.
export function masteryBadge(size = 48, cls = '') {
  const inner = `
    <defs><radialGradient id="mb-g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#F1D7A3"/><stop offset=".6" stop-color="#D9A64A"/><stop offset="1" stop-color="#B9852E"/></radialGradient></defs>
    <path d="M16 30l-6 14 8-3 4 6 5-13z" fill="#2F7659"/><path d="M32 30l6 14-8-3-4 6-5-13z" fill="#245641"/>
    <circle cx="24" cy="22" r="17" fill="url(#mb-g)"/><circle cx="24" cy="22" r="13.5" fill="none" stroke="#F6F0E4" stroke-width="1.6" opacity=".7"/>
    <g fill="#173F35"><ellipse cx="24" cy="25" rx="4.6" ry="6.4"/><circle cx="18.6" cy="17.8" r="1.9"/><circle cx="22.2" cy="15.4" r="1.9"/><circle cx="26.6" cy="15.4" r="1.9"/><circle cx="30" cy="17.8" r="1.9"/></g>`;
  return svg(inner, { size, viewBox: '0 0 48 48', cls: `badge ${cls}` });
}

// ── Desktop backdrop (1200×360): soft ridges + ferns behind the child column.
export function worldDecor() {
  const inner = `
    <g fill="#2F7659" opacity=".10"><path d="M0 220 L120 130 L220 200 L340 110 L470 210 L600 140 L720 220 L860 120 L980 210 L1100 150 L1200 200 L1200 360 L0 360z"/></g>
    <g fill="#2F7659" opacity=".14"><path d="M0 280 C150 240 260 270 400 250 C560 228 680 268 820 250 C960 232 1080 262 1200 246 L1200 360 L0 360z"/></g>
    <g fill="#173F35" opacity=".16"><path d="M0 330 C200 300 400 330 600 312 C800 296 1000 328 1200 310 L1200 360 L0 360z"/></g>
    <g fill="none" stroke="#2F7659" stroke-width="3" stroke-linecap="round" opacity=".28">
      <path d="M60 340 C66 300 80 276 104 258"/><path d="M72 314 C60 310 50 312 42 322"/><path d="M80 296 C70 290 60 290 52 296"/><path d="M90 280 C100 270 112 270 122 276"/><path d="M84 288 C94 284 104 286 112 292"/>
      <path d="M1130 344 C1128 310 1136 292 1156 278"/><path d="M1134 322 C1122 318 1114 322 1106 332"/><path d="M1140 304 C1150 296 1160 298 1168 306"/>
    </g>
    <g fill="#D9A64A" opacity=".35">
      <g transform="translate(560 330) rotate(-70) scale(.7)"><ellipse cx="0" cy="4" rx="5" ry="7"/><circle cx="-6" cy="-5" r="2.2"/><circle cx="-1.5" cy="-8" r="2.2"/><circle cx="3.5" cy="-8" r="2.2"/><circle cx="8" cy="-5" r="2.2"/></g>
      <g transform="translate(640 322) rotate(-70) scale(.7)"><ellipse cx="0" cy="4" rx="5" ry="7"/><circle cx="-6" cy="-5" r="2.2"/><circle cx="-1.5" cy="-8" r="2.2"/><circle cx="3.5" cy="-8" r="2.2"/><circle cx="8" cy="-5" r="2.2"/></g>
    </g>`;
  const el = svg(inner, { viewBox: '0 0 1200 360', cls: 'world-svg' });
  el.setAttribute('preserveAspectRatio', 'xMidYMax slice');
  el.removeAttribute('width'); el.removeAttribute('height');
  return el;
}

/** Faint decorative motif for card corners (My Week). */
export function motif(name, size = 96) {
  return glyph(name, size, 'motif');
}

// ── Expedition world hero (800×450, slice-fitted). "Premium Friendly
// Expedition": a waterfall valley at golden hour — volumetric sun, misted
// blue ranges, a river, layered forest ridges and dinosaurs at meaningful
// scale (sauropods on the ridge, pterosaurs in the light, a triceratops in
// the foreground). Original inline SVG; content/artwork.js `worldHero`
// replaces it with the approved AI concept when that file exists. The lower
// third stays calm so the hero copy reads over the CSS shade.
const sauropod = (x, y, s, fill) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="${fill}" stroke="${fill}" stroke-linecap="round">
    <path d="M-30 -2 C-58 4 -80 14 -102 30" stroke-width="9" fill="none"/>
    <path d="M-74 14 C-88 20 -98 26 -110 34" stroke-width="4" fill="none"/>
    <ellipse cx="0" cy="0" rx="36" ry="17" stroke="none"/>
    <path d="M26 -6 C46 -28 58 -54 68 -84" stroke-width="11" fill="none"/>
    <ellipse cx="72" cy="-90" rx="10" ry="6.5" stroke="none"/>
    <rect x="-24" y="8" width="11" height="30" rx="5" stroke="none"/><rect x="-6" y="10" width="11" height="30" rx="5" stroke="none"/>
    <rect x="10" y="9" width="11" height="30" rx="5" stroke="none"/><rect x="24" y="6" width="11" height="30" rx="5" stroke="none"/>
  </g>`;
const pterosaur = (x, y, s, fill, rot = 0) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 6 C6 -3 12 -6 16 -1 C20 -6 26 -3 32 6 C26 1 21 2 16 7 C11 2 6 1 0 6z" fill="${fill}"/>`;
const triceratops = (x, y, s, fill) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <ellipse cx="0" cy="0" rx="40" ry="20"/>
    <path d="M36 4 C50 6 60 12 68 20" stroke="${fill}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M-30 -22 C-56 -34 -74 -18 -70 6 C-68 20 -50 26 -32 20z"/>
    <ellipse cx="-52" cy="8" rx="22" ry="15"/>
    <path d="M-60 -6 L-74 -34 L-52 -8z"/><path d="M-44 -8 L-40 -34 L-34 -6z"/>
    <rect x="-26" y="10" width="13" height="26" rx="6"/><rect x="-6" y="12" width="13" height="26" rx="6"/>
    <rect x="12" y="11" width="13" height="26" rx="6"/><rect x="26" y="8" width="13" height="26" rx="6"/>
  </g>`;
const fern = (x, y, s, stroke, flip = 1) => `
  <g transform="translate(${x} ${y}) scale(${s * flip} ${s})" fill="none" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round">
    <path d="M0 0 C4 -26 14 -42 30 -54"/><path d="M8 -20 C0 -22 -6 -20 -12 -12"/><path d="M12 -30 C4 -34 -2 -34 -8 -30"/><path d="M18 -40 C26 -46 32 -46 38 -42"/><path d="M14 -35 C22 -38 28 -36 32 -30"/><path d="M24 -48 C30 -52 36 -52 40 -48"/>
  </g>`;

export function worldScene() {
  const inner = `
    <defs>
      <linearGradient id="ws-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55869E"/><stop offset=".42" stop-color="#A9C2BE"/><stop offset=".62" stop-color="#E9D19E"/></linearGradient>
      <radialGradient id="ws-sun" cx="76%" cy="20%" r="42%"><stop offset="0" stop-color="#FFF3D0" stop-opacity=".95"/><stop offset=".3" stop-color="#F1D7A3" stop-opacity=".5"/><stop offset="1" stop-color="#D9A64A" stop-opacity="0"/></radialGradient>
      <linearGradient id="ws-fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF9" stop-opacity=".95"/><stop offset="1" stop-color="#DCEAF3" stop-opacity=".55"/></linearGradient>
      <linearGradient id="ws-river" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCEAF3" stop-opacity=".9"/><stop offset="1" stop-color="#3D7EA6" stop-opacity=".75"/></linearGradient>
      <filter id="ws-soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="ws-ray" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="800" height="450" fill="url(#ws-sky)"/>
    <rect width="800" height="450" fill="url(#ws-sun)"/>
    <circle cx="608" cy="92" r="30" fill="#FFF6DC"/>
    <circle cx="608" cy="92" r="52" fill="#FFF3D0" opacity=".28" filter="url(#ws-soft)"/>
    <!-- far range, in mist -->
    <path d="M0 246 L64 196 L126 232 L206 152 L288 222 L356 176 L430 236 L520 160 L602 226 L682 184 L760 232 L800 208 L800 450 L0 450z" fill="#6A93A4" opacity=".55"/>
    <path d="M0 262 L48 236 L110 256 L170 214 L240 258 L300 232 L360 268 L440 224 L500 262 L560 240 L640 270 L700 248 L760 276 L800 258 L800 450 L0 450z" fill="#557F90" opacity=".7"/>
    <!-- volumetric light -->
    <g fill="#FFF1C9" opacity=".16" filter="url(#ws-ray)"><polygon points="608,92 250,450 380,450"/><polygon points="608,92 430,450 500,450"/><polygon points="608,92 640,450 780,450"/><polygon points="608,92 0,250 0,360"/></g>
    <!-- mid range with the waterfall cliff -->
    <path d="M0 300 L84 246 L166 290 L246 222 L330 282 L400 250 L468 296 L556 240 L640 292 L720 256 L800 300 L800 450 L0 450z" fill="#3F6B75"/>
    <path d="M296 262 L346 262 L352 300 L292 300z" fill="#355C66"/>
    <path d="M318 262 C324 302 316 332 322 366" stroke="url(#ws-fall)" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M320 262 C326 302 318 332 324 366" stroke="#FFFDF9" stroke-width="5" opacity=".9" stroke-linecap="round" fill="none"/>
    <ellipse cx="324" cy="368" rx="40" ry="12" fill="#FFFDF9" opacity=".6" filter="url(#ws-soft)"/>
    <!-- mist bands -->
    <ellipse cx="180" cy="306" rx="250" ry="24" fill="#F6F0E4" opacity=".34" filter="url(#ws-soft)"/>
    <ellipse cx="620" cy="318" rx="230" ry="20" fill="#F6F0E4" opacity=".28" filter="url(#ws-soft)"/>
    <!-- pterosaurs in the light -->
    <g fill="#173F35" opacity=".8">${pterosaur(470, 118, 1.3, '#173F35', -8)}${pterosaur(524, 150, .95, '#173F35', 6)}${pterosaur(552, 104, .7, '#173F35', -14)}</g>
    <!-- ridge 1 + sauropods against the sun -->
    <path d="M0 342 C80 320 160 332 240 318 C330 302 400 328 480 314 C560 300 640 324 720 310 C760 302 785 308 800 312 L800 450 L0 450z" fill="#2B6A56"/>
    ${sauropod(562, 326, 1, '#173F35')}${sauropod(466, 338, .62, '#173F35')}
    <!-- river -->
    <path d="M300 378 C350 384 400 400 456 412 C530 428 600 434 690 450 L560 450 C500 438 440 428 396 412 C356 398 326 388 296 384z" fill="url(#ws-river)"/>
    <!-- foreground ridges -->
    <path d="M0 384 C100 364 200 380 300 368 C420 354 520 380 640 364 C720 354 770 362 800 366 L800 450 L0 450z" fill="#215446"/>
    ${triceratops(702, 388, .55, '#10302A')}
    <path d="M0 414 C120 398 240 412 360 402 C480 392 600 414 720 404 C760 400 785 404 800 406 L800 450 L0 450z" fill="#173F35"/>
    <path d="M0 438 C160 428 320 440 480 432 C640 424 720 436 800 430 L800 450 L0 450z" fill="#10302A"/>
    ${fern(28, 446, 1.1, '#2F7659')}${fern(68, 450, .8, '#2F7659')}${fern(776, 448, 1, '#2F7659', -1)}${fern(740, 450, .7, '#2F7659', -1)}`;
  const el = svg(inner, { viewBox: '0 0 800 450', cls: 'world-scene' });
  el.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  el.removeAttribute('width'); el.removeAttribute('height');
  return el;
}

// ── Explorer companion (120×120): a small, friendly young sauropod with an
// explorer's scarf. Purely visual identity — never speaks, never a feature.
export function companionArt(size = 96, cls = '') {
  const inner = `
    <defs><radialGradient id="cp-b" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4F9A72"/><stop offset="1" stop-color="#2F7659"/></radialGradient></defs>
    <path d="M38 78 C22 82 14 92 10 104" stroke="#2F7659" stroke-width="12" stroke-linecap="round" fill="none"/>
    <ellipse cx="62" cy="80" rx="30" ry="22" fill="url(#cp-b)"/>
    <ellipse cx="66" cy="90" rx="18" ry="9" fill="#9FCB9B" opacity=".85"/>
    <rect x="42" y="92" width="12" height="20" rx="6" fill="#2F7659"/><rect x="66" y="94" width="12" height="20" rx="6" fill="#2F7659"/>
    <path d="M80 66 C88 52 90 40 88 26" stroke="#2F7659" stroke-width="16" stroke-linecap="round" fill="none"/>
    <circle cx="90" cy="22" r="15" fill="#3E8A66"/>
    <ellipse cx="97" cy="26" rx="7" ry="4" fill="#9FCB9B" opacity=".8"/>
    <circle cx="84" cy="18" r="5.2" fill="#fff"/><circle cx="85.4" cy="18" r="2.8" fill="#10241C"/><circle cx="86.6" cy="16.8" r="1" fill="#fff"/>
    <path d="M74 36 C82 44 92 44 100 36" stroke="#D9A64A" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M74 38 L66 54 L78 46z" fill="#D9A64A"/>
    <g fill="#9FCB9B" opacity=".9"><circle cx="52" cy="66" r="3"/><circle cx="64" cy="62" r="3.4"/><circle cx="76" cy="66" r="3"/></g>`;
  return svg(inner, { size, viewBox: '0 0 120 120', cls: `companion ${cls}` });
}
