// Dinosaur atlas content — the knowledge layer behind the Expedition.
//
// Structure follows the family's own presentation ("Emir Yavuz'un Sunum
// Serileri · Seri 1: Dinozorlar"): one card per species with the same six
// facts (Boy · Ağırlık · Beslenme · Dönem · Yaşadığı · Özellik) and a
// "Biliyor muydun?", plus the general slides as Keşif Notları.
//
// This is reference content only. It opens nothing, counts nothing and is
// never written to state: discoveries stay in content/defaults.js and
// core/expedition.js. Species are keyed by the `dino` kind used by the
// expedition items (ui/dinos.js DINO_KINDS). `source` records where a card's
// facts come from: 'pptx' = the presentation (numbers copied verbatim),
// 'general' = species the presentation did not cover. Those carry only
// qualitative facts (diet, trait) and copy without figures; size, weight,
// era and region are `null` until the family adds a sourced card, and the
// UI hides them with a quiet "hazırlanıyor" line. No unsourced numbers.

export const PERIODS = [
  { id: 'triyas', label: 'Triyas', range: '230–200 milyon yıl önce', blurb: 'İlk dinozorlar! Küçük ve hızlıydılar — neredeyse tavuk büyüklüğünde.' },
  { id: 'jura', label: 'Jura', range: '200–145 milyon yıl önce', blurb: 'Dev sauropodların dönemi. Diplodocus ve Brachiosaurus burada yaşadı.' },
  { id: 'kretase', label: 'Kretase', range: '145–66 milyon yıl önce', blurb: 'T-Rex zamanı! Çiçekli bitkiler ilk kez açtı; dinozorlar en son bu dönemde yok oldu.' },
];
export const PERIOD_LABEL = Object.fromEntries(PERIODS.map((p) => [p.id, p.label]));

