// App icon registry — the single place the app knows its icons. The PNGs are
// built from assets/artwork/premium/app-icons/*.png by
// scripts/build-premium-artwork.py (192 px rounded per icon; the default also
// gets the platform sizes).
//
// Platform limit: the favicon follows the chosen icon at runtime, but an
// installed web app's launcher icon (Apple touch icon, manifest icon) is fixed
// at install time by the OS — it always stays the default (calendar). The
// choice itself lives in config.settings.appIcon and syncs with the rest of
// the settings.
const WEB = 'assets/artwork/web/app-icons';

export const DEFAULT_APP_ICON = 'calendar';

export const APP_ICONS = [
  { id: 'calendar', label: 'Calendar', hint: 'Varsayılan', src: `${WEB}/calendar-192.png` },
  { id: 'dinosaur', label: 'Dinozor', hint: null, src: `${WEB}/dinosaur-192.png` },
  { id: 'growth', label: 'Growth', hint: null, src: `${WEB}/growth-192.png` },
];

// The real system icon (favicon fallback, Apple touch icon, manifest) — index.html and manifest.webmanifest reference these files.
export const PLATFORM_ICON = {
  favicon: `${WEB}/calendar-192.png`,
  apple: `${WEB}/calendar-180.png`,
  manifest: [`${WEB}/calendar-192.png`, `${WEB}/calendar-512.png`, `${WEB}/calendar-maskable-512.png`],
};

/** Registry entry for an icon id; unknown / missing ids resolve to the default. */
export const appIcon = (id) => APP_ICONS.find((i) => i.id === id) || APP_ICONS.find((i) => i.id === DEFAULT_APP_ICON);

/** Point the document's favicon at the chosen icon (no-op outside a document). */
export function applyAppIcon(id) {
  if (typeof document === 'undefined') return;
  const link = document.querySelector('link[rel="icon"]');
  const src = appIcon(id).src;
  if (link && link.getAttribute('href') !== src) link.setAttribute('href', src);
}
