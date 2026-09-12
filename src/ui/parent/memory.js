import { h, add, confirmSheet } from '../dom.js';
import { icon } from '../icons.js';
import { formatShort, monthName, monthKey } from '../../core/dates.js';
import { MEMO_TYPE, MEMO_TYPE_LABEL, MEMO_STATUS, MEMO_STATUS_LABEL_PARENT, REVIEW_RESULT, REVIEW_RESULT_LABEL, PROJECT_TYPE, PROJECT_TYPE_LABEL, PROJECT_STATUS, PROJECT_STATUS_LABEL } from '../../content/defaults.js';
import { addMemoItem, updateMemoItem, markMastered, markLearning, recordReview, reviewsFor, dueItems, setNextReview, archiveMemoItem, memoItems, updateReview, removeReview, reviewIntervals } from '../../core/memorization.js';
import { activeProject, createProject, completeProject, updateProject, projectHistory, reopenProject } from '../../core/projects.js';
import { pcard, field, textInput, numberInput, dateInput, monthInput, selectInput, kv } from './common.js';

// Ezber — memorization items, review history and schedule; the monthly memory project.
// Calm and data-oriented: dates, status, outcomes. Nothing is scored.

const RESULT_CLS = { self: 'ind', assisted: 'rem', needs_work: 'no' };
const openHistory = new Set();

export function renderMemory(body, ctx, parts = []) {
  const { state, today } = ctx;
  const items = memoItems(state, { includeArchived: true });
  const due = dueItems(state, today);
  const grid = h('div', { class: 'grid grid-2' });

  // ── add item
  const f = { title: '', type: MEMO_TYPE.SURA, startedAt: today, note: '' };
  const titleIn = textInput('', (v) => { f.title = v; }, { placeholder: 'Örn. Fatiha', 'aria-label': 'Ezber adı' });
  const submit = () => {
    f.title = titleIn.value;
    if (!f.title.trim()) { ctx.toast('Önce bir ad yazın.'); return; }
    ctx.update((s) => addMemoItem(s, f, today));
    ctx.toast('Ezber eklendi.');
  };
  titleIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  add(grid, pcard('Yeni ezber', 'plus',
    h('div', { class: 'small muted', style: { marginBottom: '8px' } }, 'Yalnızca ad girilir; metin içeriği uygulamaya eklenmez.'),
    field('Ad', titleIn),
    h('div', { class: 'row wrap', style: { marginTop: '8px', alignItems: 'flex-end' } },
      field('Tür', selectInput(Object.entries(MEMO_TYPE_LABEL), f.type, (v) => { f.type = v; })),
      field('Başlangıç', dateInput(today, (v) => { f.startedAt = v || today; }))),
    h('div', { style: { height: '8px' } }),
    field('Not (isteğe bağlı)', textInput('', (v) => { f.note = v; })),
    h('button', { class: 'btn btn-primary btn-sm', style: { marginTop: '12px' }, onclick: submit }, icon('plus', 16), 'Ekle')));

  // ── overview + schedule
  const learning = items.filter((i) => !i.archived && i.status === MEMO_STATUS.LEARNING).length;
  const mastered = items.filter((i) => !i.archived && i.status === MEMO_STATUS.MASTERED).length;
  add(grid, pcard('Tekrar düzeni', 'refresh',
    kv('Öğreniliyor', String(learning)), kv('Ezberlendi', String(mastered)),
    kv('Bugün tekrar zamanı', due.length ? due.map((d) => d.title).join(', ') : '—'),
    h('div', { class: 'small muted', style: { margin: '10px 0 6px' } }, 'Önerilen aralıklar (gün). "Kendim okudum" bir adım ileri, "Biraz yardım aldım" bir adım geri, "Tekrar çalışmam gerekiyor" başa döner. Bu bir öneridir; her tarih elle değiştirilebilir.'),
    field('Aralıklar (gün, virgülle)', textInput(reviewIntervals(state).join(', '), (v) => {
      const next = v.split(/[,\s]+/).map(Number).filter((n) => n > 0);
      if (!next.length) { ctx.toast('En az bir gün sayısı gerekir.'); return; }
      ctx.update((s) => { s.config.review.intervals = next; });
    }, { inputmode: 'numeric', placeholder: '1, 3, 7, 14, 30' })),
    h('div', { class: 'kv', style: { marginTop: '8px' } }, h('span', {}, '"Tekrar çalışmam gerekiyor" → kaç gün sonra'), numberInput(state.config.review.needsWorkDays, (v) => ctx.update((s) => { s.config.review.needsWorkDays = Math.max(1, v || 1); }), { min: 1, max: 30 }))));
  add(body, grid);

  // ── items
  add(body, h('div', { class: 'section-title' }, 'Ezberler'));
  const visible = items.filter((i) => !i.archived).sort((a, b) => (a.status === b.status ? (b.masteredAt || b.startedAt || '').localeCompare(a.masteredAt || a.startedAt || '') : a.status === MEMO_STATUS.MASTERED ? -1 : 1));
  if (!visible.length) add(body, h('div', { class: 'pcard muted small' }, 'Henüz ezber eklenmedi.'));
  else add(body, h('div', { class: 'table-wrap' }, h('table', { class: 'table memo-table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Ezber'), h('th', {}, 'Durum'), h('th', {}, 'Tekrar zamanı'), h('th', {}, 'Son tekrar'), h('th', {}, 'Sonuç'), h('th', {}, ''))),
    h('tbody', {}, visible.flatMap((it) => itemRows(ctx, it, due.some((d) => d.id === it.id)))))));

  const archived = items.filter((i) => i.archived);
  if (archived.length) {
    add(body, h('div', { class: 'section-title' }, 'Arşivlenenler'));
    add(body, h('div', { class: 'pcard' }, archived.map((it) => h('div', { class: 'list-row' },
      h('div', { class: 'grow', style: { fontWeight: 800 } }, it.title, h('span', { class: 'small muted' }, ` · ${MEMO_STATUS_LABEL_PARENT[it.status]}`)),
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => archiveMemoItem(s, it.id, false)) }, 'Geri al')))));
  }

  // ── memory project
  add(body, h('div', { class: 'section-title' }, 'Ayın hafıza projesi'));
  add(body, projectSection(ctx));
}

