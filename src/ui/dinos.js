import { svg } from './dom.js';
import { dinoArt } from '../content/artwork.js';

// Flat, two-tone dinosaur silhouettes (viewBox 240×160). Colours come from
// CSS variables so the same drawing works on warm day screens and on the
// deep expedition panel:  --dino-a body, --dino-b accent/belly, --dino-c dark.
const A = 'var(--dino-a,#3E7C5A)', B = 'var(--dino-b,#9FCB9B)', C = 'var(--dino-c,#1F2A24)';
const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff"/><circle cx="${x + 0.8}" cy="${y}" r="1.7" fill="${C}"/>`;
const leg = (x, y, w, hgt, r = 7) => `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${r}" fill="${A}"/>`;

const D = {
  brachiosaurus: `
    ${leg(88, 112, 18, 42)}${leg(140, 112, 18, 42)}
    <ellipse cx="118" cy="106" rx="56" ry="30" fill="${A}"/>
    <ellipse cx="118" cy="118" rx="40" ry="14" fill="${B}"/>
    ${leg(100, 118, 18, 38)}${leg(152, 118, 18, 38)}
    <path d="M66 100 C40 104 22 118 8 138" stroke="${A}" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M152 92 C172 74 186 52 196 28" stroke="${A}" stroke-width="24" stroke-linecap="round" fill="none"/>
    <ellipse cx="200" cy="24" rx="18" ry="12" fill="${A}"/>
    <ellipse cx="206" cy="27" rx="9" ry="5" fill="${B}"/>
    ${eye(203, 20)}`,
  diplodocus: `
    ${leg(92, 110, 16, 40)}${leg(136, 110, 16, 40)}
    <ellipse cx="118" cy="104" rx="50" ry="26" fill="${A}"/>
    <ellipse cx="118" cy="114" rx="36" ry="12" fill="${B}"/>
    ${leg(104, 116, 16, 36)}${leg(148, 116, 16, 36)}
    <path d="M70 100 C40 100 20 116 4 146" stroke="${A}" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M40 112 C24 120 12 134 4 146" stroke="${A}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M164 96 C192 90 214 74 230 56" stroke="${A}" stroke-width="16" stroke-linecap="round" fill="none"/>
    <ellipse cx="228" cy="54" rx="13" ry="8" fill="${A}"/>
    ${eye(229, 51)}`,
  mamenchisaurus: `
    ${leg(76, 112, 16, 40)}${leg(118, 112, 16, 40)}
    <ellipse cx="100" cy="106" rx="46" ry="24" fill="${A}"/>
    <ellipse cx="100" cy="116" rx="32" ry="11" fill="${B}"/>
    ${leg(88, 118, 16, 36)}${leg(130, 118, 16, 36)}
    <path d="M56 104 C30 104 14 120 2 148" stroke="${A}" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M142 96 C170 90 196 70 214 40 C222 26 228 16 232 8" stroke="${A}" stroke-width="15" stroke-linecap="round" fill="none"/>
    <path d="M150 92 C176 84 200 66 216 40" stroke="${B}" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>
    <ellipse cx="230" cy="8" rx="11" ry="7" fill="${A}"/>
    ${eye(231, 5)}`,
  stegosaurus: `
    <g fill="${B}">
      <path d="M72 78 L84 46 L96 80z"/><path d="M96 70 L112 30 L128 72z"/><path d="M128 68 L146 26 L164 70z"/><path d="M164 74 L180 42 L194 80z"/>
    </g>
    ${leg(84, 112, 20, 42)}${leg(150, 112, 20, 42)}
    <ellipse cx="128" cy="100" rx="64" ry="34" fill="${A}"/>
    <ellipse cx="128" cy="116" rx="46" ry="14" fill="${B}"/>
    ${leg(98, 118, 20, 38)}${leg(162, 118, 20, 38)}
    <path d="M186 100 C210 100 224 110 236 124" stroke="${A}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <g fill="${B}"><path d="M212 100 L224 86 L226 104z"/><path d="M226 110 L240 100 L238 118z"/></g>
    <path d="M70 104 C56 106 44 112 34 118" stroke="${A}" stroke-width="18" stroke-linecap="round" fill="none"/>
    <ellipse cx="30" cy="120" rx="18" ry="11" fill="${A}"/>
    ${eye(27, 116)}`,
  trex: `
    <path d="M78 96 C48 100 26 112 6 128" stroke="${A}" stroke-width="22" stroke-linecap="round" fill="none"/>
    <ellipse cx="112" cy="94" rx="50" ry="32" fill="${A}" transform="rotate(-12 112 94)"/>
    <ellipse cx="116" cy="108" rx="34" ry="14" fill="${B}" transform="rotate(-12 116 108)"/>
    <path d="M100 118 L92 150" stroke="${A}" stroke-width="20" stroke-linecap="round"/>
    <path d="M86 150 L108 150" stroke="${A}" stroke-width="10" stroke-linecap="round"/>
    <path d="M128 114 L134 148" stroke="${A}" stroke-width="20" stroke-linecap="round"/>
    <path d="M124 148 L148 148" stroke="${A}" stroke-width="10" stroke-linecap="round"/>
    <path d="M148 90 L166 100" stroke="${A}" stroke-width="8" stroke-linecap="round"/>
    <path d="M148 78 C160 62 172 54 186 52" stroke="${A}" stroke-width="26" stroke-linecap="round" fill="none"/>
    <path d="M160 40 L226 44 L230 66 L214 82 L166 78z" fill="${A}"/>
    <path d="M178 66 L226 66 L214 80 L172 78z" fill="${B}"/>
    <path d="M176 68 L228 66" stroke="${C}" stroke-width="2"/>
    <g fill="#fff"><path d="M184 68 L188 76 L192 68z"/><path d="M198 67 L202 75 L206 67z"/><path d="M212 66 L215 73 L218 66z"/></g>
    ${eye(182, 52)}`,
  allosaurus: `
    <path d="M80 98 C50 102 28 114 8 130" stroke="${A}" stroke-width="18" stroke-linecap="round" fill="none"/>
    <ellipse cx="112" cy="96" rx="46" ry="28" fill="${A}" transform="rotate(-12 112 96)"/>
    <ellipse cx="116" cy="108" rx="30" ry="12" fill="${B}" transform="rotate(-12 116 108)"/>
    <path d="M100 118 L94 150" stroke="${A}" stroke-width="18" stroke-linecap="round"/><path d="M88 150 L108 150" stroke="${A}" stroke-width="9" stroke-linecap="round"/>
    <path d="M128 114 L134 148" stroke="${A}" stroke-width="18" stroke-linecap="round"/><path d="M124 148 L146 148" stroke="${A}" stroke-width="9" stroke-linecap="round"/>
    <path d="M144 92 L166 106" stroke="${A}" stroke-width="8" stroke-linecap="round"/>
    <path d="M148 80 C160 64 170 56 184 54" stroke="${A}" stroke-width="22" stroke-linecap="round" fill="none"/>
    <path d="M164 44 L224 50 L226 68 L212 80 L168 76z" fill="${A}"/>
    <path d="M180 68 L224 68 L212 78 L176 76z" fill="${B}"/>
    <path d="M178 46 L186 36 L194 48z" fill="${B}"/>
    <g fill="#fff"><path d="M186 70 L190 77 L194 70z"/><path d="M202 69 L205 76 L208 69z"/></g>
    ${eye(184, 56)}`,
  triceratops: `
    ${leg(112, 112, 20, 42)}${leg(166, 112, 20, 42)}
    <ellipse cx="140" cy="100" rx="62" ry="34" fill="${A}"/>
    <ellipse cx="146" cy="116" rx="44" ry="14" fill="${B}"/>
    ${leg(126, 118, 20, 38)}${leg(180, 118, 20, 38)}
    <path d="M198 102 C214 104 226 112 236 122" stroke="${A}" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M92 60 C60 46 40 66 46 100 C50 120 74 124 92 116z" fill="${B}"/>
    <ellipse cx="64" cy="98" rx="34" ry="24" fill="${A}"/>
    <path d="M44 110 L24 112 L30 100z" fill="${A}"/>
    <path d="M52 80 L34 48 L60 78z" fill="#F4EFE6"/>
    <path d="M76 78 L68 44 L88 76z" fill="#F4EFE6"/>
    <path d="M38 102 L22 98 L36 92z" fill="#F4EFE6"/>
    ${eye(50, 96)}`,
  velociraptor: `
    <path d="M84 96 L8 118" stroke="${A}" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="116" cy="88" rx="40" ry="18" fill="${A}" transform="rotate(-18 116 88)"/>
    <ellipse cx="118" cy="96" rx="26" ry="8" fill="${B}" transform="rotate(-18 118 96)"/>
    <path d="M106 104 L100 128 L112 148" stroke="${A}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M108 148 L124 148" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
    <path d="M130 100 L136 124 L128 146" stroke="${A}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M124 146 L140 146" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
    <path d="M140 82 L156 92" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
    <path d="M146 76 C158 62 170 54 180 52" stroke="${A}" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M170 44 L224 52 L222 64 L170 66z" fill="${A}"/>
    <path d="M180 60 L222 62 L220 66 L178 66z" fill="${B}"/>
    <g fill="${B}"><path d="M150 44 L160 30 L164 46z"/><path d="M166 42 L176 28 L178 44z"/></g>
    ${eye(182, 54)}`,
  ankylosaurus: `
    ${leg(84, 116, 20, 34)}${leg(150, 116, 20, 34)}
    <ellipse cx="124" cy="104" rx="70" ry="30" fill="${A}"/>
    <ellipse cx="124" cy="118" rx="50" ry="12" fill="${B}"/>
    ${leg(100, 122, 20, 30)}${leg(166, 122, 20, 30)}
    <g fill="${B}"><circle cx="80" cy="84" r="6"/><circle cx="100" cy="78" r="7"/><circle cx="122" cy="75" r="7"/><circle cx="144" cy="78" r="7"/><circle cx="164" cy="84" r="6"/><circle cx="90" cy="96" r="4"/><circle cx="112" cy="92" r="4"/><circle cx="134" cy="92" r="4"/><circle cx="156" cy="96" r="4"/></g>
    <path d="M190 104 L222 100" stroke="${A}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="228" cy="98" r="13" fill="${B}"/>
    <path d="M58 106 C44 108 34 112 26 118" stroke="${A}" stroke-width="16" stroke-linecap="round" fill="none"/>
    <ellipse cx="26" cy="118" rx="18" ry="11" fill="${A}"/>
    ${eye(22, 114)}`,
  pteranodon: `
    <path d="M120 82 L14 44 L44 96 L120 100z" fill="${A}"/>
    <path d="M120 82 L226 44 L196 96 L120 100z" fill="${A}"/>
    <path d="M120 88 L52 60 L64 92z" fill="${B}"/>
    <path d="M120 88 L188 60 L176 92z" fill="${B}"/>
    <ellipse cx="120" cy="94" rx="14" ry="26" fill="${A}"/>
    <ellipse cx="120" cy="104" rx="8" ry="14" fill="${B}"/>
    <path d="M120 70 L104 56 L142 50z" fill="${A}"/>
    <path d="M112 62 L84 48 L110 54z" fill="${B}"/>
    <path d="M112 128 L104 150 M128 128 L136 150" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
    ${eye(120, 60)}`,
  parasaurolophus: `
    <path d="M78 100 C48 104 26 116 6 130" stroke="${A}" stroke-width="18" stroke-linecap="round" fill="none"/>
    <ellipse cx="114" cy="96" rx="50" ry="30" fill="${A}" transform="rotate(-10 114 96)"/>
    <ellipse cx="118" cy="110" rx="34" ry="13" fill="${B}" transform="rotate(-10 118 110)"/>
    <path d="M100 118 L94 150" stroke="${A}" stroke-width="18" stroke-linecap="round"/><path d="M88 150 L108 150" stroke="${A}" stroke-width="9" stroke-linecap="round"/>
    <path d="M132 114 L138 148" stroke="${A}" stroke-width="18" stroke-linecap="round"/><path d="M128 148 L150 148" stroke="${A}" stroke-width="9" stroke-linecap="round"/>
    <path d="M148 88 L166 100" stroke="${A}" stroke-width="7" stroke-linecap="round"/>
    <path d="M150 80 C160 62 168 52 178 44" stroke="${A}" stroke-width="20" stroke-linecap="round" fill="none"/>
    <ellipse cx="190" cy="44" rx="22" ry="14" fill="${A}"/>
    <path d="M196 54 L216 60 L210 44z" fill="${B}"/>
    <path d="M180 34 L150 8" stroke="${A}" stroke-width="10" stroke-linecap="round"/>
    <path d="M180 34 L150 8" stroke="${B}" stroke-width="4" stroke-linecap="round"/>
    ${eye(192, 40)}`,
  spinosaurus: `
    <path d="M64 90 C90 30 150 26 176 86" fill="${B}"/>
    <g stroke="${A}" stroke-width="2"><path d="M84 88 L94 50"/><path d="M104 88 L110 40"/><path d="M124 88 L126 38"/><path d="M144 88 L142 44"/><path d="M162 88 L156 56"/></g>
    <path d="M76 100 C46 104 24 116 4 132" stroke="${A}" stroke-width="18" stroke-linecap="round" fill="none"/>
    <ellipse cx="118" cy="100" rx="54" ry="26" fill="${A}"/>
    <ellipse cx="120" cy="112" rx="36" ry="10" fill="${B}"/>
    <path d="M102 118 L96 150" stroke="${A}" stroke-width="16" stroke-linecap="round"/><path d="M90 150 L110 150" stroke="${A}" stroke-width="8" stroke-linecap="round"/>
    <path d="M136 118 L142 150" stroke="${A}" stroke-width="16" stroke-linecap="round"/><path d="M132 150 L154 150" stroke="${A}" stroke-width="8" stroke-linecap="round"/>
    <path d="M154 94 L170 106" stroke="${A}" stroke-width="7" stroke-linecap="round"/>
    <path d="M160 88 C170 76 178 70 186 66" stroke="${A}" stroke-width="18" stroke-linecap="round" fill="none"/>
    <path d="M176 58 L236 66 L236 76 L180 78z" fill="${A}"/>
    <path d="M186 72 L236 74 L236 76 L184 78z" fill="${B}"/>
    ${eye(186, 64)}`,
  egg: `
    <path d="M120 22 C158 22 182 70 182 106 C182 134 154 150 120 150 C86 150 58 134 58 106 C58 70 82 22 120 22z" fill="${B}"/>
    <path d="M120 40 C146 40 164 76 164 104 C164 124 146 136 120 136 C94 136 76 124 76 104 C76 76 94 40 120 40z" fill="${A}" opacity=".25"/>
    <g fill="${A}"><circle cx="100" cy="72" r="8"/><circle cx="140" cy="60" r="6"/><circle cx="132" cy="108" r="9"/><circle cx="96" cy="116" r="5"/></g>`,
};

/**
 * A dinosaur, drawn from the SVG set unless production artwork for it has been
 * registered in content/artwork.js (see docs/ARTWORK.md for the asset spec).
 * The image keeps the same 3:2 box and the `dino` class so layouts don't move.
 * Raster art is lazy-loaded unless `eager` (hero / reveal sheet) is set.
 */
export function dino(kind, { size = 120, cls = '', eager = false } = {}) {
  const art = dinoArt(kind);
  if (art) {
    const img = document.createElement('img');
    img.src = art; img.alt = ''; img.width = size; img.height = Math.round(size * 2 / 3);
    img.loading = eager ? 'eager' : 'lazy'; img.decoding = 'async';
    img.className = `dino dino-${kind} dino-art ${cls}`;
    return img;
  }
  const inner = D[kind] || D.egg;
  return svg(inner, { size, viewBox: '0 0 240 160', cls: `dino dino-${kind} ${cls}` });
}

/** True when the kind has real registered artwork (cards can then drop the silhouette tint). */
export const hasDinoArt = (kind) => !!dinoArt(kind);

export const DINO_KINDS = Object.keys(D);
