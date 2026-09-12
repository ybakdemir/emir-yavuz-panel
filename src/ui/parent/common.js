import { h, add } from '../dom.js';
import { icon } from '../icons.js';

export function pcard(title, iconName, ...children) {
  return h('div', { class: 'pcard' }, title ? h('h3', {}, iconName ? icon(iconName, 18) : null, title) : null, ...children);
}

export function field(label, input) {
  return h('div', { class: 'field' }, h('label', {}, label), input);
}

export function textInput(value, onChange, attrs = {}) {
  return h('input', { class: 'input', type: 'text', value: value ?? '', onchange: (e) => onChange(e.target.value), ...attrs });
}

export function numberInput(value, onChange, attrs = {}) {
  return h('input', { class: 'input input-sm', type: 'number', value: value ?? 0, inputmode: 'numeric', onchange: (e) => onChange(Number(e.target.value)), ...attrs });
}

export function checkbox(label, checked, onChange) {
  return h('label', { class: 'row', style: { minHeight: '40px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' } },
    h('input', { type: 'checkbox', checked: checked || null, onchange: (e) => onChange(e.target.checked), style: { width: '20px', height: '20px' } }), label);
}

export function segmented(options, value, onChange) {
  return h('div', { class: 'toggle' }, options.map(([v, label]) => h('button', { class: v === value ? 'on' : '', onclick: () => onChange(v) }, label)));
}

/** Editable string list (options, topics…). */
export function stringList(items, onChange, placeholder = 'Yeni…') {
  const list = h('div', {});
  items.forEach((it, i) => add(list, h('div', { class: 'list-row' },
    textInput(it, (v) => { const next = items.slice(); next[i] = v; onChange(next); }),
    h('button', { class: 'icon-btn', 'aria-label': 'Sil', onclick: () => onChange(items.filter((_, j) => j !== i)) }, icon('trash', 18)))));
  const addInput = h('input', { class: 'input', placeholder, onkeydown: (e) => { if (e.key === 'Enter' && addInput.value.trim()) { onChange([...items, addInput.value.trim()]); addInput.value = ''; } } });
  add(list, h('div', { class: 'list-row' }, addInput, h('button', { class: 'icon-btn', 'aria-label': 'Ekle', onclick: () => { if (addInput.value.trim()) { onChange([...items, addInput.value.trim()]); addInput.value = ''; } } }, icon('plus', 18))));
  return list;
}

/** null = undefined ratio (e.g. no classified completions yet) → '–', never a misleading 0%. */
export const fmtPct = (v) => (v === null ? '–' : `${Math.round((v || 0) * 100)}%`);

export function dateInput(value, onChange, attrs = {}) {
  return h('input', { class: 'input input-date', type: 'date', value: value || '', onchange: (e) => onChange(e.target.value || null), ...attrs });
}

export function monthInput(value, onChange, attrs = {}) {
  return h('input', { class: 'input input-date', type: 'month', value: value || '', onchange: (e) => onChange(e.target.value || null), ...attrs });
}

export function selectInput(options, value, onChange, attrs = {}) {
  return h('select', { class: 'input', onchange: (e) => onChange(e.target.value), ...attrs },
    options.map(([v, label]) => h('option', { value: v, selected: v === value ? true : null }, label)));
}

/** Small key/value line used by the learning-layer cards. */
export function kv(label, value) {
  return h('div', { class: 'kv' }, h('span', {}, label), h('span', {}, value ?? '—'));
}
