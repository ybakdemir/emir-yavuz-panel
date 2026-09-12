// Production artwork registry — the single place the UI looks for raster
// artwork. Every slot is optional: while a key is missing the UI draws the
// built-in original SVG (ui/art.js worldScene / companionArt, ui/dinos.js
// silhouettes), so nothing here blocks behaviour and no web images are ever
// referenced. See docs/ARTWORK.md for the exact files, sizes and names.
//
// Paths are relative to index.html. Prefer WebP; keep the hero ≤ 300 KB and
// each dinosaur ≤ 180 KB. The hero is the only image loaded eagerly; every
// card image is lazy-loaded (ui/dinos.js).
export const ARTWORK = {
  // Expedition hero — the approved "Premium Friendly Expedition" world
  // concept (waterfall valley, sauropods, pterosaurs, golden light).
  //   e.g. worldHero: { src: 'assets/scenes/world-hero.webp', focus: '50% 60%' }
  // `focus` is the object-position used when the image is cropped on phones.
  worldHero: null,

  // Species artwork, dino kind → path (kinds: ui/dinos.js DINO_KINDS).
  //   e.g. dinos: { mamenchisaurus: 'assets/dinos/mamenchisaurus.webp' }
  dinos: {},

  // Optional cinematic backdrops per expedition region tone.
  //   e.g. scenes: { green: 'assets/scenes/jurassic.webp' }
  scenes: {},

  // Small friendly explorer companion (purely visual, hero + map footer).
  //   e.g. companion: 'assets/companion.webp'
  companion: null,
};

/** Registered raster for a dino kind, or null (→ built-in SVG silhouette). */
export const dinoArt = (kind) => ARTWORK.dinos?.[kind] || null;
