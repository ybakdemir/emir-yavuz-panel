import { buildInitialState, ensureShape, importLegacy, readLocalV1 } from './migrate.js';
import { todayKey } from './dates.js';

export const LOCAL_KEY = 'ey_v6';       // v2 state (ey_v5 is left untouched)
export const REMOTE_NODE = 'v2';         // Firebase node (/data is v1, read-only for v2)

/**
 * Offline-first store: localStorage is the primary copy, Firebase mirrors it
 * (whole-document, last-writer-wins, debounced) and pushes remote changes
 * back in through a realtime listener.
 */
export function createStore({ storage, now = () => new Date() } = {}) {
  const writer = 'w_' + Math.random().toString(36).slice(2, 8);
  const listeners = new Set();
  let remote = null;
  let remoteTimer = null;
  let state = null;

  function loadLocal() {
    try {
      const raw = storage?.getItem(LOCAL_KEY);
      if (raw) return ensureShape(JSON.parse(raw), todayKey(now()));
    } catch { /* corrupt local copy — fall through */ }
    return null;
  }

  function persistLocal() {
    try { storage?.setItem(LOCAL_KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
  }

  function notify() { listeners.forEach((fn) => fn(state)); }

  function scheduleRemote() {
    if (!remote) return;
    clearTimeout(remoteTimer);
    remoteTimer = setTimeout(() => remote.write(state).catch(() => {}), 600);
  }

  const store = {
    get state() { return state; },
    writer,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** Boot from localStorage; migrate local v1 if this is the first v2 run. */
    init() {
      state = loadLocal();
      if (!state) {
        state = buildInitialState(todayKey(now()), writer);
        const v1 = storage ? readLocalV1(storage) : null;
        if (v1) importLegacy(state, v1, 'localStorage', todayKey(now()));
        state.meta.updatedAt = Date.now();
        persistLocal();
      }
      return state;
    },

    update(mutator) {
      mutator(state);
      state.meta = { updatedAt: Date.now(), writer };
      persistLocal();
      scheduleRemote();
      notify();
    },

    /** Replace state wholesale (remote adoption). */
    replace(next) {
      state = ensureShape(next, todayKey(now()));
      persistLocal();
      notify();
    },

    /**
     * Attach a remote adapter: { readV2(), readV1(), write(state), onChange(cb) }.
     * Resolution order: remote v2 newer → adopt; else local newer → push;
     * remote v2 missing → import remote v1 (idempotent) and push.
     */
    async attachRemote(adapter, onStatus = () => {}) {
      remote = adapter;
      try {
        const rv2 = await adapter.readV2();
        if (rv2 && rv2.meta) {
          if (!state || (rv2.meta.updatedAt || 0) > (state.meta.updatedAt || 0)) {
            store.replace(rv2);
          } else if ((rv2.meta.updatedAt || 0) < (state.meta.updatedAt || 0)) {
            scheduleRemote();
          }
        }
        // Legacy import from Firebase runs until it has been recorded once.
        // A denied/failed `/data` read must not take v2 sync down with it:
        // the import is simply retried on a later boot.
        if (!state.legacy?.sources?.firebase) {
          let v1 = null;
          try { v1 = await adapter.readV1(); } catch { /* /data unreadable — keep going */ }
          if (v1) {
            store.update((s) => importLegacy(s, v1, 'firebase', todayKey(now())));
          } else if (!rv2) {
            scheduleRemote();
          }
        } else if (!rv2) {
          scheduleRemote();
        }
        adapter.onChange((incoming) => {
          if (!incoming?.meta || incoming.meta.writer === writer) return;
          if ((incoming.meta.updatedAt || 0) > (state.meta.updatedAt || 0)) store.replace(incoming);
        });
        onStatus('ok');
      } catch (e) {
        onStatus('err', e);
      }
    },
  };
  return store;
}
