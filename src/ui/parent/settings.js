import { h, add, confirmSheet } from '../dom.js';
import { icon } from '../icons.js';
import { LOCAL_KEY } from '../../core/store.js';
import { ensureShape } from '../../core/migrate.js';
import { pcard, field, textInput, checkbox, selectInput } from './common.js';
import { daysFor, setItemDays } from '../../core/schedule.js';
import { APP_ICONS, appIcon } from '../../content/appIcons.js';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function renderSettings(body, ctx) {
  const { state } = ctx;
  const st = state.config.settings;
  const set = (fn) => ctx.update((s) => fn(s.config));
  const grid = h('div', { class: 'grid grid-2 grid-wide' });

  add(grid, pcard('Genel', 'user',
    field('Çocuğun adı', textInput(st.childName, (v) => set((c) => { c.settings.childName = v; }))),
    h('div', { style: { height: '10px' } }),
    field('Ebeveyn PIN (boş = kapalı)', textInput(st.parentPin, (v) => set((c) => { c.settings.parentPin = v.replace(/\D/g, '').slice(0, 6); }), { inputmode: 'numeric', placeholder: '4–6 rakam' })),
    h('div', { style: { height: '10px' } }),
    field('Haftam ekranı mesajı (boş = otomatik)', textInput(st.weeklyMessage, (v) => set((c) => { c.settings.weeklyMessage = v; })))));

  // ── App icon: the choice is a synced setting; the favicon follows it at once,
  // an installed app's launcher icon is set by the OS at install time (calendar).
  const current = appIcon(st.appIcon).id;
  add(grid, pcard('İkonu Değiştir', 'home',
    h('div', { class: 'icon-pick', role: 'radiogroup', 'aria-label': 'Uygulama ikonu' },
      APP_ICONS.map((ic) => h('button', { type: 'button', class: `icon-opt ${ic.id === current ? 'on' : ''}`, role: 'radio', 'aria-checked': ic.id === current ? 'true' : 'false',
        onclick: () => { if (ic.id !== current) set((c) => { c.settings.appIcon = ic.id; }); } },
        h('img', { src: ic.src, alt: '', width: 72, height: 72, decoding: 'async' }),
        h('span', { class: 'icon-l' }, ic.label),
        ic.hint ? h('span', { class: 'icon-h' }, ic.hint) : null))),
    h('div', { class: 'small muted', style: { marginTop: '10px' } }, 'Seçim tüm cihazlarda saklanır. Ana ekrana eklenmiş uygulamanın ikonu sistem tarafından belirlenir ve varsayılan (Calendar) kalır.')));

  // ── Daily Physical Five pattern
  const ph = state.config.physical;
  const pattern = pcard('Daily Physical Five — haftalık düzen', 'bolt',
    h('div', { class: 'small muted', style: { marginBottom: '10px' } }, 'Her hareket için gün gün hedef. Düşük / yüksek örüntü: 5-6-5-6-5-6-5.'),
    h('div', { class: 'table-wrap' }, h('div', { class: 'pattern-grid' },
      h('div', {}), DAYS.map((d) => h('div', { class: 'h' }, d)),
      ph.exercises.map((e, i) => [
        h('div', { style: { fontWeight: 800, fontSize: '14px' } }, e.name, h('div', { class: 'small muted' }, e.unit)),
        e.pattern.map((v, d) => h('input', { type: 'number', inputmode: 'numeric', value: v, min: 0, onchange: (ev) => set((c) => { c.physical.exercises[i].pattern[d] = Number(ev.target.value) || 0; }) })),
      ]))));
  add(grid, pattern);

  // ── Daily items on/off + which days. A day-rule change applies from today;
  // earlier days keep their old rule, so past ratios never move.
  const DAY_OPTS = [['all', 'her gün'], ['weekday', 'hafta içi'], ['weekend', 'hafta sonu']];
  add(grid, pcard('Günlük görevler', 'list',
    h('div', { class: 'small muted', style: { marginBottom: '6px' } }, 'Bir görevi geçici olarak kapatabilirsiniz; geçmiş kayıtlar korunur. Gün kuralı bugünden itibaren geçerli olur.'),
    state.config.items.map((it, i) => h('div', { class: 'list-row task-row' },
      h('div', { class: 'grow', style: { fontWeight: 800 } }, it.title),
      ['skill', 'presentation'].includes(it.kind)
        ? h('span', { class: 'small muted' }, it.kind === 'skill' ? 'aktif beceri varken' : 'hafta sonu')
        : selectInput(DAY_OPTS, daysFor(it, ctx.today), (v) => set((c) => setItemDays(c.items[i], v, ctx.today)), { class: 'input input-sm', 'aria-label': `${it.title} günleri` }),
      checkbox('', it.enabled !== false, (on) => set((c) => { c.items[i].enabled = on; }))))));

  // ── Data
  const legacy = state.legacy;
  add(grid, pcard('Veri', 'download',
    h('div', { class: 'kv' }, h('span', {}, 'Şema sürümü'), h('span', {}, String(state.schemaVersion))),
    h('div', { class: 'kv' }, h('span', {}, 'Kayıtlı gün'), h('span', {}, String(Object.keys(state.days).length))),
    h('div', { class: 'kv' }, h('span', {}, 'Senkron'), h('span', {}, ctx.syncStatus === 'ok' ? 'Firebase bağlı' : ctx.syncStatus === 'err' ? 'Çevrimdışı (yerel kayıt)' : 'Yerel')),
    h('div', { class: 'kv' }, h('span', {}, 'v1 arşivi'), h('span', {}, legacy ? Object.entries(legacy.sources || {}).map(([k, v]) => `${k} (${v})`).join(', ') : 'yok')),
    h('div', { class: 'row wrap', style: { marginTop: '12px' } },
      h('button', { class: 'btn btn-soft btn-sm', onclick: () => exportJson(state) }, icon('download', 16), 'Yedek indir (JSON)'),
      h('label', { class: 'btn btn-ghost btn-sm' }, icon('upload', 16), 'Yedekten geri yükle', h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onchange: (e) => importJson(ctx, e.target.files[0]) })))));

  add(body, grid);
}

function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `emir-v2-${new Date().toISOString().slice(0, 10)}.json` });
  add(document.body, a); a.click(); a.remove();
}

async function importJson(ctx, file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== 'object' || !parsed.days) throw new Error('shape');
    const ok = await confirmSheet({ title: 'Yedekten geri yükle', body: `${Object.keys(parsed.days).length} günlük kayıt içeren yedek mevcut veriyle değiştirilecek. Mevcut veri önce indirilsin mi?`, ok: 'Geri yükle', danger: true });
    if (!ok) return;
    exportJson(ctx.state);
    ctx.store.replace(ensureShape(parsed));
    ctx.store.update(() => {});
    ctx.toast('Yedek geri yüklendi.');
  } catch { ctx.toast('Bu dosya geçerli bir yedek değil.'); }
}

export { LOCAL_KEY };
