# Reward semantics audit — `floor(steps/2)` (2026-09-12)

Principle: **rewards celebrate development; rewards do not buy responsibility.**

## A. What `steps` was
`expeditionSteps(state, today).total = goodDays + mastered + presentations`

* `goodDays` = days with `dayCompletion.ratio ≥ rewards.goodDayRatio` (default 0.6) over `coreItemsForDay` — i.e. the share of ordinary Today checkboxes ticked (morning/evening routine, reading, Qur'an, prayer, homework, physical, explorer, skill). Any completed status counted, including `completed_unspecified`.
* `mastered` = skills graduated (all-time). `presentations` = weekly presentations given (all-time).
* `earned = floor(steps / daysPerDiscovery=2) + milestones` → **every 2 good days = one Dinosaur Discovery**.

Trace: checkbox tap → `setStatus` → `days[k].items[id].status` → `isItemDone` → `dayCompletion` → `isGoodDay` → `expeditionSteps.goodDays` → `syncDiscoveries` (runs after every `ctx.update`) → `expedition.discovered[itemId] = today` → reveal sheet.

Origin: inherited unchanged from the first v2 Expedition (`3bf4ed6` / `0653e56`). The 2026-09-12 memory pass (`ac583fe`) only added `+ milestones` and the reason attribution on top.

## B. Verdict
Violated the principle. Per day the signal was binary (a day capped at one step), but across days ordinary routine completion alone opened finds — 30 perfect days = 15 dinosaurs with no presentation, graduation or memory work. That is a task-volume economy with a 2-day denominator.

## C. Change
* `syncDiscoveries` no longer reads good days. Credits (`discoveryCredits`) are one whole discovery each for: skill graduation, weekly presentation, 7 complete Daily Review days, 10 Little Explorer study days, a month with Ayın Kutlaması met. Graduation and presentation moved from ½ (a step) to 1 find each.
* Ledger: `expedition.milestoneSeen[kind]` (now also `mastered`, `presentations`) records credits already turned into finds. On upgrade `ensureShape` absorbs the all-time graduation/presentation counts, so a state that already holds N good-day finds gets **no burst and no deficit** — the very next development event opens find N+1. Nothing discovered is ever taken back; legacy finds keep `reasons[id] = 'steps'`.
* Map: "iyi gün" stays as a consistency stat; the next-find line names the real triggers and shows the memory / English milestone progress; footer + `bc_map` fact no longer promise "each day = a step" (stored fact replaced only if it equals the old default verbatim).
* `config.expedition.daysPerDiscovery` is kept in data but unread by this build: Production ≤ `480750e` shares `/v2` and still reads it (`|| 1`). Until `main` is advanced, Production keeps opening finds from good days; this build then absorbs whatever it opened.

## D. Daily Review Pool — type-aware default (owner decision)
* `dailyReviewOn(it)` = parent's explicit `dailyReviewEnabled` if boolean, else `dailyReviewDefault(it)` = `type === SURA`.
* `markMastered` writes nothing; the parent toggle (`setDailyReview`) is the only writer. Storage differs from the brief's literal `dailyReviewEnabled = true/false` on purpose: an explicit system value is indistinguishable from a parent's choice, which is exactly the ambiguity the ac583fe data left behind.
* One-time `upgrades.typedReviewPool`: `dailyReviewEnabled === true` (written by ac583fe's `markMastered` on every mastered item) is dropped → type default; every `false` (only a parent could set it) survives. Known edge: a parent who turned a POEM/SONG/OTHER *off and back on* in the ac583fe Preview between 2026-09-12 and this deploy would need to re-enable it once.
* Review history, mastery state, intervals, `memorizationDaily` records: untouched. Items that leave the pool drop out of today's frozen set as before.

## Milestone thresholds
Pilot defaults kept: 7 complete Daily Review days, 10 Little Explorer study days (`config.expedition.milestones`). Data/code-configurable, no UI — to be evaluated in the real-usage pilot.