export const SPECIES = {
  trex: {
    name: 'T-Rex', period: 'kretase', source: 'pptx',
    tagline: 'Tüm zamanların en ünlü avcısı.',
    stats: { size: '12–13 m', weight: '8–14 ton', diet: 'Et — en büyük kara avcısı', era: 'Kretase (68–66 milyon yıl önce)', region: 'Kuzey Amerika', trait: '60 cm dişler, 57.000 N ısırık' },
    didYouKnow: 'Kolları küçücük ama çenesi devasa güçlü! Bir ısırığı 57.000 Newton — bugün yaşayan hiçbir kara hayvanı bu kadar sert ısıramaz.',
    summary: 'Tyrannosaurus rex, Kretase döneminin sonunda Kuzey Amerika\'da yaşadı. Devasa kafası, muz büyüklüğündeki dişleri ve güçlü arka bacaklarıyla çağının en büyük kara avcısıydı. Küçük kolları hâlâ bilim insanlarını meraklandırıyor.',
  },
  triceratops: {
    name: 'Triceratops', period: 'kretase', source: 'pptx',
    tagline: 'Üç boynuzlu, kalkanlı kahraman.',
    stats: { size: '8–9 m', weight: '6–12 ton', diet: 'Sadece bitki', era: 'Kretase (68–66 milyon yıl önce)', region: 'Kuzey Amerika', trait: '3 boynuz + dev boyun kalkanı' },
    didYouKnow: 'Boynuzlarıyla T-Rex\'e meydan okurdu! Gerçek bir kahraman — ikisi aynı yerde, aynı dönemde yaşadı.',
    summary: 'Triceratops, Kretase\'nin son otoburlarından biriydi. Bir metreye kadar uzayan iki kaş boynuzu ve burnundaki üçüncü boynuzla kendini korur, papağan gagasına benzeyen ağzıyla sert bitkileri koparırdı. Dev boyun kalkanı onu kolay tanınan bir dinozor yapar.',
  },
  diplodocus: {
    name: 'Diplodocus', period: 'jura', source: 'pptx',
    tagline: 'Kamçı kuyruklu uzun boyunlu.',
    stats: { size: '25–27 m', weight: '10–16 ton', diet: 'Sadece bitki', era: 'Jura (155–145 milyon yıl önce)', region: 'Kuzey Amerika', trait: 'Çok uzun kuyruk ve boyun' },
    didYouKnow: 'Kuyruğunu kamçı gibi sallardı — kuyruk ucunun ses hızına ulaştığı düşünülüyor!',
    summary: 'Diplodocus, Jura döneminin en uzun dinozorlarından biriydi. Boynu tek başına 8 metre uzunluğundaydı; ince, uzun kuyruğu ise vücudunun yarısından fazlasını oluşturuyordu. Sürüler hâlinde dolaşır, günde yüzlerce kilo bitki yerdi.',
  },
  spinosaurus: {
    name: 'Spinosaurus', period: 'kretase', source: 'pptx',
    tagline: 'Yelkenli, yüzen dev avcı.',
    stats: { size: '14–18 m', weight: '7–20 ton', diet: 'Et ve balık — etçil', era: 'Kretase (100–95 milyon yıl önce)', region: 'Kuzey Afrika', trait: 'Sırtında 1,65 m dikenler' },
    didYouKnow: 'Hem karada hem suda avlanırdı! T-Rex\'ten bile büyük olabilir.',
    summary: 'Spinosaurus, sırtındaki dev yelkeni ve timsaha benzeyen uzun çenesiyle bilinen bir avcıydı. Kuzey Afrika\'nın nehirlerinde balık yakalayarak yaşadı; suda yüzebilen ilk bilinen dinozor olduğu düşünülüyor.',
  },
  mamenchisaurus: {
    name: 'Mamenchisaurus', period: 'jura', source: 'pptx',
    tagline: 'En uzun boyunlu dinozor.',
    stats: { size: '26–35 m', weight: '20–30 ton', diet: 'Sadece bitki', era: 'Jura (160–145 milyon yıl önce)', region: 'Çin', trait: 'Boynu vücudunun yarısı kadar' },
    didYouKnow: 'Tüm dinozorlar içinde en uzun boyunlu! Boynu 15 metreye kadar uzanabilirdi — bir otobüs boyu sadece boyun!',
    summary: 'Mamenchisaurus, Jura döneminde bugünkü Çin\'de yaşadı. Boynu vücudunun yarısı kadardı ve 19\'a kadar boyun omuru vardı — çoğu sauropodun çok üstünde. Bu sayede yerinden kıpırdamadan geniş bir alandaki yaprakları yiyebilirdi.',
  },
  brachiosaurus: {
    name: 'Brachiosaurus', period: 'jura', source: 'general',
    tagline: 'Zürafa gibi dimdik dev.',
    stats: { size: null, weight: null, diet: 'Sadece bitki', era: null, region: null, trait: 'Ön bacakları arka bacaklarından uzun' },
    didYouKnow: 'Başını çok yukarı kaldırabilirdi — ağaçların en tepesindeki yapraklara bakacak kadar!',
    summary: 'Brachiosaurus, çoğu sauropodun aksine ön bacakları daha uzun olduğu için zürafa gibi dimdik dururdu. Ağaçların en tepesindeki yaprakları yerdi; adı "kol kertenkelesi" anlamına gelir.',
  },
  stegosaurus: {
    name: 'Stegosaurus', period: 'jura', source: 'general',
    tagline: 'Plakalı sırt, dikenli kuyruk.',
    stats: { size: null, weight: null, diet: 'Sadece bitki', era: null, region: null, trait: 'Sırt plakaları ve dikenli kuyruk' },
    didYouKnow: 'Beyni gövdesine göre çok küçüktü — ama koca gövdesini gayet iyi idare ediyordu!',
    summary: 'Stegosaurus\'un sırtında iki sıra kemik plaka, kuyruğunun ucunda ise dört uzun diken vardı. Plakaların güneşte ısınmasına ve kendini göstermesine yardım ettiği düşünülüyor; dikenler avcılara karşı gerçek bir silahtı.',
  },
  allosaurus: {
    name: 'Allosaurus', period: 'jura', source: 'general',
    tagline: 'Jura\'nın en güçlü avcısı.',
    stats: { size: null, weight: null, diet: 'Et', era: null, region: null, trait: 'Gözlerinin üstünde küçük boynuzlar' },
    didYouKnow: 'Ağzını çok geniş açabiliyordu — üst çenesini balta gibi aşağı indirerek avlanırdı!',
    summary: 'Allosaurus, T-Rex\'ten çok daha önce, Jura döneminde yaşayan bir avcıydı. Üç parmaklı güçlü kolları ve kıvrık pençeleriyle Stegosaurus gibi büyük otoburları avlardı. Jura döneminin en tanınan büyük etçillerinden biridir.',
  },
  velociraptor: {
    name: 'Velociraptor', period: 'kretase', source: 'general',
    tagline: 'Küçük, hızlı ve zeki.',
    stats: { size: null, weight: null, diet: 'Et', era: null, region: null, trait: 'Ayağında orak gibi kıvrık pençe' },
    didYouKnow: 'Tüyleri vardı ve bir hindi büyüklüğündeydi — filmlerdeki dev hâli gerçek değil!',
    summary: 'Velociraptor, Kretase döneminde çöllerde yaşayan tüylü bir avcıydı. Her ayağındaki büyük orak pençe onun en ünlü özelliğidir. Küçük ama çevik ve zekiydi; bugünkü kuşların en yakın akrabalarından biridir.',
  },
  ankylosaurus: {
    name: 'Ankylosaurus', period: 'kretase', source: 'general',
    tagline: 'Zırhlı tank, çekiç kuyruk.',
    stats: { size: null, weight: null, diet: 'Sadece bitki', era: null, region: null, trait: 'Kemik zırh + kuyruk topuzu' },
    didYouKnow: 'Kuyruğundaki kemik topuzla bir T-Rex\'in bacağını kırabileceği düşünülüyor!',
    summary: 'Ankylosaurus\'un sırtı, boynu ve hatta göz kapakları kemik plakalarla kaplıydı. Kuyruğunun ucundaki ağır topuz onu çağının en iyi korunan hayvanı yaptı. Alçak bitkileri yer, tehlikede yere yapışırdı.',
  },
  pteranodon: {
    name: 'Pteranodon', period: 'kretase', source: 'general',
    tagline: 'Dinozor değil, uçan sürüngen.',
    stats: { size: null, weight: null, diet: 'Balık', era: null, region: null, trait: 'Dişsiz gaga ve uzun kafa ibiği' },
    didYouKnow: 'Adı "dişsiz kanat" demek — balıkları dişsiz gagasıyla yakalardı ve aslında bir dinozor değildi!',
    summary: 'Pteranodon, dinozorlarla aynı dönemde yaşayan bir pterozordu — yani uçan bir sürüngen. Kanat açıklığı bir küçük uçak kadar geniş, kemikleri ise içi boş ve hafifti. Denizin üstünde süzülerek balık avlardı.',
  },
  parasaurolophus: {
    name: 'Parasaurolophus', period: 'kretase', source: 'general',
    tagline: 'Trompet sesli ördek gagalı.',
    stats: { size: null, weight: null, diet: 'Sadece bitki', era: null, region: null, trait: 'Başında boru gibi içi boş ibik' },
    didYouKnow: 'İbiğinin içi boş borularla doluydu — trompet gibi derin sesler çıkarabiliyordu!',
    summary: 'Parasaurolophus, ördek gagalı dinozorlardandı. Başının arkasına uzanan içi boş ibiğini sürüsüyle konuşmak için kullanırdı; bilim insanları bu ibiğin sesini bilgisayarda yeniden üretti. Hem iki hem dört ayak üstünde yürüyebilirdi.',
  },
};

