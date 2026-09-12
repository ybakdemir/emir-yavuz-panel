# Firebase Realtime Database — rules required for v2

Project: `ey-daily-monitor` · RTDB `https://ey-daily-monitor-default-rtdb.europe-west1.firebasedatabase.app`

## Required rules (set in Firebase Console → Realtime Database → Rules)

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

This is **not** applied by the repository; the rules are changed by hand in the
Firebase Console. As of 2026-09-12 the live rules are still the world-readable
ones inherited from v1 (see `docs/AUDIT.md`), which is why this document exists.

## Why the app is compatible

* Both v1 (`legacy/index.html`) and v2 (`src/core/sync.js`) sign in with
  **Anonymous Auth** and only touch the database *after* `signInAnonymously()`
  has resolved. v2 additionally refuses to hand out a database adapter unless
  `auth.currentUser` exists, so there is no code path that reads or writes
  before an `auth` token is present.
* The Firebase JS SDK refreshes the anonymous ID token itself; anonymous users
  persist in the browser, so each device keeps one stable `uid`.
* v2 reads `/data` exactly once per device to import v1 history. If that read
  is ever denied (rules tightened further, quota), the store treats it as
  "nothing to import yet", keeps `/v2` sync running and retries on a later
  boot — it is never fatal.
* If auth or the network fail entirely, v2 keeps working from `localStorage`
  (`ey_v6`) and shows the sync indicator as "err"; nothing is lost.

## What the rules do *not* do

`auth != null` admits *any* anonymous user of this Firebase project — it stops
unauthenticated readers (the current exposure), it does not make the data
private to one family. Tightening further would require sign-in with a
known account (e-mail/Google) and per-`uid` rules; that is a product decision
outside the v2 scope and would need a code change in `sync.js`.

## Node layout (unchanged)

| Node    | Writer | Reader              |
|---------|--------|---------------------|
| `/data` | v1 only (`legacy/index.html`) | v1, and v2 once for import |
| `/v2`   | v2 only | v2                  |
