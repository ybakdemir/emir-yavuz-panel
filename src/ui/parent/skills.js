import { h, add, confirmSheet } from '../dom.js';
import { icon } from '../icons.js';
import { SKILL_STATUS_LABEL } from '../../content/defaults.js';
import { formatShort } from '../../core/dates.js';
import { activateSkill, deactivateSkill, graduateSkill, evaluateGraduation, skillHistory } from '../../core/skills.js';
import { isCompleted } from '../../core/completion.js';
import { pcard, field, textInput, numberInput, checkbox, fmtPct } from './common.js';
import { checkRow } from './dashboard.js';

export function renderSkillsAdmin(body, ctx) {
  const { state, today } = ctx;
  const g = state.skills.graduation;
  const active = state.skills.pool.find((s) => s.id === state.skills.activeId);
  const grid = h('div', { class: 'grid grid-2' });

  // ── Active skill
  const activeCard = pcard('Haftanın becerisi', 'seed');
  if (active) {
    const ev = evaluateGraduation(state, active.id, today);
    add(activeCard, 
      h('div', { style: { fontSize: '18px', fontWeight: 800 } }, active.title),
      h('div', { class: 'small muted' }, `${SKILL_STATUS_LABEL[active.status]} · başlangıç ${active.activatedAt ? formatShort(active.activatedAt) : '—'}`),
      h('div', { class: 'check-list' },
        checkRow(ev.checks.observed, `Gözlem ${ev.observed}/${g.minDaysObserved} gün`),
        checkRow(ev.checks.completion, `Tamamlama ${fmtPct(ev.completion)} / ${fmtPct(g.minCompletion)}`),
        checkRow(ev.checks.independence, `Bağımsız ${fmtPct(ev.independence)} / ${fmtPct(g.minIndependent)}`),
        checkRow(ev.checks.lastN, `Son ${g.lastN}: ${ev.lastN.independent} hatırlatmasız / ${g.minNoReminder}`)),
      h('div', { class: 'row wrap', style: { marginTop: '12px' } },
        h('button', { class: `btn btn-sm ${ev.eligible ? 'btn-primary' : 'btn-ghost'}`, onclick: () => graduate(ctx, active) }, icon('check', 16), 'Mezun et'),
        h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => deactivateSkill(s)) }, 'Bu hafta beceri yok')));
  } else {
    add(activeCard, h('div', { class: 'muted small' }, 'Aktif beceri yok. Aşağıdan birini "Bu hafta" yapın.'));
  }
  add(grid, activeCard);

  // ── Graduation settings
  const set = (k, v) => ctx.update((s) => { s.skills.graduation[k] = v; });
  add(grid, pcard('Mezuniyet ölçütleri', 'gear',
    h('div', { class: 'kv' }, h('span', {}, 'Gözlem penceresi (gün)'), numberInput(g.windowDays, (v) => set('windowDays', v), { min: 5, max: 60 })),
    h('div', { class: 'kv' }, h('span', {}, 'En az gözlenen gün'), numberInput(g.minDaysObserved, (v) => set('minDaysObserved', v), { min: 1, max: 30 })),
    h('div', { class: 'kv' }, h('span', {}, 'Tamamlama (%)'), numberInput(Math.round(g.minCompletion * 100), (v) => set('minCompletion', v / 100), { min: 0, max: 100 })),
    h('div', { class: 'kv' }, h('span', {}, 'Bağımsız tamamlama (%)'), numberInput(Math.round(g.minIndependent * 100), (v) => set('minIndependent', v / 100), { min: 0, max: 100 })),
    h('div', { class: 'kv' }, h('span', {}, 'Son N uygulama'), numberInput(g.lastN, (v) => set('lastN', v), { min: 1, max: 14 })),
    h('div', { class: 'kv' }, h('span', {}, '…kaçı hatırlatmasız'), numberInput(g.minNoReminder, (v) => set('minNoReminder', v), { min: 1, max: 14 })),
    h('div', { class: 'kv' }, h('span', {}, 'Öğrenme → Çalışma (tamamlama sayısı)'), numberInput(g.learningToPracticing, (v) => set('learningToPracticing', v), { min: 1, max: 30 })),
    h('div', { style: { marginTop: '8px' } }, checkbox('Ölçütler sağlanınca otomatik mezun et', g.autoGraduate, (v) => set('autoGraduate', v)))));

  add(body, grid);

  // ── Pool
  add(body, h('div', { class: 'section-title' }, 'Beceri havuzu'));
  const table = h('table', { class: 'table' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Beceri'), h('th', {}, 'Durum'), h('th', {}, 'Geçmiş'), h('th', {}, ''))),
    h('tbody', {}, state.skills.pool.map((sk) => {
      const hist = skillHistory(state, sk.id);
      const done = hist.filter((x) => isCompleted(x.status)).length;
      const ind = hist.filter((x) => x.status === 'independent').length;
      return h('tr', {},
        h('td', {}, h('div', { style: { fontWeight: 800 } }, sk.title), h('div', { class: 'small muted' }, sk.hint || '')),
        h('td', {}, h('span', { class: `pill ${sk.status === 'mastered' ? 'pill-green' : sk.status === 'pool' ? 'pill-sand' : 'pill-amber'}` }, SKILL_STATUS_LABEL[sk.status] || sk.status),
          sk.masteredAt ? h('div', { class: 'small muted' }, formatShort(sk.masteredAt)) : null, sk.hidden ? h('div', { class: 'small muted' }, 'gizli') : null),
        h('td', { class: 'small' }, hist.length ? `${hist.length} gün · ${done} yapıldı · ${ind} kendi` : '—'),
        h('td', {}, h('div', { class: 'row wrap' },
          state.skills.activeId !== sk.id && sk.status !== 'mastered' ? h('button', { class: 'btn btn-soft btn-sm', onclick: () => ctx.update((s) => activateSkill(s, sk.id, today)) }, 'Bu hafta') : null,
          sk.status === 'mastered' ? h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => { const x = s.skills.pool.find((y) => y.id === sk.id); x.hidden = !x.hidden; }) }, sk.hidden ? 'Göster' : 'Gizle') : null,
          sk.status === 'mastered' ? h('button', { class: 'btn btn-ghost btn-sm', onclick: () => ctx.update((s) => { const x = s.skills.pool.find((y) => y.id === sk.id); x.status = 'practicing'; x.hidden = false; }) }, 'Tekrar çalış') : null,
          h('button', { class: 'btn btn-ghost btn-sm', onclick: () => editSkill(ctx, sk) }, icon('edit', 16)))));
    })));
  add(body, h('div', { class: 'pcard' }, h('div', { class: 'table-wrap' }, table)));

  const title = h('input', { class: 'input', placeholder: 'Yeni beceri (ör. Kendi saçımı tarıyorum)' });
  const hint = h('input', { class: 'input', placeholder: 'Küçük ipucu (isteğe bağlı)' });
  add(body, h('div', { class: 'pcard', style: { marginTop: '14px' } }, h('h3', {}, icon('plus', 18), 'Yeni beceri'),
    h('div', { class: 'stack' }, title, hint,
      h('button', { class: 'btn btn-primary btn-sm', onclick: () => { if (!title.value.trim()) return; const t = title.value.trim(), hh = hint.value.trim(); ctx.update((s) => { s.skills.pool.push({ id: 'k' + Date.now().toString(36), title: t, hint: hh, status: 'pool' }); }); } }, 'Ekle'))));
}

