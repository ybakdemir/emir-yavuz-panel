# EPDS v2 — Daily Learning & Memory Reinforcement Pass (2026-09-12)

Additive pass on `v2`. Little Explorer becomes a real daily Today habit; a **Daily Review Pool** sits on top of the existing spaced review; celebrations get three semantic levels; discoveries can open for memory / English / monthly milestones. No schema bump (`schemaVersion` 6), `ey_v6` / `/v2` unchanged as targets, `ey_v5` / `/data` untouched.

## Root cause — Little Explorer
`config.items.explorer.days === 'weekday'` (seeded from `DEFAULT_ITEMS`), so on Saturday/Sunday the card was not on Today at all; the seed lives in saved state, so changing the default alone would not have fixed live installs. Secondary: the habit line ("Bugünkü İngilizce çalışmamı yaptım") vanished after completion.

## Little Explorer
* Default rule `days: 'all'`; existing saved configs are upgraded **once** (`upgrades.explorerDaily`), **effective from the upgrade day**: `daysFrom` + `daysNow: 'all'` are added and `days` keeps the historical `'weekday'`. `schedule.daysFor(item, key)` picks `daysNow` from `daysFrom` on, so no past ratio, good day or discovery count moves — and a build that only reads `days` (the current Production sharing `/v2`) keeps the old behaviour rather than applying the new rule to the past (test + prod-shaped fixture).
* Parents can change any item's day rule in Settings → Günlük görevler (`setItemDays`, also effective-dated).
* Today: same simple card, same one-tap `done` semantics; subtitle kept after completion; completion is a MEANINGFUL celebration. Analytics unchanged (`days[k].items.explorer`, `studyDays`, `explorerStats`).

## Daily Review Pool (`src/core/dailyReview.js`)
| Concept | Where |
|---|---|
| in pool | `memorizationItems[id].dailyReviewEnabled` — **opt-out**: MASTERED + not archived + `!== false`; `markMastered` sets `true` |
| daily target | `config.review.dailyTarget` (default 3, min 1, capped by pool size at selection) |
| today's set | `memorizationDaily[YYYY-MM-DD] = { items:[ids], target, all, at }` — frozen on the first review of the day (`freezeDailySet`), live-computed before that |
| completion | derived: a `memorizationReviews` record with `date === today` for the item (`reviewsOn`) — nothing duplicated |
| "Tümünü Tekrar Et" | `expandDailySet` → `all: true`, whole pool listed, ticked items keep their place, no schedule touched |
| history | `dailyReviewHistory(from, to)` per day: planned / done / reviewed (in or outside the set) / rows with result and `by` |

### Selection (`selectDailyReviews`, deterministic per state+day)
1. due/overdue by spaced schedule (most overdue first) → 2. last result `needs_work` → 3. last result `assisted` → 4. the rest, least-recently-reviewed first, ties rotated by the day number so every healthy item appears within a pool-sized window. Capped at the target (due items are prioritised, never skipped for a healthy one). Frozen sets drop items that leave the pool and top up from the live selection when the target rises.

### Memory health (`memoryHealth`)
`today` (Bugün çalış): due/overdue or last `needs_work` · `refresh` (Tazelenmeli): last `assisted` or next review ≤ 2 days · `strong` (Sağlam): otherwise. Learning items: none. Reuses `nextReviewAt` + `lastResult`; no second algorithm.

### Spaced review
Unchanged (`recordReview`: self +1 step, assisted −1, needs_work → start + `needsWorkDays`). `recordDailyReview` = freeze + `recordReview(by:'child')`. Review outcomes (`self|assisted|needs_work`) stay a separate vocabulary from task statuses and never touch `days[]`, the independent rate or classification coverage (tests in `daily.test.js` and `learning.test.js`).

## Child UX
* Today: **Bugünkü Ezber Tekrarım** — one card in the task flow right after "3 ayet" (or before Akşam rutinim): count line (`3 tekrar bugün` → `1 / 3 tamamlandı` → `Bugünkü tekrarların tamamlandı.`), ✓/○ rows with the outcome or a health pill, **Tekrarlara Başla** opens the three outcome chips inline (survives re-render, persists on reload), **Tümünü Tekrar Et (n)** as a text link. Not rendered when the pool is empty; the old quiet link remains for due items outside the pool.
* Ezberlerim: one-line pointer to today's set, health pill + "Günlük tekrar" pill per mastered card; off-schedule reviews go through the same daily path.
* Celebrations: MEANINGFUL toast (glyph + line) for Little Explorer, Physical Five, all reviews done, reflection saved; MILESTONE cinematic sheet for "Sundum", skill graduated (auto-graduate path) and a persistent "Yeni beceri" banner on the graduation day; discovery banner and reveal now say *why* (`DISCOVERY_REASON`).

## Parent UX
* Ezber: Tekrar düzeni gains pool size + **Günlük hedef**; new **Bugün ve son günler** section — today's table (Ezber · Bugün · Sonuç · Hafıza, with `ebeveyn` marker and a frozen/live note) and a collapsed **Son 7 gün** disclosure; item table gains **Günlük havuz** (checkbox) and **Hafıza** columns; parent-recorded today reviews freeze the set; correction/deletion/archive controls unchanged.
* Dashboard "Öğrenme arşivi": `Bugünkü tekrar 1/3 · ✓ Fâtiha (kendim), ○ …` line.
* Settings: day-rule select per item (effective from today).

## Reinforcement (`src/core/celebration.js`)
`LEVEL = standard | meaningful | milestone`; `EVENTS` map event → level + copy; `levelForItem`/`eventForItem` for Today items (explorer, physical = meaningful). No numbers, nothing stored or summed. Copy checked against "puan/yıldız/+n/xp/bonus".

## Discoveries (`src/core/expedition.js`)
`earned = floor(steps / daysPerDiscovery) + milestoneCounts().total` where milestones = `floor(completeReviewDays / 7)` + `floor(explorerStudyDays / 10)` + months with Ayın Kutlaması unlocked, all counted from `expedition.milestonesSince` (set to the first boot of this build → no burst on upgrade). Each fresh item gets `expedition.reasons[id]` (`memory|english|month|steps`), milestone reasons on the newest items. Thresholds in `config.expedition.milestones`. One new card, **Mamenchisaurus** (`jv_mamen`, Jura Vadisi), slotted after Brachiosaurus in existing configs. Fixed: the Today banner no longer consumes the pending reveal before the Expedition page shows it.

## Artwork
No production assets exist → SVG silhouette added for Mamenchisaurus, `src/content/artwork.js` registry (empty) + `docs/ARTWORK.md` spec. `dino()` swaps to `<img>` per kind when registered.

## Data-model / migration (`migrate.js`)
Added, all filled by `ensureShape(state, today)`: `memorizationDaily {}`, `config.review.dailyTarget 3`, `config.expedition.milestones {memoryDays 7, englishDays 10}`, `expedition.reasons {}`, `expedition.milestoneSeen {0,0,0}`, `expedition.milestonesSince today`, `upgrades.explorerDaily today` (+ the explorer day-rule upgrade), missing default expedition items slotted at their default index. `items[i].daysFrom/daysNow` only when a rule changes (`days` stays the historical rule). Nothing existing is overwritten; a pre-pass state is not persisted until its first real write (test + Playwright). `schemaVersion` stays 6 — every field has a default and old readers ignore unknown keys.
