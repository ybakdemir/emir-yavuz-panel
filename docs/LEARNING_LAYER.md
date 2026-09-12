# EPDS v2 — Learning Memory Layer (2026-09-12)

Books · Memorization · Little Explorer · Memory Project · Weekly Reflection · Presentation Archive.
Additive to the v2 state; no existing feature, formula, migration path or record was changed.

## A. Data-model additions (`src/core/migrate.js` → `buildInitialState` / `ensureShape`)
| Collection | Shape | Notes |
|---|---|---|
| `books[id]` | `title, totalPages, startedAt, finishedAt, status READING\|COMPLETED, note, cover{tone}, createdAt` | cover tone derived from the title (no external API) |
| `reading` | `{ activeBookId }` | explicit choice; falls back to the most recently started READING book |
| `days[k].bookId` | optional | snapshot of the active book when "20 sayfa aile okuması" is completed (room for page tracking later; no daily entry) |
| `memorizationItems[id]` | `title, type SURA\|POEM\|SONG\|OTHER, status LEARNING\|MASTERED, startedAt, masteredAt, lastReviewedAt, lastResult, nextReviewAt, intervalIndex, note, archived` | title only — no religious text is embedded |
| `memorizationReviews[id]` | `itemId, date, result self\|assisted\|needs_work, by child\|parent, nextReviewAt, note, at` | retained forever; parent can correct/delete a record |
| `memoryProjects[id]` | `title, type, startedAt, targetMonth, completedAt, status ACTIVE\|COMPLETED\|REPLACED, note` | one ACTIVE at a time |
| `weeklyReflections[monday]` | `answers{own,learned,next}, skipped, savedOn, skippedOn, updatedAt` | |
| `config.review` | `{ intervals:[1,3,7,14,30], needsWorkDays:1 }` | parent-editable |

Keyed objects (not arrays) so Firebase keeps them intact; empty ones are dropped by RTDB and restored by `ensureShape`. `schemaVersion` stays 6, `LOCAL_KEY` stays `ey_v6`, `/v2` stays the only remote write target.

## B. Child UX additions
* Bottom nav gains **one** tab: **Arşivim** (`#/archive`). Existing four tabs and routes unchanged.
* **Arşivim** landing: three collection cards — Kitaplığım, Ezberlerim, Sunumlarım — with descriptive lines (counts as history, no scores), plus a quiet "Bugün tekrar zamanı" link when a review is due.
* **Kitaplığım** (`#/archive/books`): "Şu An Okuyorum" (generated cover, title, pages, start date, "Aile okuması" pill, days read together) and "Tamamladığım Kitaplar" shelf (cover, pages, start → finish dates). Completed books never disappear.
* **Ezberlerim** (`#/archive/memory`): "Tekrar zamanı" block with the three review outcomes; **Sürelerim** (mastered with dates + last review, learning with start date); "Diğer Ezberlerim" only when non-sura items exist; "Hafıza Projelerim" (active + completed). A mastered card can be tapped to record an off-schedule review.
* **Sunumlarım** (`#/archive/presentations`): date, topic, Hazırlandım/Sundum pills, note/reflection. No grading.
* **Today**: the reading card shows the active book as its subtitle (kept after completion); a single dashed "quiet link" appears only when a memorization review is due. Nothing else from the layer is on Today.
* **My Week**: "Ayın Hafıza Projesi" card (no check control) when a project is active; **"Haftamı Düşünüyorum"** card on Saturday/Sunday — three one-line prompts, Kaydet / Bu hafta geç, editable after saving, skipped weeks collapse to a one-liner with "Yine de yazayım".
* Regression fix: `openDaySheet` (tap a day on My Week) had been dropped by the visual pass; restored verbatim.