function itemRows(ctx, it, isDue) {
  const { state, today } = ctx;
  const mastered = it.status === MEMO_STATUS.MASTERED;
  const hist = reviewsFor(state, it.id);
  const open = openHistory.has(it.id);
  const rows = [];
  rows.push(h('tr', { class: isDue ? 'due' : '' },
    h('td', {},
      h('div', { style: { fontWeight: 800 } }, it.title),
      h('div', { class: 'small muted' }, `${MEMO_TYPE_LABEL[it.type]} · başlangıç ${formatShort(it.startedAt)}`, it.masteredAt ? ` · ezber ${formatShort(it.masteredAt)}` : '')),
    h('td', {}, h('span', { class: `pill ${mastered ? 'pill-green' : 'pill-amber'}` }, MEMO_STATUS_LABEL_PARENT[it.status])),
    h('td', {}, mastered
      ? h('div', {}, dateInput(it.nextReviewAt, (v) => ctx.update((s) => setNextReview(s, it.id, v))), isDue ? h('div', { class: 'small', style: { color: 'var(--clay)', fontWeight: 800 } }, 'Tekrar zamanı') : null)
      : h('span', { class: 'muted small' }, '—')),
    h('td', {}, it.lastReviewedAt ? formatShort(it.lastReviewedAt) : h('span', { class: 'muted' }, '—')),
    h('td', {}, it.lastResult ? h('span', { class: `pill ${it.lastResult === 'self' ? 'pill-green' : it.lastResult === 'assisted' ? 'pill-amber' : 'pill-clay'}` }, REVIEW_RESULT_LABEL[it.lastResult]) : h('span', { class: 'muted' }, '—')),
    h('td', {}, h('button', { class: 'btn btn-ghost btn-sm', 'aria-expanded': open ? 'true' : 'false', onclick: () => { if (open) openHistory.delete(it.id); else openHistory.add(it.id); ctx.store.update(() => {}); } }, open ? 'Kapat' : 'Yönet'))));
  if (!open) return rows;
  rows.push(h('tr', { class: 'detail' }, h('td', { colspan: '6' }, itemDetail(ctx, it, hist))));
  return rows;
}

