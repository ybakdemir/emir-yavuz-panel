// Synthetic v1 blob with the exact production shape (ids, modes, keys).
export const V1_BLOB = {
  days: [
    { date: '2026-04-13', mode: 'haftaici', stars: 12, tikler: { a1: true, a2: true, a3: true, a4: true, c1: true, c2: true, e2: true, e3: true, f1: true, f2: true, f3: true, f4: true } },
    { date: '2026-04-14', mode: 'haftaici', stars: 25, tikler: { a1: true, a2: true, a3: true, a4: true, b1: true, b2: true, b3: true, c1: true, c2: true, c3: true, c4: true, d1: true, d2: true, d3: true, d4: true, e1: false, e3: true, f1: true, f2: true, f3: true, f4: true } },
    { date: '2026-04-18', mode: 'haftasonu', stars: 9, tikler: { s1: true, s2: true, s3: true, s4: true, s6: true, s7: true, s18: true, s19: true, s20: true } },
    { date: '2026-04-19', mode: 'haftasonu', stars: 3, tikler: { s1: true, s2: true, s14: true } },
  ],
  stats: { _lastLevel: 3, book: 19, dino: 4, namaz: 19, pres: 0 },
  wExtra: { '2026-04-13': { we2: true, we4: true } },
  mExtra: { '2026-4': { me1: 0 } },
  today_date: '2026-05-02', today_mode: 'haftasonu',
  today_done: { a1: true, a2: true, a3: true, a4: true, s1: true, s2: true, s3: true, s7k: true },
};

export class MemoryStorage {
  constructor(init = {}) { this.map = new Map(Object.entries(init)); }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}
