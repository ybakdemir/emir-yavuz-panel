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
  worldHero: { src: 'assets/scenes/world-hero.webp', focus: '50% 45%' },       // Expedition hero (eager)
  dinos:     { trex: { src: 'assets/dinos/trex.webp', focus: '55% 45%' }, /* … */ }, // atlas, map cards, reveal, detail (lazy)
  scenes:    { green: 'assets/scenes/jurassic.webp', /* … */ },                // zone backdrops (reserved)
  notes:     { what: 'assets/dinos/triceratops.webp', /* … */ },               // Keşif Notları covers (note id → path)
  companion: 'assets/companion.webp',                                          // explorer companion (map foot)
};
```
Every slot is optional and `null`/empty by default. A `dinos` entry is a path or `{ src, focus }`; `focus` is the
`object-position` used where the 3:2 file is cropped (4:5 atlas covers, 16:10 species hero). `dino(kind)` renders an
`<img class="dino dino-art">` with the same 3:2 box as the SVG; `dino(kind, { silhouette: true })` forces the SVG for
decorative slots (Today hero, Haftam note, milestone sheets, locked map cards). `worldHero` replaces `art.worldScene()`,
`companion` replaces `art.companionArt()`. `tests/artwork.test.js` fails the build if a registered path is a web URL
or the file is missing.

## Registered files (Dinosaur Discovery Visual Redesign v1, 2026-09-12)
All files were cut from the family's own material — the presentation `Emir_Yavuz_Seri1_Dinozorlar_v4.pptx` and the
reference photo set — converted to WebP with PIL (no upscaling, no web fetch). Only images with **no watermark, no
logo, no visible signature** and enough resolution were used.

| file | source | use |
|---|---|---|
| `assets/scenes/world-hero.webp` 1600×900, 225 KB | pptx slide 11 image (sauropod herd in a mossy forest) | Expedition hero (eager) |
| `assets/dinos/trex.webp` 1200×800, 175 KB | `Trex.jpg` (3D render, ferns) | T-Rex atlas card / map card / reveal / detail |
| `assets/dinos/triceratops.webp` 1200×800, 176 KB | pptx slide 13 image (model in green foliage), light denoise | Triceratops · also cover of note "Dinozor nedir?" |
| `assets/dinos/brachiosaurus.webp` 1200×800, 76 KB | pptx slide 19 image (misty swamp) | Brachiosaurus |
| `assets/dinos/diplodocus.webp` 1200×800, 131 KB | `diplodocus.jpg` (3D render, shoreline) | Diplodocus · also cover of note "Üç büyük dönem" |
| `assets/dinos/spinosaurus.webp` 1200×800, 81 KB | `Spinosaurus.jpg` (3D render, storm) | Spinosaurus · also cover of note "Nasıl yok oldular?" |
| `assets/scenes/valley.webp` 1200×800, 198 KB | `Apatosaurus.png` (lush valley, light rays) | cover of note "Dinozorlar yaşarken dünya" |
| `assets/scenes/dusk.webp` 1200×800, 139 KB | `titanosaurus.jpg` (sauropod at dusk) | cover of note "Nasıl ortaya çıktılar?" |

Total 1.2 MB; only the hero is eager. Species without a clean source keep the SVG silhouette: **mamenchisaurus**
(both candidates carry an artist signature / © watermark), **stegosaurus, allosaurus, velociraptor, ankylosaurus,
pteranodon, parasaurolophus** (no image supplied).

### Classification of the supplied images
* **USE** — `Trex.jpg`, `diplodocus.jpg`, `Spinosaurus.jpg`, `Apatosaurus.png`, `titanosaurus.jpg` / pptx `image17`,
  pptx `image2` (Triceratops), `image7` (forest herd → hero), `image18` (Brachiosaurus).
* **REFERENCE ONLY** — `Mamenchisaurus.jpg` / pptx `image15` (artist signature, bottom-left), pptx `image4`
  (Spinosaurus painting, signed "ME"), the 4K T-Rex wallpaper + pptx `image1`/`image8` (wallpaper-site origin,
  animatronic photo; the clean 3D render was used instead), `titanosaurus 2.jpg` (612 px, too small), pptx `image6`
  (dark, blurry documentary still), `image9` (crude photocomposite), `image13` (soft documentary still),
  `volkanodon.jpg` / `image19` (park statue), `image10`, `image12` (species not in the product).
* **REJECT** — `ARGENTINOSAURUS.png` (Prehistoric Kingdom logo + "Early Access" watermark), `Magyarosaurus.jpg`,
  `titanosaurus 3.jpg`, pptx `image5`, `image11`, `image14` (DinosaurPictures.org watermark), `Mamenchisaurus 2.jpg` /
  pptx `image16` (© Sergey Krasovskiy), `TRICERATOPS.jpg` (BBC Earth logo), pptx `image3` (Jurassic Park logo).

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

Spec: **1200 × 800 px** (3:2), WebP, ≤ 180 KB each. Map cards, the atlas covers (4:5, with `focus`) and the species sheet (16:10) fill their box (`object-fit: cover`), so a painted scene background is fine; the Today thumb shows the same file contained. Locked **map** cards keep drawing the SVG silhouette in mist even when artwork exists — the map is the reward; the **Tür Atlası** shows every species (undiscovered ones desaturated in mist, marked "Keşfedilmedi") because the atlas is reference knowledge, like the presentation Emir gave. Style: *Friendly Expedition* — expressive, polished 3D/modern-illustration, warm light, not babyish. Also export a **360 × 240** thumbnail as `<kind>@1x.webp` if card grids feel heavy on 3G.

## Region backdrops — `assets/scenes/<tone>.webp`
Tones: `warm` (Ana Kamp), `green` (Jura Vadisi), `amber` (Fosil Kanyonu), `blue` (Kretase Kıyısı), `ice` (Kuzey Zirveleri).
Spec: **1600 × 900 px** (16:9), WebP, ≤ 300 KB, *Cinematic Explorer / AI Fantasy Natural History* — waterfalls, mist, sun rays, dinosaurs at meaningful scale. Must keep the lower third calm so the zone text stays legible over the existing mist overlay (`.zone-mist`).

## Reveal / discovery hero (optional) — `assets/scenes/reveal.webp`
1200 × 1200 px, used behind `.cine-art` on the reveal sheet when registered as `SCENES.reveal`.

## Rules
* Never watermarked or copyrighted reference imagery; the supplied educational presentation and reference photos are inspiration only.
* Keep the UI primary: artwork sits inside the existing slots, no new layout.
* File names are lower-case, ASCII, and match the `kind`/`tone` keys exactly.
