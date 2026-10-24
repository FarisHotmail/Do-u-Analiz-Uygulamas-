export const EXCLUDED_PROVINCES = [
  'Şanlıurfa',
  'Gaziantep',
  'Kahramanmaraş',
  'Malatya',
  'Elazığ',
  'Adıyaman',
] as const;

export const INCLUDED_PROVINCES = [
  'Batman',
  'Bingöl',
  'Bitlis',
  'Diyarbakır',
  'Mardin',
  'Muş',
  'Siirt',
  'Şırnak',
  'Tunceli',
  'Van',
] as const;

export type ExcludedProvince = (typeof EXCLUDED_PROVINCES)[number];
export type IncludedProvince = (typeof INCLUDED_PROVINCES)[number];

export type RowMatchStatus = 'DAHIL' | 'HARIC' | 'DIGER' | 'BOS';

export function normalizeTurkishAscii(input: string): string {
  if (!input) return '';
  return input
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase()
    .trim();
}

interface ProvinceDef {
  display: string;
  upper: string;
  category: 'DAHIL' | 'HARIC' | 'DIGER';
  tokens: string[];
}

const ALL_PROVINCES: ProvinceDef[] = [
  // DAHİL (10 il)
  { display: 'Batman', upper: 'BATMAN', category: 'DAHIL', tokens: ['batman'] },
  { display: 'Bingöl', upper: 'BİNGÖL', category: 'DAHIL', tokens: ['bingol'] },
  { display: 'Bitlis', upper: 'BİTLİS', category: 'DAHIL', tokens: ['bitlis'] },
  { display: 'Diyarbakır', upper: 'DİYARBAKIR', category: 'DAHIL', tokens: ['diyarbakir', 'dbakir'] },
  { display: 'Mardin', upper: 'MARDİN', category: 'DAHIL', tokens: ['mardin'] },
  { display: 'Muş', upper: 'MUŞ', category: 'DAHIL', tokens: ['mus'] },
  { display: 'Siirt', upper: 'SİİRT', category: 'DAHIL', tokens: ['siirt'] },
  { display: 'Şırnak', upper: 'ŞIRNAK', category: 'DAHIL', tokens: ['sirnak'] },
  { display: 'Tunceli', upper: 'TUNCELİ', category: 'DAHIL', tokens: ['tunceli', 'dersim'] },
  { display: 'Van', upper: 'VAN', category: 'DAHIL', tokens: ['van'] },

  // HARİÇ (6 il)
  { display: 'Şanlıurfa', upper: 'ŞANLIURFA', category: 'HARIC', tokens: ['sanliurfa', 'urfa', 'surfa'] },
  { display: 'Gaziantep', upper: 'GAZİANTEP', category: 'HARIC', tokens: ['gaziantep', 'antep', 'gantep'] },
  { display: 'Kahramanmaraş', upper: 'KAHRAMANMARAŞ', category: 'HARIC', tokens: ['kahramanmaras', 'maras', 'kmaras'] },
  { display: 'Malatya', upper: 'MALATYA', category: 'HARIC', tokens: ['malatya'] },
  { display: 'Elazığ', upper: 'ELAZIĞ', category: 'HARIC', tokens: ['elazig'] },
  { display: 'Adıyaman', upper: 'ADIYAMAN', category: 'HARIC', tokens: ['adiyaman'] },

  // DİĞER İLLER (65 il - çoklu güzergah yazımlarında tam güzergah ismini korumak için)
  { display: 'Adana', upper: 'ADANA', category: 'DIGER', tokens: ['adana'] },
  { display: 'Afyonkarahisar', upper: 'AFYONKARAHİSAR', category: 'DIGER', tokens: ['afyonkarahisar', 'afyon'] },
  { display: 'Ağrı', upper: 'AĞRI', category: 'DIGER', tokens: ['agri'] },
  { display: 'Aksaray', upper: 'AKSARAY', category: 'DIGER', tokens: ['aksaray'] },
  { display: 'Amasya', upper: 'AMASYA', category: 'DIGER', tokens: ['amasya'] },
  { display: 'Ankara', upper: 'ANKARA', category: 'DIGER', tokens: ['ankara'] },
  { display: 'Antalya', upper: 'ANTALYA', category: 'DIGER', tokens: ['antalya'] },
  { display: 'Ardahan', upper: 'ARDAHAN', category: 'DIGER', tokens: ['ardahan'] },
  { display: 'Artvin', upper: 'ARTVİN', category: 'DIGER', tokens: ['artvin'] },
  { display: 'Aydın', upper: 'AYDIN', category: 'DIGER', tokens: ['aydin'] },
  { display: 'Balıkesir', upper: 'BALIKESİR', category: 'DIGER', tokens: ['balikesir'] },
  { display: 'Bartın', upper: 'BARTIN', category: 'DIGER', tokens: ['bartin'] },
  { display: 'Bayburt', upper: 'BAYBURT', category: 'DIGER', tokens: ['bayburt'] },
  { display: 'Bilecik', upper: 'BİLECİK', category: 'DIGER', tokens: ['bilecik'] },
  { display: 'Bolu', upper: 'BOLU', category: 'DIGER', tokens: ['bolu'] },
  { display: 'Burdur', upper: 'BURDUR', category: 'DIGER', tokens: ['burdur'] },
  { display: 'Bursa', upper: 'BURSA', category: 'DIGER', tokens: ['bursa'] },
  { display: 'Çanakkale', upper: 'ÇANAKKALE', category: 'DIGER', tokens: ['canakkale'] },
  { display: 'Çankırı', upper: 'ÇANKIRI', category: 'DIGER', tokens: ['cankiri'] },
  { display: 'Çorum', upper: 'ÇORUM', category: 'DIGER', tokens: ['corum'] },
  { display: 'Denizli', upper: 'DENİZLİ', category: 'DIGER', tokens: ['denizli'] },
  { display: 'Düzce', upper: 'DÜZCE', category: 'DIGER', tokens: ['duzce'] },
  { display: 'Edirne', upper: 'EDİRNE', category: 'DIGER', tokens: ['edirne'] },
  { display: 'Erzincan', upper: 'ERZİNCAN', category: 'DIGER', tokens: ['erzincan'] },
  { display: 'Erzurum', upper: 'ERZURUM', category: 'DIGER', tokens: ['erzurum'] },
  { display: 'Eskişehir', upper: 'ESKİŞEHİR', category: 'DIGER', tokens: ['eskisehir'] },
  { display: 'Giresun', upper: 'GİRESUN', category: 'DIGER', tokens: ['giresun'] },
  { display: 'Gümüşhane', upper: 'GÜMÜŞHANE', category: 'DIGER', tokens: ['gumushane'] },
  { display: 'Hakkari', upper: 'HAKKARİ', category: 'DIGER', tokens: ['hakkari'] },
  { display: 'Hatay', upper: 'HATAY', category: 'DIGER', tokens: ['hatay'] },
  { display: 'Iğdır', upper: 'IĞDIR', category: 'DIGER', tokens: ['igdir'] },
  { display: 'Isparta', upper: 'ISPARTA', category: 'DIGER', tokens: ['isparta'] },
  { display: 'İstanbul', upper: 'İSTANBUL', category: 'DIGER', tokens: ['istanbul'] },
  { display: 'İzmir', upper: 'İZMİR', category: 'DIGER', tokens: ['izmir'] },
  { display: 'Karabük', upper: 'KARABÜK', category: 'DIGER', tokens: ['karabuk'] },
  { display: 'Karaman', upper: 'KARAMAN', category: 'DIGER', tokens: ['karaman'] },
  { display: 'Kars', upper: 'KARS', category: 'DIGER', tokens: ['kars'] },
  { display: 'Kastamonu', upper: 'KASTAMONU', category: 'DIGER', tokens: ['kastamonu'] },
  { display: 'Kayseri', upper: 'KAYSERİ', category: 'DIGER', tokens: ['kayseri'] },
  { display: 'Kilis', upper: 'KİLİS', category: 'DIGER', tokens: ['kilis'] },
  { display: 'Kırıkkale', upper: 'KIRIKKALE', category: 'DIGER', tokens: ['kirikkale'] },
  { display: 'Kırklareli', upper: 'KIRKLARELİ', category: 'DIGER', tokens: ['kirklareli'] },
  { display: 'Kırşehir', upper: 'KIRŞEHİR', category: 'DIGER', tokens: ['kirsehir'] },
  { display: 'Kocaeli', upper: 'KOCAELİ', category: 'DIGER', tokens: ['kocaeli'] },
  { display: 'Konya', upper: 'KONYA', category: 'DIGER', tokens: ['konya'] },
  { display: 'Kütahya', upper: 'KÜTAHYA', category: 'DIGER', tokens: ['kutahya'] },
  { display: 'Manisa', upper: 'MANİSA', category: 'DIGER', tokens: ['manisa'] },
  { display: 'Mersin', upper: 'MERSİN', category: 'DIGER', tokens: ['mersin', 'icel'] },
  { display: 'Muğla', upper: 'MUĞLA', category: 'DIGER', tokens: ['mugla'] },
  { display: 'Nevşehir', upper: 'NEVŞEHİR', category: 'DIGER', tokens: ['nevsehir'] },
  { display: 'Niğde', upper: 'NİĞDE', category: 'DIGER', tokens: ['nigde'] },
  { display: 'Ordu', upper: 'ORDU', category: 'DIGER', tokens: ['ordu'] },
  { display: 'Osmaniye', upper: 'OSMANİYE', category: 'DIGER', tokens: ['osmaniye'] },
  { display: 'Rize', upper: 'RİZE', category: 'DIGER', tokens: ['rize'] },
  { display: 'Sakarya', upper: 'SAKARYA', category: 'DIGER', tokens: ['sakarya'] },
  { display: 'Samsun', upper: 'SAMSUN', category: 'DIGER', tokens: ['samsun'] },
  { display: 'Sinop', upper: 'SİNOP', category: 'DIGER', tokens: ['sinop'] },
  { display: 'Sivas', upper: 'SİVAS', category: 'DIGER', tokens: ['sivas'] },
  { display: 'Tekirdağ', upper: 'TEKİRDAĞ', category: 'DIGER', tokens: ['tekirdag'] },
  { display: 'Tokat', upper: 'TOKAT', category: 'DIGER', tokens: ['tokat'] },
  { display: 'Trabzon', upper: 'TRABZON', category: 'DIGER', tokens: ['trabzon'] },
  { display: 'Uşak', upper: 'UŞAK', category: 'DIGER', tokens: ['usak'] },
  { display: 'Yalova', upper: 'YALOVA', category: 'DIGER', tokens: ['yalova'] },
  { display: 'Yozgat', upper: 'YOZGAT', category: 'DIGER', tokens: ['yozgat'] },
  { display: 'Zonguldak', upper: 'ZONGULDAK', category: 'DIGER', tokens: ['zonguldak'] },
];

