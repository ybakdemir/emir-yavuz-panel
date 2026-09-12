# EPDS v2 — Visual / UX upgrade pass (2026-09-12)

Approved direction: **Dinosaur Adventure + Cinematic Premium Depth + Clean Weekly Hierarchy.**
Scope: visual/UX only. No change to `src/core`, `src/content`, migration, Firebase paths,
analytics formulas, graduation rules, exercise pattern, reward logic or routing (verified:
`git diff -- src/core src/content tests` is empty).

## Design system (`styles/tokens.css`)
Palette: Deep Forest `#173F35`, Explorer Green `#2F7659`, Warm Expedition Cream `#F6F0E4`,
Jurassic Gold `#D9A64A`, Discovery Blue `#3D7EA6` (supporting only), Night Navy `#0E1B2B`
(scoped to `.cinematic` and `.sheet.cine` — no global dark mode). Larger radii (22/28px),
layered shadows, `--ease-pop` micro-motion curve, `:focus-visible` gold ring, global
`prefers-reduced-motion` guard.

## Assets (`src/ui/art.js`, all original inline SVG, no image payloads)
* `glyph()` — duotone category glyphs (sun, pencil, compass, book, quran, prayer, bolt, seed,
  mic, moon, map, gift, flag, fossil, hand, footprint). Tinted per task category.
* `exerciseGlyph()` — pictograms for Şınav, Plank, Jumping Jack, Squat, Bara Asılma.
* `heroScene()` — dawn-lit layered ridges + ferns behind the Today hero.
* `zoneScene(tone)` — five map scenes: camp (warm), Jurassic valley (green), fossil canyon
  (amber), Cretaceous coast (blue), northern peaks (ice).
* `masteryBadge()` — gold medal + footprint for mastered skills.
* `worldDecor()` — soft ridges/ferns fixed behind the child column on ≥960px.

## Screens
* **Today** — hero card (date, "Merhaba Emir", contextual headline, gold ring, footprint
  trail, golden dino that changes with progress, scenic backdrop). Task cards carry a category
  accent bar + duotone tile; completed state is calm green with solid check.
* **Daily Physical Five** — "Bugünün hedefi" challenge board: pictogram, name, big target
  number. Same toggles, no timers/scoring.
* **My Week** — Mon–Sun strip (today = forest), "Kaşif notu" message card with dino,
  three accent-bordered cards (skill / presentation / weekly choice) with faint motifs.
* **Expedition** — night-navy cinematic panel, stats row, gold progress, dashed trail with
  numbered zone nodes, illustrated zone scenes, locked zones desaturated but visible
  (silhouettes, "Keşfedilecek"), next find pulses softly; detail sheet with gold halo.
* **My Skills** — three-step path (Öğreniyorum → Çalışıyorum → Artık Yapabiliyorum) with
  counts; mastered cards get badge, glow and "Öğrendim: date".
* **Parent** — brand header, forest tab pill, section h2, uppercase card headers,
  3-column dashboard/settings grid ≥1140px. No illustration density.

## Responsive
Child stays mobile-first (390 source of truth). ≥700px: 4-column finds, larger hero.
≥960px: column 680px, fixed scenic backdrop, cinematic panel becomes a framed card.

## QA
`node --test` 31/31 · Playwright 390×844 (touch) + 1280×900, all 11 routes, 0 overflow,
0 page errors · reduced-motion pass on all routes · interaction: tap → `done`, 3 optional chips.
