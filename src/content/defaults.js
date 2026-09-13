// Seed content for v2. Everything here is copied into state.config on first
// run and from then on is owned by Parent Mode (data, not code). Changing a
// default later does NOT silently change a live config — see migrate.js.

export const SCHEMA_VERSION = 6;

// Completion semantics (see core/completion.js)
// A plain tap records COMPLETED_UNSPECIFIED ('done' on the wire): the task is
// done, but *how* is not claimed. Independence is only ever recorded when Emir
// or a parent explicitly picks it. Imported v1 ticks carry the same value.
export const STATUS = {
  INDEPENDENT: 'independent',
  REMINDER: 'reminder',
  ASSISTED: 'assisted',
  NOT_DONE: 'not_done',
  COMPLETED_UNSPECIFIED: 'done',
};

export const STATUS_LABEL = {
  independent: 'Kendim yaptım',
  reminder: 'Hatırlatılınca yaptım',
  assisted: 'Birlikte yaptık',
  not_done: 'Bugün yapmadım',
  done: 'Yaptım',
};

export const ROUTINE_STAGES = ['learn', 'practice', 'mastered'];
export const ROUTINE_STAGE_LABEL = { learn: 'Öğreniyorum', practice: 'Çalışıyorum', mastered: 'Artık yapabiliyorum' };

export const DEFAULT_ROUTINES = {
  morning: {
    id: 'morning',
    title: 'Sabah rutinim',
    doneTitle: 'Sabah rutinimi tamamladım',
    icon: 'sun',
    stage: 'learn',
    steps: [
      { id: 'face', label: 'Yüzümü yıkadım', stages: ['learn', 'practice'] },
      { id: 'dress', label: 'Giyindim', stages: ['learn'] },
      { id: 'bed', label: 'Yatağımı topladım', stages: ['learn', 'practice'] },
      { id: 'breakfast', label: 'Kahvaltımı yaptım', stages: ['learn'] },
      { id: 'bag', label: 'Çantamı kontrol ettim', stages: ['learn', 'practice'] },
    ],
  },
  evening: {
    id: 'evening',
    title: 'Akşam rutinim',
    doneTitle: 'Akşam rutinimi tamamladım',
    icon: 'moon',
    stage: 'learn',
    steps: [
      { id: 'teeth', label: 'Dişlerimi fırçaladım', stages: ['learn', 'practice'] },
      { id: 'tomorrow', label: 'Yarına hazırlandım', stages: ['learn', 'practice'] },
      { id: 'pajama', label: 'Pijamamı giydim', stages: ['learn'] },
      { id: 'story', label: 'Masal veya Kuran dinledim', stages: ['learn'] },
      { id: 'dua', label: 'Duamı yaptım', stages: ['learn', 'practice'] },
    ],
  },
};

// Daily core items, in the order they appear on Today.
// days: 'all' | 'weekday' | 'weekend'.  kind drives special rendering.
export const DEFAULT_ITEMS = [
  { id: 'morning', title: 'Sabah rutinim', kind: 'routine', days: 'all', icon: 'sun' },
  { id: 'homework', title: 'Okul ödevim', kind: 'homework', days: 'weekday', icon: 'pencil' },
  // Little Explorer is a daily English habit — the external app teaches, EPDS only records the day.
  // (Configs saved with days:'weekday' get daysNow:'all' once in migrate.js, effective from that day on — see schedule.daysFor.)
  { id: 'explorer', title: 'Little Explorer', subtitle: 'Bugünkü İngilizce çalışmamı yaptım', kind: 'simple', days: 'all', icon: 'compass' },
  { id: 'reading', title: '20 sayfa aile okuması', subtitle: 'Aile okuma zamanı', kind: 'simple', days: 'all', icon: 'book' },
  { id: 'quran', title: '3 ayet', kind: 'simple', days: 'all', icon: 'quran' },
  { id: 'prayer', title: 'Namaz', kind: 'simple', days: 'all', icon: 'prayer' },
  { id: 'physical', title: 'Daily Physical Five', subtitle: 'Beş hareket', kind: 'physical', days: 'all', icon: 'bolt' },
  { id: 'skill', title: 'Haftanın becerisi', kind: 'skill', days: 'all', icon: 'seed' },
  { id: 'presentation', title: 'Haftanın sunumu', kind: 'presentation', days: 'weekend', icon: 'mic' },
  { id: 'evening', title: 'Akşam rutinim', kind: 'routine', days: 'all', icon: 'moon' },
];

