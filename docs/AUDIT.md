# PHASE 0 — Repository & Data Audit (v1 → v2)

Audit date: 2026-09-12. Source: `github.com/ybakdemir/emir-yavuz-panel` @ `a9224e8` (main).

## 1. Starting repository state

| Item | Finding |
|---|---|
| Files | `index.html` (1 229 lines, 79 KB, everything inline), `README.md` (one line) |
| Build tooling | none — static HTML, no package.json, no bundler |
| Git | 24 commits, all `Update index.html` via GitHub web UI; single `main` branch |
| Deployment | Vercel static deploy, homepage `https://emir-yavuz-panel.vercel.app` (HTTP 200). No `vercel.json`; Vercel Git integration deploys `main` automatically ⇒ **pushing to `main` = production deploy** |
| GitHub Pages | not enabled |
| Firebase | project `ey-daily-monitor`, RTDB `europe-west1`, compat SDK 9.23.0 via CDN, **anonymous auth** (`signInAnonymously`) |
| Language | Turkish UI, `lang="tr"` |

## 2. Current architecture (v1)

Single-file, global-state, imperative DOM app:

- **Content** is hard-coded in JS: `TASKS.haftaici` / `TASKS.haftasonu` (6 sections each, 24 / 25 tasks, each with star value `y`), `WE` (weekly extras), `ME` (monthly extras), `LEVELS` (8 dinosaur levels by total stars), `BADGES` (12), `HAFTALIK_ODULLER` / `AYLIK_ODULLER` (medal tiers with **money prizes**: 200/400/750 TL).
- **State** is one global `ST = {mode, done, days, stats, wExtra, mExtra}`.
- **Pages**: Bugün, Hafta, Ay, Rozetler, Ödüller (bottom nav). Manual "💾 Kaydet" button commits the day into `days[]`; "Sıfırla" deletes today's record.
- **Star economy everywhere**: header star count, daily/weekly/monthly max (27 / 173 / 693), progress bars, streak banner (🔥 "gün üst üste"), level banner, confetti on every full day, money tiers.

## 3. Current data model

### localStorage
| Key | Content |
|---|---|
| `ey_v5` | `{days:[{date,stars,mode,tikler:{taskId:bool}}], stats:{book,dino,namaz,pres,_lastLevel}, wExtra:{weekKey:{weId:bool}}, mExtra:{"YYYY-M":{...}}}` |
| `ey_today_YYYY-MM-DD` | `{done:{taskId:bool}, mode}` — one key **per day**, never cleaned up |

### Firebase RTDB — node `/data`
`{days, stats, wExtra, mExtra, today_done, today_mode, today_date}` — the whole blob is `set()` on every change (last-writer-wins, no merge). Read once at startup (`once('value')`), no realtime listener.

### Production snapshot (read-only, 2026-09-12)
- `days`: **17 records**, 2026-04-13 → 2026-04-29 (13 weekday, 4 weekend), 355 stars total, every record has `tikler`.
- `stats`: `{book:19, dino:4, namaz:19, pres:0, _lastLevel:3}`
- `wExtra`: one week (`2026-04-13`), `mExtra`: `2026-4` only.
- `today_date: 2026-05-02` — last use of the app. Nothing since (Emir tracked on paper for a period — expected, not failure).

## 4. Defects / risks found in v1

1. **UTC date bug** — every date key uses `new Date().toISOString().slice(0,10)` (UTC). In Turkey (UTC+3) anything done 00:00–03:00 local is filed under the *previous* day. Week/month math (`getWK`, `renderWeek`) has the same bug. Legacy dates cannot be corrected retroactively.
2. **RTDB is world-readable** (`GET /data.json` works with no auth). Rules are not in the repo; fixing needs the Firebase console — out of scope, flagged.
3. **Firebase config/API key inline** — normal for web Firebase, but with open rules it means anyone with the URL can read/write.
4. **Whole-blob `set()`** with no listener: two devices overwrite each other silently.
5. `ey_today_*` keys accumulate forever in localStorage.
6. Day records only persist when the user presses "Kaydet" — un-saved days are lost.
7. Money-for-stars, streak reset, confetti, "hedef: 27" etc. — the exact anti-patterns v2 retires.

## 5. Reusable vs obsolete

**Reusable (keep / carry forward)**
- Firebase project, anonymous auth flow, database URL and app config.
- Deployment mechanics (Vercel static; keep zero-build).
- Historical `days[]` records (17) + `stats`, `wExtra`, `mExtra` → archived and partially mapped to v2 items.
- Task *vocabulary* (Turkish labels for morning/evening routine steps, Kuran, namaz, kitap, şınav/squat).
- Week-picker / day-modal *concept* (parent day editor in v2).

**Obsolete (retired, kept only in `legacy/` archive)**
- Star values, daily/weekly/monthly max, star detail overlay, medal money tiers, level system, badges, streak banner, confetti, "Kaydet" button model, weekly/monthly extras (İstiklal Marşı kıta, çarpım tablosu), MentalUp tasks.

## 6. Migration risks

| Risk | Mitigation in v2 |
|---|---|
| Losing 17 legacy day records | v1 blob archived verbatim under `legacy.v1`; also mapped into v2 day records flagged `legacy:true`. Nothing deleted. |
| Silent localStorage key change | new key `ey_v6` written **alongside** `ey_v5` (never removed); migration is idempotent and versioned (`schemaVersion`). |
| Firebase `/data` overwritten by v2 | v2 uses a **separate node `/v2`**; `/data` is read-only for v2. Legacy page still works against `/data`. |
| Two sources of legacy truth (localStorage vs Firebase) | merged by date; Firebase wins on conflict (it was the sync source), local-only dates are added. |
| Star UI leaking into v2 | no star field in the v2 schema; `stars` survive only inside the archive. |
| Production deploy by accident | all work on branch `v2`; nothing pushed to `main`. |

## 7. Proposed v2 architecture

- Still **zero-build static site** (Vercel unchanged): `index.html` + native ES modules under `src/`, CSS under `styles/`. Firebase compat SDK via CDN (unchanged auth).
- Layers: `src/content/` (defaults: routines, items, physical pattern, skill pool, rewards, expedition) → `src/core/` (pure logic: dates, schedule, completion, skills, physical, rewards, expedition, analytics, migrate, store) → `src/ui/child/*`, `src/ui/parent/*`.
- All parent-configurable content lives in `state.config` (data, not code); defaults are only seeds.
- Pure `core/` modules are unit-tested with `node --test` (no dependencies).
- `legacy/index.html` — untouched v1 for reference.

## 8. Implementation sequence

1 audit ✔ → 2 schema + migration + store → 3 design tokens/components → 4 child shell → 5 Today → 6 Physical Five → 7 My Week → 8 Skill engine → 9 Presentation → 10 Expedition → 11 Parent mode → 12 Rewards → 13 Analytics → 14 Print → 15 legacy compat check → 16 responsive QA → 17 data-integrity QA.