async function graduate(ctx, skill) {
  const merge = h('select', { class: 'input' }, h('option', { value: '' }, 'Rutine eklenmesin'), h('option', { value: 'morning' }, 'Sabah rutinine adım olarak ekle'), h('option', { value: 'evening' }, 'Akşam rutinine adım olarak ekle'));
  const hide = h('input', { type: 'checkbox' });
  const review = h('input', { type: 'checkbox' });
  const ok = await confirmSheet({
    title: `"${skill.title}" — artık yapabiliyor`,
    body: h('div', { class: 'stack' },
      h('div', { class: 'small' }, 'Geçmiş korunur, mezuniyet tarihi kaydedilir.'),
      field('Rutine birleştir', merge),
      h('label', { class: 'row small', style: { fontWeight: 700 } }, review, 'Ara sıra tekrar için işaretle'),
      h('label', { class: 'row small', style: { fontWeight: 700 } }, hide, 'Çocuk ekranında gizle')),
    ok: 'Mezun et',
  });
  if (!ok) return;
  ctx.update((s) => {
    graduateSkill(s, skill.id, ctx.today, { mergeIntoRoutine: merge.value || null, review: review.checked, hide: hide.checked });
    if (merge.value) s.config.routines[merge.value].steps.push({ id: 'skill_' + skill.id, label: skill.title, stages: ['learn', 'practice'] });
  });
  ctx.toast('Beceri mezun edildi.');
}

async function editSkill(ctx, sk) {
  const t = h('input', { class: 'input', value: sk.title });
  const hh = h('input', { class: 'input', value: sk.hint || '' });
  const ok = await confirmSheet({ title: 'Beceriyi düzenle', body: h('div', { class: 'stack' }, field('Başlık', t), field('İpucu', hh)), ok: 'Kaydet' });
  if (!ok) return;
  ctx.update((s) => { const x = s.skills.pool.find((y) => y.id === sk.id); x.title = t.value.trim() || x.title; x.hint = hh.value.trim(); });
}
