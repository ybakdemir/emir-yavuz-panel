// Production artwork registry — empty until final, family-approved assets
// exist in the repository. While a key is missing the UI draws the built-in
// SVG silhouette (ui/dinos.js) or CSS scene (ui/art.js), so nothing here
// blocks behaviour. No web images are referenced; see docs/ARTWORK.md for the
// exact files, sizes and names to drop in.
//
//   dino kind  →  path relative to index.html
//   e.g.  mamenchisaurus: 'assets/dinos/mamenchisaurus.webp'
export const ARTWORK = {};

// Optional cinematic backdrops per expedition region tone (see docs/ARTWORK.md).
//   tone  →  path, e.g.  jurassic: 'assets/scenes/jurassic.webp'
export const SCENES = {};