## C. Parent UX additions
* Tabs **Kitaplık**, **Ezber**, **Yansımalar** (existing seven tabs unchanged).
* Dashboard: **Little Explorer** card (this week / this month, 14-day dots, 4-week counts, last study date) and **Öğrenme arşivi** card (books · pages, active book, mastered/learning counts, due reviews, active project).
* Kitaplık: add book (title, pages, start date, note); per-book editor (title, pages, start/finish dates, note), Tamamlandı / Yeniden okunuyor, "Aile okuması kitabı yap", delete with confirmation; lifetime record card.
* Ezber: add item (title, type, start, note); review-schedule editor (interval list + needs-work days); table with status, editable next-review date, last review, last result; "Yönet" opens edit, Ezberlendi / undo, archive, parent-recorded review, full review history with correction/deletion. Memory project: active editor + Tamamlandı, create/replace form (confirm on replace), history with re-open.
* Yansımalar: this week's status, history cards per week (answers editable in place; skipped weeks shown as skipped).

## D. Book system behaviour (`src/core/library.js`)
`addBook` → READING, becomes the family-reading book unless another READING book is explicitly chosen. `completeBook(date)` clamps finish ≥ start and clears the active pointer. `reopenBook` clears the finish date. `bookStats` = completed count + sum of completed pages + reading count (history only). `readingDaysForBook` counts days whose record snapshot names the book and has reading completed.

## E. Memorization / review behaviour (`src/core/memorization.js`)
`markMastered(date)` → MASTERED, `intervalIndex 0`, `nextReviewAt = date + intervals[0]`. `recordReview(result, date)`:
* `self` → index +1 (capped at the last interval) · `assisted` → index −1 (floored at 0) · `needs_work` → index 0 and `nextReviewAt = date + needsWorkDays`.
* Mastery and `masteredAt` are never removed by a weak review; `markLearning` exists only as a parent undo and keeps the history.
* `dueItems(today)` = MASTERED, not archived, `nextReviewAt ≤ today`. Parents can override `nextReviewAt` directly.
* Review results never touch `days[]` or the independence rate (test asserts this).

## F. Little Explorer tracking (`src/core/analytics.js`)
Manual only (existing daily card, subtitle "Bugünkü İngilizce çalışmamı yaptım"). `studyDays`/`explorerStats` derive week / month / 30-day / 4-week / 14-day figures from `days[k].items.explorer`; a missing or unmarked day is not a study day. No points, streaks or claims about the English app. Item id is a parameter, so a future automatic source can feed the same day records.

## G. Memory-project behaviour (`src/core/projects.js`)
`createProject` refuses while one is ACTIVE unless `replace: true`, which marks the old one REPLACED (kept). `completeProject` sets `completedAt`. `reopenProject` only when nothing is active. Appears on My Week and Arşivim, never on Today.

## H. Reflection behaviour (`src/core/reflections.js`)
Offered on weekends (`isReflectionWindow`), keyed by Monday. `saveReflection` keeps the first `savedOn` and updates `updatedAt`; `skipReflection` records the skip (answers kept if any); `unskipReflection` re-offers the card. Nothing anywhere counts skipped or missing reflections.

## I. Migration / backward compatibility
* No change to `ey_v5`, legacy `/data`, `importLegacy`, `convertV1Day`, `readLocalV1`, `STATUS`, analytics formulas, skills, rewards, physical or expedition logic (`git diff` touches `migrate.js` only inside `buildInitialState`/`ensureShape`).
* Old-v2 → new-v2: a pre-layer `ey_v6` loads, renders every route, and is **not rewritten** until the first real write; that write persists the upgraded shape with `days`, `weeks`, `legacy`, `config.items` byte-identical to before. Verified by unit test and by Playwright on both viewports. A remote `/v2` document without the layer is adopted safely (`store.replace` → `ensureShape`).

## J. Tests
* `npm test`: **44/44** (31 existing unchanged + 13 new in `tests/learning.test.js` — books add/edit/complete/dates/totals/old-state, memorization add/mastered/review advance/assisted/needs-work/config/history/independence isolation, Little Explorer derivation + missing day, memory project single-active + history, reflection save/edit/skip/history, old-v2 compatibility, JSON round trip).
* Playwright (Chromium, Firebase requests aborted at network level, 3 aborted per context): **44/44** checks — 19 routes × mobile 390×844 + desktop 1280×900 with 0 page errors and 0 horizontal overflow; old-state byte-identity then upgrade-on-first-write; full flows for books, review, project, reflection (save/edit/skip), presentation archive, restored day sheet, dashboard cards; fresh-install empty states.

## K / L / M
See the delivery message (commit SHA, Preview status, production untouched).
