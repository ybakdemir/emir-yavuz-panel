# Emir Personal Development System v2

Child-first personal development app for Emir (7.5, 2nd grade).
**Discipline → Skill → Independence → Autonomy.** The app is designed to make
itself unnecessary: the north-star metric is the *independent completion rate*.

Zero-build static site: `index.html` + native ES modules + CSS. Deployed on
Vercel (production = `main`). Data lives in `localStorage` (`ey_v6`) and is
mirrored to Firebase Realtime Database (node `/v2`, anonymous auth — the
database rules must be `auth != null`, see `docs/FIREBASE_RULES.md`).

## Run locally

```sh
npm run serve      # http://localhost:8080  (any static server works)
npm test           # pure-logic unit tests (node --test, no dependencies)
```

## Layout

```
index.html              shell
src/app.js              boot, hash router, side effects (discoveries, skill auto-advance)
src/content/defaults.js seed content: routines, daily items, physical pattern, skill pool,
                        graduation thresholds, rewards, presentation topics, expedition map
src/core/               pure logic (tested)
  dates.js              local-time date keys (v1's UTC bug is gone)
  schedule.js           which items apply to a day (weekday/weekend/homework)
  completion.js         independent / reminder / assisted / not_done semantics
  routines.js           LEARN → PRACTICE → MASTERED step visibility
  physical.js           Daily Physical Five 7-day pattern
  skills.js             skill lifecycle + configurable graduation evaluation
  rewards.js            good days, Weekly Choice, monthly celebration
  expedition.js         write-once discoveries (never taken away)
  analytics.js          independence stats, trends, comeback
  migrate.js            v1 → v2 import (idempotent, archive-preserving), ensureShape
  store.js / sync.js    offline-first store + Firebase adapter
src/ui/child/           Today · My Week · Expedition · My Skills
src/ui/parent/          Dashboard · Routines · Skills · Presentations · Rewards · Progress · Settings
src/ui/print.js         "Haftamı yazdır" paper mode
src/ui/art.js           original SVG art: duotone task glyphs, exercise pictograms, hero
                        landscape, expedition zone scenes, mastery badge, desktop backdrop
styles/                 tokens, base components, child, parent, print
legacy/index.html       v1 (star economy) kept verbatim as an archive
docs/                   AUDIT.md (phase 0), V2_REPORT.md (delivery report),
                        FIREBASE_RULES.md (required RTDB rules), PREVIEW_READINESS.md
```

## Data model (v2, `schemaVersion: 6`)

```
state
├─ config        routines, items, physical, presentation, rewards, expedition, settings  (parent-editable)
├─ skills        pool[{id,title,hint,status,activatedAt,masteredAt,…}], activeId, graduation
├─ days[YYYY-MM-DD]
│    dayType?, homework: unknown|none|exists, items{ id → {status, at} },
│    steps{ routineId → {stepId: bool} }, physical{ exerciseId: bool }, skillId, legacy?
├─ weeks[monday]  { skillId?, presentation{topic,prepared,presented,presentedOn,note,reflection,indicators}, weeklyChoice{chosen,chosenAt} }
├─ months[YYYY-MM] { celebration{chosen,chosenAt} }
├─ expedition    { discovered{ itemId → date } }
├─ achievements  [{type,date,…}]
├─ legacy        { importedAt, sources{firebase|localStorage → date}, v1{ raw v1 blobs } }
└─ meta          { updatedAt, writer }
```

Completion status values: `done` = **COMPLETED_UNSPECIFIED** ("Yaptım" — what a
plain tap records, and what imported v1 ticks carry), `independent` ("Kendim
yaptım"), `reminder` ("Hatırlatılınca yaptım"), `assisted` ("Birlikte yaptık"),
`not_done`. A completion is never independent unless Emir or a parent explicitly
picks it. Three rates, three denominators (`src/core/analytics.js`):

* **Completion rate** = completed / applicable — completed includes
  `done`, `independent`, `reminder`, `assisted`.
* **Independent Completion Rate** (north star) = `independent` / classified,
  where classified = `independent` + `reminder` + `assisted`. Unspecified
  completions are outside both numerator and denominator: a tap can neither
  inflate nor penalise the rate. Undefined (shown as "–") until something is
  classified.
* **Classification coverage** = classified / completed — how much of the
  completed work has been classified at all.

Unspecified completions still count as done for good days, the expedition and
the child's progress ring.

## Storage & migration

* `ey_v5` and `ey_today_*` (v1) are **read, never modified or removed**.
* First v2 run imports v1 from localStorage and, once Firebase connects, from
  `/data` — each source exactly once (`legacy.sources`). Legacy days become v2
  day records flagged `legacy`, raw blobs are archived under `legacy.v1`.
* Firebase `/data` is never written by v2. v2 writes only `/v2`.
* Sync: whole-document, debounced, last-writer-wins by `meta.updatedAt`,
  realtime listener adopts newer remote versions; own echoes are ignored.

## Parent mode

Gear icon on Today → `#/parent`. Optional PIN in Settings (session-scoped).