// Daily Physical Five. pattern[i] is the target for ISO weekday i (Mon=0).
export const DEFAULT_PHYSICAL = {
  exercises: [
    { id: 'pushup', name: 'Şınav', unit: 'tekrar', pattern: [5, 6, 5, 6, 5, 6, 5] },
    { id: 'plank', name: 'Plank', unit: 'saniye', pattern: [15, 20, 15, 20, 15, 20, 15] },
    { id: 'jumping', name: 'Jumping Jack', unit: 'tekrar', pattern: [15, 20, 15, 20, 15, 20, 15] },
    { id: 'squat', name: 'Squat', unit: 'tekrar', pattern: [8, 10, 8, 10, 8, 10, 8] },
    { id: 'hang', name: 'Bara Asılma', unit: 'saniye', pattern: [10, 15, 10, 15, 10, 15, 10] },
  ],
};

export const SKILL_STATUS = { LEARNING: 'learning', PRACTICING: 'practicing', MASTERED: 'mastered', POOL: 'pool' };
export const SKILL_STATUS_LABEL = { pool: 'Sırada', learning: 'Öğreniyorum', practicing: 'Çalışıyorum', mastered: 'Artık yapabiliyorum' };

export const DEFAULT_SKILL_POOL = [
  { id: 'bag', title: 'Çantamı hazırlıyorum', hint: 'Yarınki dersler için gerekenleri kendim koyuyorum.' },
  { id: 'bed', title: 'Yatağımı topluyorum', hint: 'Yorganı düzeltip yastığı yerine koyuyorum.' },
  { id: 'desk', title: 'Çalışma masamı düzenliyorum', hint: 'Kalemler kutuda, defterler rafta.' },
  { id: 'fold', title: 'Kıyafetlerimi katlıyorum', hint: 'Tişörtü ikiye, sonra tekrar ikiye.' },
  { id: 'table', title: 'Sofraya yardım ediyorum', hint: 'Tabakları ve bardakları taşıyorum.' },
  { id: 'room', title: 'Odamı düzenliyorum', hint: 'Oyuncaklar kutularına, kitaplar rafa.' },
  { id: 'clock', title: 'Saati kullanıyorum', hint: 'Saate bakıp ne zaman çıkacağımı söylüyorum.' },
  { id: 'tomorrow', title: 'Ertesi güne hazırlanıyorum', hint: 'Kıyafet, çanta ve su şişesi akşamdan hazır.' },
  { id: 'school_items', title: 'Okul eşyalarımı kontrol ediyorum', hint: 'Kalemlik, defter, beslenme — hepsi tamam mı?' },
  { id: 'money', title: 'Basit para kullanımı', hint: 'Küçük bir alışverişte parayı sayıp veriyorum.' },
  { id: 'exit', title: 'Evden çıkış kontrolü', hint: 'Ayakkabı, mont, çanta, anahtar — hazırım!' },
  { id: 'plan', title: 'Kendi mini planımı yapıyorum', hint: 'Bugün ne yapacağımı sıraya koyuyorum.' },
];

// Graduation evaluation — configurable in Parent Mode.
export const DEFAULT_GRADUATION = {
  windowDays: 14,           // observation window
  minCompletion: 0.8,       // completed / applicable
  minIndependent: 0.7,      // independent / applicable
  lastN: 5,                 // look at the last N executions…
  minNoReminder: 4,         // …at least this many must be independent
  minDaysObserved: 5,       // do not evaluate before this many observed days
  learningToPracticing: 5,  // completions before LEARNING → PRACTICING
  autoGraduate: false,      // true: graduate automatically; false: parent confirms
};

