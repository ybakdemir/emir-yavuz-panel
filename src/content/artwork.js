// Production artwork registry — the single place the UI looks for raster
// artwork. Every slot is optional: while a key is missing the UI draws the
// built-in original SVG (ui/art.js worldScene / companionArt, ui/dinos.js
// silhouettes), so nothing here blocks behaviour and no web images are ever
// referenced. See docs/ARTWORK.md for the exact files, sizes and names.
//
// Paths are relative to index.html. Prefer WebP; keep the hero ≤ 300 KB and
// each dinosaur ≤ 180 KB. The hero is the only image loaded eagerly; every
// card image is lazy-loaded (ui/dinos.js).
//
// Registered 2026-09-12 (Dinosaur Discovery Visual Redesign v1): the clean,
// unwatermarked images from the family's own dinosaur presentation and photo
// set. Species without a clean source (see docs/ARTWORK.md) stay on the SVG.
export const ARTWORK = {
  // Page hero on every child screen (visual alignment 2026-09-13): the
  // sunlit valley — sky, cliffs, light rays, a sauropod on the right — is the
  // closest owned scene to design-references/01..03. `focus` is the
  // object-position used when the image is cropped on phones.
  // Fallback hero for any child screen without a premium hero of its own
  // (PREMIUM.heroes below); the sunlit valley is the closest owned photo.
  worldHero: { src: 'assets/scenes/valley.webp', focus: '62% 42%' },

  // Species artwork, dino kind → path or { src, focus } (kinds: ui/dinos.js
  // DINO_KINDS). `focus` keeps the head in frame on portrait atlas covers.
  dinos: {
    trex: { src: 'assets/dinos/trex.webp', focus: '55% 45%' },
    triceratops: { src: 'assets/dinos/triceratops.webp', focus: '46% 50%' },
    brachiosaurus: { src: 'assets/dinos/brachiosaurus.webp', focus: '66% 40%' },
    diplodocus: { src: 'assets/dinos/diplodocus.webp', focus: '36% 40%' },
    spinosaurus: { src: 'assets/dinos/spinosaurus.webp', focus: '30% 55%' },
  },

  // Cinematic backdrops per expedition region tone (reserved, not drawn yet).
  //   e.g. scenes: { green: 'assets/scenes/jurassic.webp' }
  scenes: {},

  // Keşif Notları covers, note id (content/dinopedia.js FIELD_NOTES) → path.
  // Notes may reuse a species file; the browser fetches it once.
  notes: {
    what: 'assets/dinos/triceratops.webp',
    origin: 'assets/scenes/dusk.webp',
    eras: 'assets/dinos/diplodocus.webp',
    world: 'assets/scenes/world-hero.webp',
    extinction: 'assets/dinos/spinosaurus.webp',
  },

  // The explorer companion (premium character 000004, cut out of its flat
  // backdrop). Drawn where the reference calls for the dinosaur on its own:
  // the Haftam streak card, Today's "day done" moment, the map footer.
  companion: 'assets/artwork/web/characters/000004.webp',
};