const TOKEN_TO_PROVINCE = new Map<string, ProvinceDef>();
for (const prov of ALL_PROVINCES) {
  for (const token of prov.tokens) {
    TOKEN_TO_PROVINCE.set(token, prov);
  }
}

export interface ProvinceCellAnalysis {
  status: RowMatchStatus;
  matchedIncluded: IncludedProvince[];
  matchedExcluded: ExcludedProvince[];
  orderedUpperStops: string[];
}

export function analyzeProvinceCell(rawCell: string): ProvinceCellAnalysis {
  const trimmed = rawCell.trim();
  if (!trimmed) {
    return {
      status: 'BOS',
      matchedIncluded: [],
      matchedExcluded: [],
      orderedUpperStops: [],
    };
  }

  // Collapse dotted abbreviations like "K.Maraş" -> "kmaras", "Ş.Urfa" -> "surfa", "G.Antep" -> "gantep", "D.Bakır" -> "dbakir"
  const preCleaned = normalizeTurkishAscii(trimmed).replace(/\b([ksgd])\.([a-z]+)/g, '$1$2');
  const wordTokens = preCleaned.split(/[^a-z]+/).filter(Boolean);

  const matchedIncluded: IncludedProvince[] = [];
  const matchedExcluded: ExcludedProvince[] = [];
  const orderedUpperStops: string[] = [];

  for (const token of wordTokens) {
    const prov = TOKEN_TO_PROVINCE.get(token);
    if (!prov) continue;

    if (!orderedUpperStops.includes(prov.upper)) {
      orderedUpperStops.push(prov.upper);
    }

    if (prov.category === 'DAHIL') {
      const inc = prov.display as IncludedProvince;
      if (!matchedIncluded.includes(inc)) {
        matchedIncluded.push(inc);
      }
    } else if (prov.category === 'HARIC') {
      const exc = prov.display as ExcludedProvince;
      if (!matchedExcluded.includes(exc)) {
        matchedExcluded.push(exc);
      }
    }
  }

  if (matchedIncluded.length > 0) {
    return {
      status: 'DAHIL',
      matchedIncluded,
      matchedExcluded,
      orderedUpperStops,
    };
  }

  if (matchedExcluded.length > 0) {
    return {
      status: 'HARIC',
      matchedIncluded: [],
      matchedExcluded,
      orderedUpperStops,
    };
  }

  return {
    status: 'DIGER',
    matchedIncluded: [],
    matchedExcluded: [],
    orderedUpperStops,
  };
}

export function looksLikeProvinceValue(rawCell: string): boolean {
  const analysis = analyzeProvinceCell(rawCell);
  return analysis.orderedUpperStops.length > 0;
}