export const DEFAULT_REWARDS = {
  weekly: {
    title: 'Haftanın Seçimi',
    minGoodDays: 5,          // days with ≥ goodDayRatio of core items done
    requirePresentation: true,
    options: [
      'Aile film gecesi — filmi Emir seçer',
      'Aile oyun gecesi — oyunu Emir seçer',
      'Hafta sonu etkinliğini Emir seçer',
      'Kahvaltı menüsünü Emir seçer',
      'Baba/anne ile özel bir etkinlik',
    ],
  },
  monthly: {
    title: 'Ayın Kutlaması',
    minWeeklyUnlocks: 3,
    options: [
      'Yeni bir kitap',
      'Lego / oyuncak',
      'Müze gezisi',
      'Sinema',
      'Küçük bir gezi',
      'Özel aile deneyimi',
      'Kumbara katkısı',
    ],
  },
  goodDayRatio: 0.6,          // a "good day" = at least this share of core items done
};

export const DEFAULT_PRESENTATION = {
  targetMinutes: '3–5',
  topics: ['Dinozorlar', 'Ülkeler', 'Hayvanlar', 'Uzay', 'Bilim', 'Tarih', 'Doğa', 'Bu hafta öğrendiğim bir şey', 'Serbest seçim'],
  indicators: [
    { id: 'independent_prep', label: 'Daha bağımsız hazırlandı' },
    { id: 'clear', label: 'Daha net anlattı' },
    { id: 'questions', label: 'Sorulara cevap verdi' },
  ],
};

