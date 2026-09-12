# EPDS v2 — Artwork manifest (Friendly Expedition / Cinematic Explorer)

The product ships with built-in SVG dinosaurs (`src/ui/dinos.js`) and CSS scenes
(`src/ui/art.js`). **No web images are embedded** and none may be added from the
internet. When final, family-approved AI artwork exists, drop the files below into
the repo and register them in `src/content/artwork.js`; every slot falls back to
the SVG/CSS version until then, so nothing here blocks behaviour.

## Registry
```js
// src/content/artwork.js
export const ARTWORK = { mamenchisaurus: 'assets/dinos/mamenchisaurus.webp', /* … */ };
export const SCENES  = { jurassic: 'assets/scenes/jurassic.webp', /* … */ };
```
`dino(kind)` renders an `<img class="dino dino-art">` with the same 3:2 box as the
SVG, so layouts (Today hero, Haftam note, Expedition cards, reveal sheet) do not move.

## Dinosaur cards — `assets/dinos/<kind>.webp`
| kind | where it appears |
|---|---|
| brachiosaurus, triceratops, trex | Today hero (state-dependent) |
| velociraptor | Haftam "Kaşif notu" |
| diplodocus, brachiosaurus, mamenchisaurus, stegosaurus, allosaurus, velociraptor, ankylosaurus, triceratops, pteranodon, parasaurolophus, spinosaurus | Expedition cards + reveal sheet |
| stegosaurus, parasaurolophus | Milestone sheets (skill graduated, presentation) |

Spec: **1200 × 800 px** (3:2), WebP, transparent or soft-vignette background, subject centred with ~8 % margin, ≤ 180 KB each. Style: *Friendly Expedition* — expressive, polished 3D/modern-illustration, warm light, not babyish. Also export a **360 × 240** thumbnail as `<kind>@1x.webp` if card grids feel heavy on 3G.

## Region backdrops — `assets/scenes/<tone>.webp`
Tones: `warm` (Ana Kamp), `green` (Jura Vadisi), `amber` (Fosil Kanyonu), `blue` (Kretase Kıyısı), `ice` (Kuzey Zirveleri).
Spec: **1600 × 900 px** (16:9), WebP, ≤ 300 KB, *Cinematic Explorer / AI Fantasy Natural History* — waterfalls, mist, sun rays, dinosaurs at meaningful scale. Must keep the lower third calm so the zone text stays legible over the existing mist overlay (`.zone-mist`).

## Reveal / discovery hero (optional) — `assets/scenes/reveal.webp`
1200 × 1200 px, used behind `.cine-art` on the reveal sheet when registered as `SCENES.reveal`.

## Rules
* Never watermarked or copyrighted reference imagery; the supplied educational presentation and reference photos are inspiration only.
* Keep the UI primary: artwork sits inside the existing slots, no new layout.
* File names are lower-case, ASCII, and match the `kind`/`tone` keys exactly.
