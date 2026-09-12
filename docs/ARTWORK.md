# EPDS v2 — Artwork manifest (Friendly Expedition / Cinematic Explorer)

The product ships with built-in SVG dinosaurs (`src/ui/dinos.js`) and CSS scenes
(`src/ui/art.js`). **No web images are embedded** and none may be added from the
internet. When final, family-approved AI artwork exists, drop the files below into
the repo and register them in `src/content/artwork.js`; every slot falls back to
the SVG/CSS version until then, so nothing here blocks behaviour.

## Registry
```js
// src/content/artwork.js
export const ARTWORK = {
  worldHero: { src: 'assets/scenes/world-hero.webp', focus: '50% 60%' }, // Expedition hero (eager)
  dinos:     { mamenchisaurus: 'assets/dinos/mamenchisaurus.webp', /* … */ }, // cards, reveal, detail (lazy)
  scenes:    { green: 'assets/scenes/jurassic.webp', /* … */ },                // zone backdrops (reserved)
  companion: 'assets/companion.webp',                                          // explorer companion (hero + map foot)
};
```
Every slot is optional and `null`/empty by default. `dino(kind)` renders an `<img class="dino dino-art">`
with the same 3:2 box as the SVG; `worldHero` replaces `art.worldScene()`, `companion` replaces
`art.companionArt()`. `tests/artwork.test.js` fails the build if a registered path is a web URL.

## World hero — `assets/scenes/world-hero.webp`
The approved *Premium Friendly Expedition* concept (waterfall valley, sauropods, pterosaurs, golden light).
Spec: **1600 × 900 px** (16:9), WebP, ≤ 300 KB. It is cropped to ~390 × 332 on phones with
`object-position` = `focus`, so keep the subject in the centre-right and the lower-left third calm
(the title, count and progress bar sit there over a green shade). Until the file exists the built-in
SVG scene (`src/ui/art.js worldScene`) is drawn — same composition, so the layout will not move.

## Companion — `assets/companion.webp`
**512 × 512 px**, transparent background, ≤ 80 KB. A small friendly young dinosaur; shown at 96–120 px
in the hero and 56 px in the map footer. Fallback: `companionArt()` SVG.

## Dinosaur cards — `assets/dinos/<kind>.webp`
| kind | where it appears |
|---|---|
| brachiosaurus, triceratops, trex | Today hero (state-dependent) |
| velociraptor | Haftam "Kaşif notu" |
| diplodocus, brachiosaurus, mamenchisaurus, stegosaurus, allosaurus, velociraptor, ankylosaurus, triceratops, pteranodon, parasaurolophus, spinosaurus | Expedition cards (3:2 artwork area, `object-fit: cover`), reveal sheet, detail sheet, Today discovery thumb |
| stegosaurus, parasaurolophus | Milestone sheets (skill graduated, presentation) |

Spec: **1200 × 800 px** (3:2), WebP, ≤ 180 KB each. Cards and the detail sheet fill the whole 3:2 area (`object-fit: cover`), so a painted scene background is fine; the reveal sheet and Today thumb show the same file contained. Locked cards keep drawing the SVG silhouette in mist even when artwork exists — the artwork is the reward. Style: *Friendly Expedition* — expressive, polished 3D/modern-illustration, warm light, not babyish. Also export a **360 × 240** thumbnail as `<kind>@1x.webp` if card grids feel heavy on 3G.

## Region backdrops — `assets/scenes/<tone>.webp`
Tones: `warm` (Ana Kamp), `green` (Jura Vadisi), `amber` (Fosil Kanyonu), `blue` (Kretase Kıyısı), `ice` (Kuzey Zirveleri).
Spec: **1600 × 900 px** (16:9), WebP, ≤ 300 KB, *Cinematic Explorer / AI Fantasy Natural History* — waterfalls, mist, sun rays, dinosaurs at meaningful scale. Must keep the lower third calm so the zone text stays legible over the existing mist overlay (`.zone-mist`).

## Reveal / discovery hero (optional) — `assets/scenes/reveal.webp`
1200 × 1200 px, used behind `.cine-art` on the reveal sheet when registered as `SCENES.reveal`.

## Rules
* Never watermarked or copyrighted reference imagery; the supplied educational presentation and reference photos are inspiration only.
* Keep the UI primary: artwork sits inside the existing slots, no new layout.
* File names are lower-case, ASCII, and match the `kind`/`tone` keys exactly.