// Expedition: discoveries open for development milestones only — a skill
// graduated, a presentation given, a memory / English / monthly milestone
// (see core/expedition.js). Good days open nothing.
// Order matters — items are revealed sequentially, region by region.
export const DEFAULT_EXPEDITION = {
  regions: [
    { id: 'basecamp', name: 'Ana Kamp', tagline: 'Her keşif buradan başlar.', tone: 'warm' },
    { id: 'jurassic', name: 'Jura Vadisi', tagline: 'Dev otoburların yurdu.', tone: 'green' },
    { id: 'canyon', name: 'Fosil Kanyonu', tagline: 'Taşların içinde saklı hikâyeler.', tone: 'amber' },
    { id: 'coast', name: 'Kretase Kıyısı', tagline: 'Boynuzlular ve avcılar.', tone: 'blue' },
    { id: 'peaks', name: 'Kuzey Zirveleri', tagline: 'Buzun ve rüzgârın ülkesi.', tone: 'ice' },
  ],
  items: [
    // Base Camp
    { id: 'bc_map', region: 'basecamp', type: 'location', title: 'Keşif Haritası', fact: 'Her keşif bir gelişim anı: bir sunum, yeni bir beceri, güçlü bir hafıza.' },
    { id: 'bc_compass', region: 'basecamp', type: 'fossil', title: 'Pusula', fact: 'Kaşifler yönlerini pusulayla bulur. Kuzey her zaman aynı yerdedir.' },
    { id: 'bc_footprint', region: 'basecamp', type: 'fact', title: 'İlk Ayak İzi', fact: 'Biliyor muydun? Dinozor ayak izleri 100 milyon yıl boyunca taşta kalabilir.' },
    { id: 'bc_tent', region: 'basecamp', type: 'location', title: 'Kamp Çadırı', fact: 'Paleontologlar kazı alanında haftalarca çadırda kalır.' },
    // Jurassic Valley
    { id: 'jv_diplo', region: 'jurassic', type: 'card', dino: 'diplodocus', title: 'Diplodocus', fact: 'Boynu tek başına 8 metre uzunluğundaydı.' },
    { id: 'jv_brachio', region: 'jurassic', type: 'card', dino: 'brachiosaurus', title: 'Brachiosaurus', fact: '26 metre boyundaydı — 5 katlı bir bina kadar!' },
    { id: 'jv_mamen', region: 'jurassic', type: 'card', dino: 'mamenchisaurus', title: 'Mamenchisaurus', fact: 'Boynu vücudunun yarısından uzundu — bilinen en uzun boyunlu dinozorlardan biri.' },
    { id: 'jv_fern', region: 'jurassic', type: 'fossil', title: 'Eğrelti Fosili', fact: 'Jura döneminde ormanlar dev eğreltilerle doluydu.' },
    { id: 'jv_stego', region: 'jurassic', type: 'card', dino: 'stegosaurus', title: 'Stegosaurus', fact: 'Sırtındaki plakalar güneşte ısınmasına yardım ediyordu.' },
    { id: 'jv_allo', region: 'jurassic', type: 'card', dino: 'allosaurus', title: 'Allosaurus', fact: 'Jura döneminin en güçlü avcısıydı.' },
    { id: 'jv_lake', region: 'jurassic', type: 'location', title: 'Uzun Boyun Gölü', fact: 'Biliyor muydun? Otobur dinozorlar günde yüzlerce kilo bitki yerdi.' },
    // Fossil Canyon
    { id: 'fc_tooth', region: 'canyon', type: 'fossil', title: 'Avcı Dişi', fact: 'Et yiyen dinozorların dişleri testere gibi tırtıklıydı.' },
    { id: 'fc_egg', region: 'canyon', type: 'fossil', title: 'Dinozor Yumurtası', fact: 'En büyük dinozor yumurtası bir futbol topu kadardı.' },
    { id: 'fc_velo', region: 'canyon', type: 'card', dino: 'velociraptor', title: 'Velociraptor', fact: 'Bir hindi kadar küçüktü ama çok hızlı ve zekiydi.' },
    { id: 'fc_amber', region: 'canyon', type: 'fossil', title: 'Kehribar', fact: 'Kehribar, içinde böcek saklayabilen taşlaşmış reçinedir.' },
    { id: 'fc_dig', region: 'canyon', type: 'location', title: 'Kazı Alanı', fact: 'Paleontologlar fosilleri fırça ile milim milim temizler.' },
    { id: 'fc_ankylo', region: 'canyon', type: 'card', dino: 'ankylosaurus', title: 'Ankylosaurus', fact: 'Sırtı zırhlı, kuyruğu çekiç gibiydi.' },
    // Cretaceous Coast
    { id: 'cc_tri', region: 'coast', type: 'card', dino: 'triceratops', title: 'Triceratops', fact: 'Üç boynuzu 1 metreye kadar uzayabiliyordu.' },
    { id: 'cc_shell', region: 'coast', type: 'fossil', title: 'Ammonit', fact: 'Ammonitler dinozorlarla aynı dönemde denizlerde yaşayan sarmal kabuklulardı.' },
    { id: 'cc_ptero', region: 'coast', type: 'card', dino: 'pteranodon', title: 'Pteranodon', fact: 'Dinozor değil, uçan bir sürüngendi. Kanat açıklığı 7 metreydi.' },
    { id: 'cc_cliff', region: 'coast', type: 'location', title: 'Kıyı Kayalıkları', fact: 'Biliyor muydun? Kretase döneminde çiçekli bitkiler ilk kez ortaya çıktı.' },
    { id: 'cc_para', region: 'coast', type: 'card', dino: 'parasaurolophus', title: 'Parasaurolophus', fact: 'Başındaki boru gibi ibiği trompet sesi çıkarıyordu.' },
    { id: 'cc_trex', region: 'coast', type: 'card', dino: 'trex', title: 'T-Rex', fact: 'Isırma gücü 8 000 kilogramdı — tüm zamanların en ünlüsü.' },
    // Northern Peaks
    { id: 'np_snow', region: 'peaks', type: 'location', title: 'Kar Sınırı', fact: 'Bazı dinozorlar kutup bölgelerinde, karanlık kışlarda yaşadı.' },
    { id: 'np_feather', region: 'peaks', type: 'fossil', title: 'Tüy Fosili', fact: 'Birçok dinozorun tüyleri vardı. Kuşlar bugün yaşayan dinozorlardır!' },
    { id: 'np_spino', region: 'peaks', type: 'card', dino: 'spinosaurus', title: 'Spinosaurus', fact: 'Sırtındaki yelkenle yüzen bir dev avcıydı.' },
    { id: 'np_meteor', region: 'peaks', type: 'fact', title: 'Göktaşı', fact: 'Biliyor muydun? 66 milyon yıl önce dev bir göktaşı dinozor çağını bitirdi.' },
    { id: 'np_summit', region: 'peaks', type: 'location', title: 'Zirve', fact: 'Buraya kadar geldin. Gerçek bir kaşifsin.' },
  ],
  daysPerDiscovery: 2,      // LEGACY, no longer read by this build. Kept because Production ≤ 480750e shares /v2 and reads it (`|| 1`).
  // Threshold milestones (core/expedition.js → milestoneCounts). Each is a
  // whole discovery, like a graduation or a presentation. Counted only from
  // `expedition.milestonesSince` so an upgrade never releases a burst.
  // Pilot values — evaluated during real usage; no UI for them yet.
  milestones: {
    memoryDays: 7,           // complete daily-review days per discovery ("Hafızanı güçlü tuttun")
    englishDays: 10,         // Little Explorer study days per discovery
  },
};

