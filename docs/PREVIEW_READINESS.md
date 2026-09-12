# EPDS v2 — Preview Readiness Report (2026-09-12)

Gate for pushing branch `v2` to GitHub so Vercel builds a **Preview** (not production).

## 1. Independence semantics — corrected
| Requirement | Status |
|---|---|
| One-tap completion stays one tap | ✅ tap / check-circle / all-steps / all-exercises → `done` (COMPLETED_UNSPECIFIED) |
| Completed ≠ independent | ✅ `STATUS.COMPLETED_UNSPECIFIED = 'done'`; `DEFAULT_COMPLETION` is that, never `independent` |
| Explicit later classification (Emir or parent) | ✅ child chips "Nasıl yaptın?" (optional, none preselected); parent Progress 5-state incl. "Yaptı (?)" |
| NOT_DONE available | ✅ unchanged |
| Rate not inflated or penalised | ✅ `rate = independent / classified` (classified = independent + reminder + assisted; unspecified in neither side, `null` when none classified); `completionRate = completed / applicable`; `classifiedRate = classified / completed` (coverage) |
| Migrated v1 not read as independent | ✅ imports carry `done`; prod snapshot dry run: 98 completions, 0 independent |
| History preserved | ✅ reclassify keeps `at`, adds `classifiedAt`; no record deleted; wire value unchanged so existing `ey_v6`/`/v2` data (none in prod yet) stays valid |
| No mandatory dialog | ✅ chips are inline and skippable; compact to "Yaptım ▾" |

## 2. Firebase rules
Required (set by hand in the console, **not** by this repo):
```json
{ "rules": { ".read": "auth != null", ".write": "auth != null" } }
```
Compatible: v2 (`src/core/sync.js`) and v1 (`legacy/index.html`) both `signInAnonymously()` before any read/write; v2 now also refuses to build the adapter without `auth.currentUser`, and a denied `/data` legacy read no longer breaks `/v2` sync (test added). Details: `docs/FIREBASE_RULES.md`.

## 3. Audit results
| Check | Result |
|---|---|
| Unit tests (`npm test`) | ✅ 25/25 |
| Playwright mobile 390×844 (touch) | ✅ tap→`done`, chips open/unselected, compact "Yaptım", classify→`reminder`/`independent` with `classifiedAt`, parent reclassify→`assisted` |
| Playwright desktop 1280×900 | ✅ all 7 parent tabs + child routes render |
| Page errors | ✅ 0 (only the 12 Firebase loads the harness aborted on purpose) |
| Horizontal overflow, 12 routes × 2 viewports | ✅ 0 |
| Migration dry run, real prod snapshot (read-only) | ✅ 18 days (17 saved + 2026-05-02 unsaved), 2nd run adds 0, archive deep-equal, 13 good days → 6 discoveries |
| localStorage compatibility | ✅ `ey_v5` byte-identical before/after flow; keys = `ey_v5`, `ey_v6` |
| Firebase mock sync | ✅ adopt-newer / import-once / push-when-newer / denied-`/data` tests |
| `ey_v5` untouched | ✅ read only (`readLocalV1`), never set/removed |
| `/data` untouched | ✅ only `readV1()` (`once('value')`); no `ref('data').set` in `src/` |
| `ey_v6` used by v2 | ✅ `LOCAL_KEY = 'ey_v6'` |
| Firebase `/v2` only | ✅ `REMOTE_NODE = 'v2'`; only write target |
| Legacy archive | ✅ `legacy/index.html` = `main:index.html` + exactly 1 inserted banner line; `legacy.v1.firebase` deep-equal to source blob |
| No production deployment | ✅ last Vercel deployment = `a9224e8` (main, 2026-04-16) |
| No push | ✅ `v2` has no upstream; `origin/main == local main == a9224e8` |

## 4. Git / Vercel
* Branch `v2` @ `HEAD` (see `git log -1`), 4 commits ahead of `origin/main`, 0 behind, no upstream.
* `origin` = `https://github.com/ybakdemir/emir-yavuz-panel.git` (public, default branch `main`, only branch `main` remotely).
* Vercel: GitHub integration (`vercel[bot]`); every existing deployment is environment **Production** on `main` commits → production branch is the repo default (`main`). Pushing any other branch yields a **Preview** deployment. (Confirm once in Vercel → Project → Settings → Git → Production Branch = `main`; no CLI/token was available locally.)
* Config: `vercel.json` (static, no framework, `outputDirectory: "."`, no-cache headers for js/css), `.vercelignore` drops `tests/`, `docs/`. No env vars needed — Firebase config is public client config in `sync.js`.
* Preview caveats: the Preview talks to the **real** Firebase project; first load creates `/v2` from `/data` (read-only on `/data`). Preview runs on a `*.vercel.app` origin, so its `localStorage` is separate from production's. If the Firebase API key has HTTP-referrer restrictions, the Preview's sync indicator will show "err" (app still works locally).

## 5. Recommended push (Preview only)
```sh
git switch v2
npm test                                      # expect 25 pass
git push -u origin v2                         # creates remote branch v2 → Vercel Preview
# do NOT: git push origin main / merge / vercel --prod
```
Then open the Preview URL from the Vercel dashboard (or the GitHub commit status "Vercel") and verify: migration banner-less load, sync indicator, `/v2` appears in RTDB.