// Premium artwork package (2026-09-13, assets/artwork/premium/**). The app
// references the web derivatives that scripts/build-premium-artwork.py
// writes to assets/artwork/web/ (same names, WebP, sized for the screen);
// the PNG originals stay untouched as the source of truth. Every path is
// optional: a null slot falls back to the built-in SVG/CSS treatment.
const WEB = 'assets/artwork/web';
export const PREMIUM = {
  // Screen heroes — the real HTML (sign, headline, copy, settings) is laid over them.
  heroes: {
    today: { src: `${WEB}/heroes/000001.webp`, focus: '62% 40%' },      // Bugün: explorer child + companion over the valley
    week: { src: `${WEB}/heroes/000002.webp`, focus: '60% 40%' },       // Haftam
    explore: { src: `${WEB}/heroes/000003.webp`, focus: '62% 40%' },    // Keşif: the child holds the map
    // Becerilerim compact header, Keşif adventure banner. The compact band is
    // shorter than the 4:3 painting, so the crop is anchored near the top:
    // the companion's hat and face stay in frame on phones and tablets.
    secondary: { src: `${WEB}/heroes/000005.webp`, focus: '56% 6%' },
    // Arşivim (visual pack): the library scene — a sauropod reading among
    // shelves, the valley behind. The phone band shows two thirds of the
    // width; anchored towards the shelves so the reader, the open book and
    // the library stay whole while the headline sits on the cliff/sky.
    archive: { src: `${WEB}/heroes/archive.webp`, focus: '88% 50%' },
  },
  // Keşif "Bölge bölge ilerle" banner (visual pack, valley without the child).
  scenes: {
    valleyHeader: { src: `${WEB}/scenes/valley-header.webp`, focus: '50% 18%' },   // keeps the companion's hat in the wide banner
  },
  map: `${WEB}/maps/000006.webp`,                    // Keşif Haritası ground (nodes, trail and labels are HTML)
  sign: `${WEB}/ui/000007.webp`,                     // wooden plank, 9-sliced under .sign
  badge: `${WEB}/badges/000008.webp`,                // achievement badge (streak card, mastered skills, milestones)
  littleExplorer: `${WEB}/icons/pack/little_explorer_english.webp`,  // the Little Explorer / English identity
  // Semantic UI icons (visual pack, 2026-09-13), keyed by the UI slot they
  // depict. Drawn through icons()/taskIcon(); a missing key keeps the glyph.
  icons: {
    morning: `${WEB}/icons/pack/morning_routine.webp`,           // Sabah rutinim
    evening: `${WEB}/icons/pack/evening_routine.webp`,           // Akşam rutinim
    physical: `${WEB}/icons/pack/daily_physical_five.webp`,      // Daily Physical Five
    presentation: `${WEB}/icons/pack/weekly_presentation.webp`,  // Haftanın sunumu (Bugün, Haftam, Sunumlarım)
    weeklyReward: `${WEB}/icons/pack/weekly_reward.webp`,        // Haftanın Seçimi
    skill: `${WEB}/icons/pack/learning_stage.webp`,              // Haftanın becerisi / öğrenme aşaması (Becerilerim)
    mastery: `${WEB}/icons/pack/mastery_badge.webp`,             // Artık yapabiliyorum (Becerilerim)
    discovery: `${WEB}/icons/pack/today_discovery.webp`,         // Bugünün Keşfi
    notes: `${WEB}/icons/pack/explorer_notes.webp`,              // Kaşif / Keşif Notları
    reading: `${WEB}/icons/pack/reading.webp`,                   // 20 sayfa aile okuması, Kitaplığım
    prayer: `${WEB}/icons/pack/prayer.webp`,                     // Namaz
    homework: `${WEB}/icons/pack/homework.webp`,                 // Okul ödevim
    social: `${WEB}/icons/pack/meet_people_social_skill.webp`,   // sosyal beceri (reserved: no such task yet)
    water: `${WEB}/icons/pack/water.webp`,                       // su (reserved: no such task yet)
  },
  // Daily routine icons, keyed by the real task / routine-step id they depict
  // (semantic match; steps without a match keep the app's glyph tiles).
  daily: {
    bag: `${WEB}/icons/daily/01_canta_hazirladim.webp`,        // Çantamı kontrol ettim
    tomorrow: `${WEB}/icons/daily/01_canta_hazirladim.webp`,   // Yarına hazırlandım (bag packed for tomorrow)
    reading: `${WEB}/icons/pack/reading.webp`,                 // 20 sayfa aile okuması (visual pack)
    story: `${WEB}/icons/daily/02_okuma_yaptim.webp`,          // Masal veya Kuran dinledim
    bed: `${WEB}/icons/daily/03_yatagimi_topladim.webp`,       // Yatağımı topladım
    breakfast: `${WEB}/icons/daily/04_yemegimi_yedim.webp`,    // Kahvaltımı yaptım
    dua: `${WEB}/icons/daily/05_dua_ettim.webp`,               // Duamı yaptım
    prayer: `${WEB}/icons/pack/prayer.webp`,                   // Namaz (visual pack)
    homework: `${WEB}/icons/pack/homework.webp`,               // Okul ödevim (visual pack)
    face: `${WEB}/icons/daily/07_yuzumu_yikadim.webp`,         // Yüzümü yıkadım
    dress: `${WEB}/icons/daily/08_giyindim.webp`,              // Giyindim
    pajama: `${WEB}/icons/daily/08_giyindim.webp`,             // Pijamamı giydim
    teeth: `${WEB}/icons/daily/09_dislerimi_fircaladim.webp`,  // Dişlerimi fırçaladım
    // 10_su_ictim.webp (water) has no task in the product yet — intentionally unmapped.
  },
};

/** Premium hero for a child screen ({ src, focus }) or null (→ ARTWORK.worldHero). */
export const premiumHero = (key) => PREMIUM.heroes?.[key] || null;

/** Premium raster for a daily task / routine-step id, or null (→ glyph tile). */
export const dailyIcon = (id) => PREMIUM.daily?.[id] || null;

/** Semantic UI icon from the visual pack (PREMIUM.icons key), or null (→ glyph). */
export const packIcon = (key) => PREMIUM.icons?.[key] || null;

/** Premium scene for a banner slot ({ src, focus }) or null. */
export const premiumScene = (key) => PREMIUM.scenes?.[key] || null;

const entry = (v) => (typeof v === 'string' ? { src: v, focus: null } : v && v.src ? { src: v.src, focus: v.focus || null } : null);

/** Registered raster for a dino kind, or null (→ built-in SVG silhouette). */
export const dinoArt = (kind) => entry(ARTWORK.dinos?.[kind])?.src || null;

/** object-position for a dino kind's raster when it is cropped, or null. */
export const dinoFocus = (kind) => entry(ARTWORK.dinos?.[kind])?.focus || null;

/** Registered cover for a Keşif Notu, or null (→ tinted glyph tile). */
export const noteArt = (id) => ARTWORK.notes?.[id] || null;
