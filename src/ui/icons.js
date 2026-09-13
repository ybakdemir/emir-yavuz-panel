import { svg } from './dom.js';

// 24px stroke icons. Stroke inherits currentColor. Deliberately no star icon.
const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  pencil: '<path d="M4 20l4-1L19.5 7.5a2 2 0 0 0-3-3L5 16l-1 4z"/><path d="M14.5 6.5l3 3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5V5.5M20 18v3H6.5"/>',
  quran: '<path d="M12 5.5c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5z"/><path d="M12 5.5v14"/><path d="M8 9.5c1 0 1.5.5 2.5 0M15 9.5c-1 0-1.5.5-2.5 0"/>',
  prayer: '<path d="M6 21V11a6 6 0 0 1 12 0v10"/><path d="M3 21h18"/><path d="M12 3v2M9.5 6.5L12 5l2.5 1.5"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  seed: '<path d="M12 22V12"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 15c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20l4-1L19.5 7.5a2 2 0 0 0-3-3L5 16l-1 4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  printer: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  footprint: '<ellipse cx="11" cy="14" rx="4" ry="6"/><circle cx="6.5" cy="7.5" r="1.6"/><circle cx="10" cy="5.5" r="1.6"/><circle cx="14" cy="5.5" r="1.6"/><circle cx="17.5" cy="7.5" r="1.6"/>',
  fossil: '<path d="M12 21a9 9 0 1 1 0-18 6 6 0 1 1 0 12 3 3 0 1 1 0-6"/>',
  today: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  gift: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8c-2-3-6-3-6-1s3 1 6 1zM12 8c2-3 6-3 6-1s-3 1-6 1z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  hand: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V6a1.5 1.5 0 0 1 3 0v6M16 12V9a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L3 13a1.5 1.5 0 0 1 2.4-1.8L7 13"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 6 5"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9M10 13h4"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 2 2v1H9"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7"/><path d="M9 11h6M9 15h6"/>',
  library: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M15.5 5.2l3.8-1 4 15.5-3.8 1z"/>',
  leaf: '<path d="M4 20c0-9 5-14 16-16-1 11-6 16-14 16z"/><path d="M4 20c4-6 8-9 12-12"/>',
  clockSmall: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 21h6M10 17h4v4h-4z"/>',
  books: '<path d="M4 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M5 10a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M4 14a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M6 18a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.4 1 2.5h6c0-1.1.3-1.9 1-2.5A6 6 0 0 0 12 3z"/>',
  notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>',
  binoculars: '<circle cx="7" cy="15" r="4"/><circle cx="17" cy="15" r="4"/><path d="M9 6h6v6H9zM9 8H6l-2 6M15 8h3l2 6"/>',
  chartBars: '<path d="M6 20v-6M12 20V4M18 20v-9"/>',
};

export function icon(name, size = 24, cls = '') {
  return svg(`<g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.info}</g>`, { size, cls: `ic ${cls}` });
}

/** Solid footprint used as the "done" stamp. */
export function footprintStamp(size = 28) {
  return svg('<g fill="currentColor"><ellipse cx="11" cy="14.5" rx="4.2" ry="6"/><circle cx="6.3" cy="7.6" r="1.7"/><circle cx="9.8" cy="5.4" r="1.7"/><circle cx="14" cy="5.4" r="1.7"/><circle cx="17.6" cy="7.6" r="1.7"/></g>', { size, cls: 'stamp' });
}