/** Labels for the six facts, in the presentation's order. */
export const STAT_LABEL = { size: 'Boy', weight: 'Ağırlık', diet: 'Beslenme', era: 'Dönem', region: 'Yaşadığı yer', trait: 'Özellik' };
export const STAT_KEYS = Object.keys(STAT_LABEL);

/** Species card for a dino kind, or null when the atlas has nothing for it. */
export const species = (kind) => SPECIES[kind] || null;

/** Stat keys a card leaves `null` (unsourced) — the sheet hides these and says so once. */
export const missingStats = (sp) => STAT_KEYS.filter((k) => sp.stats[k] == null);

/** Keşif Notları — the presentation's general slides as short learning cards. */
export const FIELD_NOTES = [
  {
    id: 'what', title: 'Dinozor nedir?', kicker: 'Temel bilgi',
    teaser: 'Büyük sürüngenler, düz bacaklar, yumurtalar — ve bugün hâlâ aramızda olan torunları.',
    points: [
      { head: 'Büyük sürüngenler', text: 'Dev, güçlü ve çok farklı türde hayvanların genel adıdır. Sürüngenler sınıfındandırlar.' },
      { head: 'Bacakları altlarında', text: 'Bacaklar tam altlarında düz durur — timsah gibi yana değil! Bu onları hızlı ve güçlü kıldı.' },
      { head: 'Yumurtadan doğarlar', text: 'Tüm dinozorlar yumurtadan çıkar. Bazılarının yumurtası bir futbol topu kadar büyüktü.' },
      { head: 'Kuşlar torunları', text: 'Bugünkü kuşlar dinozorların torunlarıdır. Yani kuşlar aslında küçük dinozorlardır!' },
    ],
  },
  {
    id: 'origin', title: 'Nasıl ortaya çıktılar?', kicker: 'Başlangıç',
    teaser: '230 milyon yıl önce, tek bir dev kıtada, tavuk büyüklüğünde başladılar.',
    points: [
      { head: '230 milyon yıl önce', text: 'Triyas Dönemi\'nde ortaya çıktılar. İlk dinozorlar neredeyse tavuk büyüklüğündeydi!' },
      { head: 'Tek kıta: Pangea', text: 'O zamanlar tüm kıtalar birleşikti — tek bir dev kara vardı: Pangea. Sonra yavaşça ayrıldı.' },
      { head: 'Güçlü nefes sistemi', text: 'Diğer hayvanlara göre çok daha iyi nefes alıyorlardı. Bu onları güçlü ve dayanıklı kıldı.' },
      { head: 'Hızla çeşitlendiler', text: 'Milyonlarca yılda yüzlerce farklı tür ortaya çıktı — devlerden cücelere kadar!' },
    ],
  },
  {
    id: 'eras', title: 'Üç büyük dönem', kicker: 'Triyas · Jura · Kretase',
    teaser: 'Dinozorlar tam 165 milyon yıl boyunca yaşadı — insanlık sadece 300.000 yıldır var.',
    points: [
      { head: 'Triyas · 230–200 milyon yıl önce', text: 'İlk dinozorlar! Küçük ve hızlıydılar.' },
      { head: 'Jura · 200–145 milyon yıl önce', text: 'Diplodocus dönemi! Dev sauropodlar yeryüzünü sarstı.' },
      { head: 'Kretase · 145–66 milyon yıl önce', text: 'T-Rex zamanı! Dinozorlar en son bu dönemde yok oldu.' },
      { head: 'Bugün', text: 'Sen varsın! Dinozorlar 66 milyon yıl önce gitti; kuşlar hâlâ burada.' },
    ],
    closing: 'Dinozorlar tam 165 milyon yıl boyunca yaşadı — insanlık sadece 300.000 yıldır var!',
  },
  {
    id: 'world', title: 'Dinozorlar yaşarken dünya', kicker: 'O zamanki gezegen',
    teaser: 'Çok sıcak, çok nemli, dev bitkilerle dolu bir dünya — kutuplarda bile orman vardı.',
    points: [
      { head: 'Çok sıcak ve nemli', text: 'Dünya bugünden çok daha sıcaktı! Kutuplarda bile buz yoktu — orada da ormanlar vardı.' },
      { head: 'Dev bitkiler', text: 'Eğreltiotları ve palmiyeler devasa boyutlara ulaşırdı. Çiçekli bitkiler yeni yeni çıkıyordu.' },
      { head: 'Başka canlılar da vardı', text: 'Pterozorlar uçuyor, dev deniz sürüngenleri yüzüyor, ilk memeliler gizleniyordu.' },
      { head: 'Denizler yüksekti', text: 'Buzullar olmadığı için denizler yüksekti. Bugünkü bazı kara alanları suyun altındaydı!' },
    ],
  },
  {
    id: 'extinction', title: 'Nasıl yok oldular?', kicker: '66 milyon yıl önce', numbered: true,
    teaser: 'Dev bir göktaşı, yangınlar, kararan güneş — ve hayatta kalan küçük tüylü dinozorlar.',
    points: [
      { head: 'Dev göktaşı çarptı', text: '10 km büyüklüğünde bir göktaşı 66 milyon yıl önce bugünkü Meksika\'ya çarptı.' },
      { head: 'Korkunç yangınlar', text: 'Tüm dünyada dev yangınlar başladı. Dünya alevler içinde kaldı.' },
      { head: 'Güneş karardı', text: 'Yıllarca toz bulutu gökyüzünü kapattı. Bitkiler yok oldu.' },
      { head: 'Soğuk ve açlık', text: 'Bitkisiz kalan hayvanlar yavaş yavaş açlıktan öldü.' },
      { head: 'Kuşlar kurtuldu!', text: 'Küçük tüylü dinozorlardan gelen kuşlar hayatta kaldı — hâlâ buradalar!' },
    ],
  },
];

export const fieldNote = (id) => FIELD_NOTES.find((n) => n.id === id) || null;
