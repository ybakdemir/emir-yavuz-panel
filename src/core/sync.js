import { REMOTE_NODE } from './store.js';

// Same Firebase project/app as v1; anonymous auth unchanged.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAcp9l9iAADeWxhCVwFEyMvYuAt0_-kN50',
  authDomain: 'ey-daily-monitor.firebaseapp.com',
  databaseURL: 'https://ey-daily-monitor-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'ey-daily-monitor',
  appId: '1:339579721070:web:11afb5741b08718dac1d7f',
};

/** Firebase RTDB adapter for the store. Requires the compat SDK on window. */
export async function createFirebaseAdapter() {
  const fb = globalThis.firebase;
  if (!fb) throw new Error('firebase sdk missing');
  if (!fb.apps.length) fb.initializeApp(FIREBASE_CONFIG);
  const db = fb.database();
  await fb.auth().signInAnonymously();
  const v2 = db.ref(REMOTE_NODE);
  return {
    readV2: async () => (await v2.once('value')).val(),
    readV1: async () => (await db.ref('data').once('value')).val(), // never written by v2
    write: (state) => v2.set(JSON.parse(JSON.stringify(state))),
    onChange: (cb) => v2.on('value', (snap) => cb(snap.val())),
  };
}
