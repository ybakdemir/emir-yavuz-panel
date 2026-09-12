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

## AI Dinosaur Visual Integration Preview (2026-09-12, v2)
Prototype of the *Premium Friendly Expedition* direction inside the real app. Scope: `src/ui/child/expedition.js`,
`src/ui/child/today.js` (discovery banner only), `src/ui/art.js` (+`worldScene`, `companionArt`), `src/ui/dinos.js`,
`src/content/artwork.js` (registry: `worldHero / dinos / scenes / companion`), `styles/child.css`. No change to
`src/core`, `src/content/defaults.js`, migration, Firebase or tests of behaviour.
* **Hero** — full-bleed cinematic scene (built-in SVG until the AI concept is registered) → green shade → kicker,
  "Emir'in Dinozor Keşifleri", sub-line, `n / 28 keşif`, current zone chip, gold progress. 332 px on 390 (39 % of the
  viewport), 360 px ≥ 700, 400 px ≥ 960. Milestone hints (Hafıza x/7 · İngilizce x/10) sit below the hero as chips.
* **Cards** — 3:2 artwork on a zone-tinted scene, expedition-paper body: semantic line (type · reason), name,
  fact (≥ 700 px), "Keşfi Aç". 2 columns on phones, 3 ≥ 700, 4 ≥ 960 (Expedition column widens to 940 px).
* **Locked** — same silhouette (solid, no eyes) in mist under a dark overlay, "?" badge, "Henüz keşfedilmedi";
  the next find gets a gold frame, footprint badge and "Yeni bir gelişim anı bekliyor". No counts, no instructions.
* **Reveal** — "YENİ KEŞİF" → artwork fades/scales in under soft light rays → name → reason → "Merak etmeye ve
  öğrenmeye devam et." → "Keşfi İncele" (opens the detail). No confetti, no numbers.
* **Detail** — artwork hero, type kicker, name, chips (zone, discovery date), gold "Biliyor muydun?" card (the
  item's one fact), reason card. Only fields that exist in `defaults.js` are shown.
* **Companion** — `companionArt()` in the hero (bottom-right, slow bob) and the map footer. Visual only.
* **Today** — banner is now thumb + "Yeni keşif: <name>" + reason + "Keşfe git". Nothing else on Today changed.
* Assets: everything is original inline SVG. No AI raster was available in the environment; registry slots are ready.
* QA: `node --test` 76/76 · Playwright 390×844 + 1280×900, 6 routes, 0 page/console errors, 0 overflow, reveal and
  detail sheets fit with CTA visible, reduced-motion pass · Firebase SDK stubbed at the network layer (0 requests
  reached Firebase hosts).
