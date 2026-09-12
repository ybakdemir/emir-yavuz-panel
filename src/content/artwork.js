// Production artwork registry — the single place the UI looks for raster
// artwork. Every slot is optional: while a key is missing the UI draws the
// built-in original SVG (ui/art.js worldScene / companionArt, ui/dinos.js
// silhouettes), so nothing here blocks behaviour and no web images are ever
// referenced. See docs/ARTWORK.md for the exact files, sizes and names.
//
// Paths are relative to index.html. Prefer WebP; keep the hero ≤ 300 KB and
// each dinosaur ≤ 180 KB. The hero is the only image loaded eagerly; every
// card image is lazy-loaded (ui/dinos.js).
//
// Registered 2026-09-12 (Dinosaur Discovery Visual Redesign v1): the clean,
// unwatermarked images from the family's own dinosaur presentation and photo
// set. Species without a clean source (see docs/ARTWORK.md) stay on the SVG.
export const ARTWORK = {
  // Expedition hero — lush sauropod forest (presentation slide "Apatosaurus").
  // `focus` is the object-position used when the image is cropped on phones.
  worldHero: { src: 'assets/scenes/world-hero.webp', focus: '50% 45%' },

  // Species artwork, dino kind → path or { src, focus } (kinds: ui/dinos.js
  // DINO_KINDS). `focus` keeps the head in frame on portrait atlas covers.
  dinos: {
    trex: { src: 'assets/dinos/trex.webp', focus: '55% 45%' },
    triceratops: { src: 'assets/dinos/triceratops.webp', focus: '46% 50%' },
    brachiosaurus: { src: 'assets/dinos/brachiosaurus.webp', focus: '66% 40%' },
    diplodocus: { src: 'assets/dinos/diplodocus.webp', focus: '36% 40%' },
    spinosaurus: { src: 'assets/dinos/spinosaurus.webp', focus: '30% 55%' },
  },

  // Cinematic backdrops per expedition region tone (reserved, not drawn yet).
  //   e.g. scenes: { green: 'assets/scenes/jurassic.webp' }
  scenes: {},

  // Keşif Notları covers, note id (content/dinopedia.js FIELD_NOTES) → path.
  // Notes may reuse a species file; the browser fetches it once.
  notes: {
    what: 'assets/dinos/triceratops.webp',
    origin: 'assets/scenes/dusk.webp',
    eras: 'assets/dinos/diplodocus.webp',
    world: 'assets/scenes/valley.webp',
    extinction: 'assets/dinos/spinosaurus.webp',
  },

  // Small friendly explorer companion (purely visual, map footer).
  //   e.g. companion: 'assets/companion.webp'
  companion: null,
};

const entry = (v) => (typeof v === 'string' ? { src: v, focus: null } : v && v.src ? { src: v.src, focus: v.focus || null } : null);

/** Registered raster for a dino kind, or null (→ built-in SVG silhouette). */
export const dinoArt = (kind) => entry(ARTWORK.dinos?.[kind])?.src || null;

/** object-position for a dino kind's raster when it is cropped, or null. */
export const dinoFocus = (kind) => entry(ARTWORK.dinos?.[kind])?.focus || null;

/** Registered cover for a Keşif Notu, or null (→ tinted glyph tile). */
export const noteArt = (id) => ARTWORK.notes?.[id] || null;