function itemDetail(ctx, it, hist) {
  const { today } = ctx;
  const mastered = it.status === MEMO_STATUS.MASTERED;
  const set = (patch) => ctx.update((s) => updateMemoItem(s, it.id, patch));
  const rev = { date: today, result: REVIEW_RESULT.SELF, note: '' };
  return h('div', { class: 'memo-detail' },
    h('div', { class: 'grid grid-2' },
      h('div', {},
        field('Ad', textInput(it.title, (v) => set({ title: v }))),
        h('div', { class: 'row wrap', style: { marginTop: '8px', alignItems: 'flex-end' } },
          field('Tür', selectInput(Object.entries(MEMO_TYPE_LABEL), it.type, (v) => set({ type: v }))),
          field('Başlangıç', dateInput(it.startedAt, (v) => set({ startedAt: v || it.startedAt }))),
          mastered ? field('Ezber tarihi', dateInput(it.masteredAt, (v) => set({ masteredAt: v || it.masteredAt }))) : null),
        h('div', { style: { height: '8px' } }),
        field('Not', textInput(it.note || '', (v) => set({ note: v }))),
        h('div', { class: 'row wrap', style: { marginTop: '12px' } },
          mastered
            ? h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => markLearning(s, it.id)) }, 'Ezber işaretini geri al')
            : h('button', { class: 'btn btn-primary btn-sm', onclick: () => ctx.update((s) => markMastered(s, it.id, today)) }, icon('check', 16), 'Ezberlendi'),
          h('button', { class: 'btn btn-ghost btn-sm', onclick: async () => {
            const ok = await confirmSheet({ title: 'Arşivle', body: `"${it.title}" çocuk ekranından kaldırılır; geçmişi ve tekrar kayıtları saklanır.`, ok: 'Arşivle' });
            if (ok) ctx.update((s) => archiveMemoItem(s, it.id, true));
          } }, 'Arşivle'))),
      h('div', {},
        h('div', { class: 'field' }, h('label', {}, 'Tekrar kaydet'),
          h('div', { class: 'row wrap', style: { alignItems: 'flex-end' } },
            dateInput(today, (v) => { rev.date = v || today; }),
            selectInput(Object.entries(REVIEW_RESULT_LABEL), rev.result, (v) => { rev.result = v; }),
            h('button', { class: 'btn btn-soft btn-sm', disabled: !mastered ? true : null, onclick: () => { ctx.update((s) => recordReview(s, it.id, rev.result, rev.date, { note: rev.note, by: 'parent' })); ctx.toast('Tekrar kaydedildi.'); } }, icon('plus', 16), 'Kaydet')),
          !mastered ? h('div', { class: 'small muted' }, 'Tekrar kaydı için önce "Ezberlendi" işaretleyin.') : null),
        h('div', { class: 'small muted', style: { margin: '12px 0 6px', fontWeight: 800 } }, `Tekrar geçmişi (${hist.length})`),
        hist.length ? h('div', { class: 'stack', style: { gap: '4px' } }, [...hist].reverse().map((r) => h('div', { class: 'list-row', style: { padding: '6px 0' } },
          dateInput(r.date, (v) => ctx.update((s) => updateReview(s, r.id, { date: v || r.date }))),
          h('div', { class: 'status-seg' }, Object.entries(REVIEW_RESULT_LABEL).map(([v, label]) => h('button', { class: `${RESULT_CLS[v]} ${r.result === v ? 'on' : ''}`, onclick: () => ctx.update((s) => updateReview(s, r.id, { result: v })) }, label))),
          h('span', { class: 'small muted' }, r.by === 'parent' ? 'ebeveyn' : 'Emir'),
          h('button', { class: 'icon-btn', 'aria-label': 'Sil', onclick: () => ctx.update((s) => removeReview(s, r.id)) }, icon('trash', 16)))))
          : h('div', { class: 'small muted' }, 'Henüz tekrar yok.'))));
}