export const DEFAULT_SETTINGS = {
  childName: 'Emir',
  parentPin: '',            // empty = parent mode is not PIN-protected yet
  weeklyMessage: '',        // optional custom message on My Week (empty = auto)
  appIcon: 'calendar',      // content/appIcons.js id — favicon + Ayarlar; the launcher icon stays the default
};

// ── Learning memory layer (books, memorization, memory project, reflection) ──
// Long-term personal history: dates and status, never points or scores.

export const BOOK_STATUS = { READING: 'READING', COMPLETED: 'COMPLETED' };
export const BOOK_STATUS_LABEL = { READING: 'Okuyorum', COMPLETED: 'Tamamladım' };

export const MEMO_TYPE = { SURA: 'SURA', POEM: 'POEM', SONG: 'SONG', OTHER: 'OTHER' };
export const MEMO_TYPE_LABEL = { SURA: 'Sure', POEM: 'Şiir', SONG: 'Şarkı', OTHER: 'Diğer' };
export const MEMO_STATUS = { LEARNING: 'LEARNING', MASTERED: 'MASTERED' };
export const MEMO_STATUS_LABEL = { LEARNING: 'Öğreniyorum', MASTERED: 'Ezberledim' };
export const MEMO_STATUS_LABEL_PARENT = { LEARNING: 'Öğreniliyor', MASTERED: 'Ezberlendi' };

// Review outcomes are separate from daily-task independence (see core/completion.js).
export const REVIEW_RESULT = { SELF: 'self', ASSISTED: 'assisted', NEEDS_WORK: 'needs_work' };
export const REVIEW_RESULT_LABEL = { self: 'Kendim okudum', assisted: 'Biraz yardım aldım', needs_work: 'Tekrar çalışmam gerekiyor' };

// Spaced-review suggestion. A suggestion, not a fixed algorithm: parents can
// change every number here and override any next-review date by hand.
export const DEFAULT_REVIEW = {
  intervals: [1, 3, 7, 14, 30], // days until the next review; "Kendim okudum" advances one step
  needsWorkDays: 1,             // "Tekrar çalışmam gerekiyor" → review again after this many days
  dailyTarget: 3,               // Daily Review Pool: how many pool items Today asks for (parent-editable, 1…pool size)
};

// Memory health — three calm words derived from the schedule and the last
// outcome (core/dailyReview.js). Not a score, not a second algorithm.
export const HEALTH = { STRONG: 'strong', REFRESH: 'refresh', TODAY: 'today' };
export const HEALTH_LABEL = { strong: 'Sağlam', refresh: 'Tazelenmeli', today: 'Bugün çalış' };

export const PROJECT_STATUS = { ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED', REPLACED: 'REPLACED' };
export const PROJECT_STATUS_LABEL = { ACTIVE: 'Devam ediyor', COMPLETED: 'Tamamlandı', REPLACED: 'Değiştirildi' };
export const PROJECT_TYPE = { POEM: 'POEM', SONG: 'SONG', TEXT: 'TEXT', PASSAGE: 'PASSAGE', FREE: 'FREE' };
export const PROJECT_TYPE_LABEL = { POEM: 'Kısa şiir', SONG: 'Sevdiği bir şarkı', TEXT: 'Kısa metin', PASSAGE: 'Seçilmiş bölüm', FREE: 'Serbest seçim' };

// "Haftamı Düşünüyorum" — at most three prompts, every one optional.
export const REFLECTION_PROMPTS = [
  { id: 'own', q: 'Bu hafta hangi işi kendim yaptım?' },
  { id: 'learned', q: 'Bu hafta öğrendiğim en güzel şey neydi?' },
  { id: 'next', q: 'Gelecek hafta neyi daha iyi yapmak istiyorum?' },
];