function projectSection(ctx) {
  const { state, today } = ctx;
  const active = activeProject(state);
  const history = projectHistory(state).filter((p) => p.status !== PROJECT_STATUS.ACTIVE);
  const grid = h('div', { class: 'grid grid-2' });

  if (active) {
    const set = (patch) => ctx.update((s) => updateProject(s, active.id, patch));
    add(grid, pcard('Devam eden proje', 'leaf',
      field('Başlık', textInput(active.title, (v) => set({ title: v }))),
      h('div', { class: 'row wrap', style: { marginTop: '8px', alignItems: 'flex-end' } },
        field('Tür', selectInput(Object.entries(PROJECT_TYPE_LABEL), active.type, (v) => set({ type: v }))),
        field('Hedef ay', monthInput(active.targetMonth, (v) => set({ targetMonth: v || active.targetMonth }))),
        field('Başlangıç', dateInput(active.startedAt, (v) => set({ startedAt: v || active.startedAt })))),
      h('div', { style: { height: '8px' } }),
      field('Not', textInput(active.note || '', (v) => set({ note: v }))),
      h('div', { class: 'row wrap', style: { marginTop: '12px' } },
        h('button', { class: 'btn btn-primary btn-sm', onclick: () => { ctx.update((s) => completeProject(s, active.id, today)); ctx.toast('Proje tamamlandı.'); } }, icon('check', 16), 'Tamamlandı'))));
  }

  const f = { title: '', type: PROJECT_TYPE.FREE, targetMonth: monthKey(today), note: '' };
  const titleIn = textInput('', (v) => { f.title = v; }, { placeholder: 'Örn. İstiklâl Marşı — ilk iki kıta' });
  add(grid, pcard(active ? 'Sonraki proje (mevcut olanı değiştirir)' : 'Yeni proje', 'plus',
    h('div', { class: 'small muted', style: { marginBottom: '8px' } }, 'Aynı anda tek proje. Günlük listeye eklenmez; Haftam ve Arşivim\'de görünür.'),
    field('Başlık', titleIn),
    h('div', { class: 'row wrap', style: { marginTop: '8px', alignItems: 'flex-end' } },
      field('Tür', selectInput(Object.entries(PROJECT_TYPE_LABEL), f.type, (v) => { f.type = v; })),
      field('Hedef ay', monthInput(f.targetMonth, (v) => { f.targetMonth = v || f.targetMonth; }))),
    h('div', { style: { height: '8px' } }),
    field('Not', textInput('', (v) => { f.note = v; })),
    h('button', { class: `btn btn-sm ${active ? 'btn-ghost' : 'btn-primary'}`, style: { marginTop: '12px' }, onclick: async () => {
      f.title = titleIn.value;
      if (!f.title.trim()) { ctx.toast('Önce bir başlık yazın.'); return; }
      if (active) {
        const ok = await confirmSheet({ title: 'Projeyi değiştir', body: `"${active.title}" tamamlanmadan kapatılıp geçmişe alınacak.`, ok: 'Değiştir' });
        if (!ok) return;
      }
      ctx.update((s) => createProject(s, f, today, { replace: !!active }));
      ctx.toast('Proje oluşturuldu.');
    } }, icon('plus', 16), active ? 'Değiştir' : 'Oluştur')));

  const wrap = h('div', {}, grid);
  if (history.length) {
    add(wrap, h('div', { class: 'pcard', style: { marginTop: '16px' } },
      h('h3', {}, icon('list', 18), 'Proje geçmişi'),
      history.map((p) => h('div', { class: 'list-row' },
        h('div', { class: 'grow' }, h('div', { style: { fontWeight: 800 } }, p.title), h('div', { class: 'small muted' }, `${PROJECT_TYPE_LABEL[p.type] || ''} · ${monthName(p.targetMonth + '-01')} ${p.targetMonth.slice(0, 4)} · ${p.completedAt ? 'tamamlandı ' + formatShort(p.completedAt) : PROJECT_STATUS_LABEL[p.status]}`)),
        h('span', { class: `pill ${p.status === PROJECT_STATUS.COMPLETED ? 'pill-green' : 'pill-sand'}` }, PROJECT_STATUS_LABEL[p.status]),
        !active ? h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => reopenProject(s, p.id)) }, 'Yeniden aç') : null))));
  }
  return wrap;
}
