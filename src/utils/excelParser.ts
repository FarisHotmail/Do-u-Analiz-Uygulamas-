import {
  analyzeProvinceCell,
  IncludedProvince,
  looksLikeProvinceValue,
  normalizeTurkishAscii,
  ProvinceCellAnalysis,
} from '../constants/provinces';

export const MAX_EXCEL_ROWS = 150;
export const EXPECTED_EXCEL_COLS = 11;
export const TARGET_FIRMA_KEYWORD = 'ENLOG';

export interface ColumnMapping {
  firmaIndex: number;
  ilIndex: number;
  plakaIndex: number;
  soforIndex: number;
  gsmIndex: number; // -1 when no separate GSM column is present/selected
}

export type EffectiveRowDisposition = 'DAHIL' | 'HARIC_IL' | 'HARIC_FIRMA' | 'DIGER';

export interface ParsedExcelRow {
  rowNumber: number;
  cells: string[];
  firmaRaw: string;
  isEnlog: boolean;
  ilRaw: string;
  plakaFormatted: string;
  surucuFormatted: string;
  gsmExtracted: string;
  analysis: ProvinceCellAnalysis;
  disposition: EffectiveRowDisposition;
}

export interface VehicleEntry {
  id: string;
  plaka: string;
  guzergah: string;
  includedProvinces: IncludedProvince[];
  surucu: string;
  gsm: string;
  sourceRows: number[];
}

export interface ExcelAnalysisResult {
  hasHeader: boolean;
  headers: string[];
  columnCount: number;
  totalPastedDataRows: number;
  wasTruncated: boolean;
  detectedMapping: ColumnMapping;
  activeMapping: ColumnMapping;
  rows: ParsedExcelRow[];
  vehiclesMerged: VehicleEntry[];
  vehiclesUnmerged: VehicleEntry[];
  provinceCounts: Record<string, number>;
}

/**
 * Checks whether the FİRMA cell matches ENLOG (case-insensitive, Turkish-normalized).
 */
export function matchesTargetFirma(rawFirma: string): boolean {
  if (!rawFirma || !rawFirma.trim()) return false;
  const norm = normalizeTurkishAscii(rawFirma);
  if (norm === 'enlog') return true;
  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.includes('enlog');
}

/**
 * Parses Excel TSV (Tab-Separated Values) clipboard text accurately,
 * preserving multi-line cells quoted by Excel ("...").
 */
export function parseRawClipboardGrid(rawText: string): string[][] {
  if (!rawText || !rawText.trim()) return [];

  const normalizedInput = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const hasTabs = normalizedInput.includes('\t');
  const delimiter = hasTabs ? '\t' : normalizedInput.includes(';') ? ';' : '\t';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < normalizedInput.length; i++) {
    const ch = normalizedInput[i];
    const nextCh = normalizedInput[i + 1];

    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"' && currentCell.length === 0) {
        inQuotes = true;
      } else if (ch === delimiter) {
        currentRow.push(cleanCellText(currentCell));
        currentCell = '';
      } else if (ch === '\n') {
        currentRow.push(cleanCellText(currentCell));
        currentCell = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += ch;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(cleanCellText(currentCell));
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function cleanCellText(cell: string): string {
  return cell.replace(/\s+/g, ' ').trim();
}

const HEADER_KEYWORDS = new Set([
  'il', 'ili', 'sehir', 'plaka', 'sofor', 'surucu', 'tarih', 'sira', 'no',
  'firma', 'firmasi', 'musteri', 'irsaliye', 'tonaj', 'dorse', 'aciklama', 'ilce',
  'guzergah', 'bolge', 'depo', 'bayi', 'yuk', 'saat', 'durum', 'gsm', 'tel', 'telefon', 'nakliye',
]);

function detectHeaderRow(firstRow: string[]): boolean {
  let headerHits = 0;
  for (const cell of firstRow) {
    const norm = normalizeTurkishAscii(cell);
    const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.some((t) => HEADER_KEYWORDS.has(t))) {
      headerHits++;
    }
  }
  return headerHits >= 2;
}

function scoreFirmaHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (norm === 'firma' || norm === 'firmasi') {
    return 100;
  }
  if (
    norm === 'nakliye firmasi' ||
    norm === 'tasiyici firma' ||
    norm === 'lojistik firma' ||
    norm === 'nakliyeci'
  ) {
    return 95;
  }
  if (tokens.includes('firma') || tokens.includes('firmasi')) {
    return 85;
  }
  if (tokens.includes('nakliyeci') || tokens.includes('tasiyici')) {
    return 70;
  }
  return 0;
}

function scoreIlHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (
    tokens.includes('ilce') ||
    tokens.includes('ilcesi') ||
    tokens.includes('iletisim') ||
    tokens.includes('irsaliye') ||
    tokens.includes('sicil')
  ) {
    return -10;
  }
  if (norm === 'il' || norm === 'ili' || norm === 'varis ili' || norm === 'sevk ili' || norm === 'teslim ili') {
    return 100;
  }
  if (norm === 'sehir' || norm === 'guzergah') {
    return 90;
  }
  if (tokens.includes('il') || tokens.includes('ili') || tokens.includes('sehir')) {
    return 75;
  }
  return 0;
}

function scorePlakaHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (tokens.includes('dorse') || tokens.includes('romork')) {
    return 10;
  }
  if (norm === 'plaka' || norm === 'arac plaka' || norm === 'arac plakasi' || norm === 'cekici plaka') {
    return 100;
  }
  if (tokens.includes('plaka') || tokens.includes('plakasi')) {
    return 85;
  }
  if (norm === 'arac') {
    return 50;
  }
  return 0;
}

function scoreSoforHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (tokens.includes('gsm') || tokens.includes('tel') || tokens.includes('telefon')) {
    if (norm === 'sofor' || norm === 'surucu') return 100;
    return 20;
  }
  if (norm === 'sofor' || norm === 'surucu' || norm === 'sofor adi' || norm === 'surucu adi') {
    return 100;
  }
  if (tokens.includes('sofor') || tokens.includes('surucu') || tokens.includes('kaptan')) {
    return 85;
  }
  return 0;
}

function scoreGsmHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (tokens.includes('musteri') || tokens.includes('firma') || tokens.includes('bayi') || tokens.includes('alici')) {
    return -10;
  }
  if (
    norm === 'gsm' ||
    norm === 'gsm no' ||
    norm === 'sofor gsm' ||
    norm === 'surucu gsm' ||
    norm === 'sofor tel' ||
    norm === 'surucu tel' ||
    norm === 'cep' ||
    norm === 'cep tel' ||
    norm === 'telefon' ||
    norm === 'tel'
  ) {
    return 100;
  }
  if (tokens.includes('gsm') || tokens.includes('telefon') || tokens.includes('tel')) {
    return 80;
  }
  return 0;
}

const PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|8[01])\s*[A-ZÇĞİÖŞÜa-zçğıöşü]{1,4}\s*\d{2,5}$/;

function detectColumnsFromData(dataRows: string[][], colCount: number): ColumnMapping {
  const sample = dataRows.slice(0, 40);

  let bestFirma = 0;
  let bestFirmaScore = -1;

  let bestIl = 0;
  let bestIlScore = -1;

  let bestPlaka = Math.min(1, colCount - 1);
  let bestPlakaScore = -1;

  for (let c = 0; c < colCount; c++) {
    let enlogHits = 0;
    let provinceHits = 0;
    let plateHits = 0;

    for (const row of sample) {
      const val = row[c] || '';
      if (!val) continue;
      if (matchesTargetFirma(val)) enlogHits++;
      if (looksLikeProvinceValue(val)) provinceHits++;
      if (PLATE_REGEX.test(val.replace(/[\s-]/g, ''))) plateHits++;
    }

    if (enlogHits > bestFirmaScore) {
      bestFirmaScore = enlogHits;
      bestFirma = c;
    }
    if (provinceHits > bestIlScore) {
      bestIlScore = provinceHits;
      bestIl = c;
    }
    if (plateHits > bestPlakaScore) {
      bestPlakaScore = plateHits;
      bestPlaka = c;
    }
  }

  if (bestPlaka === bestIl && colCount > 1) {
    bestPlaka = (bestIl + 1) % colCount;
  }

  if (bestFirmaScore <= 0) {
    // Fallback to first unused column if no ENLOG cell was seen in headerless data
    for (let c = 0; c < colCount; c++) {
      if (c !== bestIl && c !== bestPlaka) {
        bestFirma = c;
        break;
      }
    }
  }

  let bestSofor = 0;
  let bestSoforScore = -1;
  for (let c = 0; c < colCount; c++) {
    if (c === bestIl || c === bestPlaka || c === bestFirma) continue;
    let nameHits = 0;
    for (const row of sample) {
      const val = row[c] || '';
      if (
        /^[A-Za-zÇĞİÖŞÜçğıöşü\s.\-()0-9/+]{5,50}$/.test(val) &&
        /[A-Za-zÇĞİÖŞÜçğıöşü]{2,}\s+[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/.test(val)
      ) {
        nameHits++;
      }
    }
    if (nameHits > bestSoforScore) {
      bestSoforScore = nameHits;
      bestSofor = c;
    }
  }

  return {
    firmaIndex: bestFirma,
    ilIndex: bestIl,
    plakaIndex: bestPlaka,
    soforIndex: bestSofor,
    gsmIndex: -1,
  };
}

export function detectColumnMapping(
  hasHeader: boolean,
  headers: string[],
  dataRows: string[][],
  colCount: number
): ColumnMapping {
  if (!hasHeader) {
    return detectColumnsFromData(dataRows, colCount);
  }

  const heuristic = detectColumnsFromData(dataRows, colCount);

  let firmaIndex = -1;
  let bestFirma = 0;

  let ilIndex = -1;
  let bestIl = 0;

  let plakaIndex = -1;
  let bestPlaka = 0;

  let soforIndex = -1;
  let bestSofor = 0;

  let gsmIndex = -1;
  let bestGsm = 0;

  headers.forEach((h, idx) => {
    const norm = normalizeTurkishAscii(h);
    const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);

    const firmaScore = scoreFirmaHeader(norm, tokens);
    if (firmaScore > bestFirma) {
      bestFirma = firmaScore;
      firmaIndex = idx;
    }

    const ilScore = scoreIlHeader(norm, tokens);
    if (ilScore > bestIl) {
      bestIl = ilScore;
      ilIndex = idx;
    }

    const plakaScore = scorePlakaHeader(norm, tokens);
    if (plakaScore > bestPlaka) {
      bestPlaka = plakaScore;
      plakaIndex = idx;
    }

    const soforScore = scoreSoforHeader(norm, tokens);
    if (soforScore > bestSofor) {
      bestSofor = soforScore;
      soforIndex = idx;
    }

    const gsmScore = scoreGsmHeader(norm, tokens);
    if (gsmScore > bestGsm) {
      bestGsm = gsmScore;
      gsmIndex = idx;
    }
  });

  const resolvedFirma = firmaIndex >= 0 ? firmaIndex : heuristic.firmaIndex;
  let resolvedIl = ilIndex >= 0 ? ilIndex : heuristic.ilIndex;
  if (resolvedIl === resolvedFirma && colCount > 1) {
    resolvedIl = (resolvedFirma + 1) % colCount;
  }

  let resolvedPlaka = plakaIndex >= 0 ? plakaIndex : heuristic.plakaIndex;
  if ((resolvedPlaka === resolvedIl || resolvedPlaka === resolvedFirma) && colCount > 2) {
    for (let c = 0; c < colCount; c++) {
      if (c !== resolvedFirma && c !== resolvedIl) {
        resolvedPlaka = c;
        break;
      }
    }
  }

  let resolvedSofor = soforIndex >= 0 ? soforIndex : heuristic.soforIndex;
  if (
    resolvedSofor === resolvedIl ||
    resolvedSofor === resolvedPlaka ||
    resolvedSofor === resolvedFirma
  ) {
    for (let c = 0; c < colCount; c++) {
      if (c !== resolvedFirma && c !== resolvedIl && c !== resolvedPlaka) {
        resolvedSofor = c;
        break;
      }
    }
  }

  const resolvedGsm =
    gsmIndex >= 0 &&
    gsmIndex !== resolvedFirma &&
    gsmIndex !== resolvedIl &&
    gsmIndex !== resolvedPlaka &&
    gsmIndex !== resolvedSofor
      ? gsmIndex
      : -1;

  return {
    firmaIndex: resolvedFirma,
    ilIndex: resolvedIl,
    plakaIndex: resolvedPlaka,
    soforIndex: resolvedSofor,
    gsmIndex: resolvedGsm,
  };
}

/**
 * Formats Turkish license plates compactly without spaces in uppercase: e.g. "35BHF355"
 */
export function formatLicensePlate(raw: string): string {
  const cleaned = raw.trim().toLocaleUpperCase('tr-TR');
  if (!cleaned) return '';
  return cleaned.replace(/[\s-]+/g, '');
}

/**
 * Formats GSM numbers without leading 0 as "5XX XXX XX XX": e.g. "544 417 22 87"
 */
export function formatGsmNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');
  let tenDigits = '';
  if (digits.length === 12 && digits.startsWith('905')) {
    tenDigits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('05')) {
    tenDigits = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith('5')) {
    tenDigits = digits;
  }

  if (tenDigits.length === 10) {
    return `${tenDigits.slice(0, 3)} ${tenDigits.slice(3, 6)} ${tenDigits.slice(6, 8)} ${tenDigits.slice(8, 10)}`;
  }

  const phoneRegex = /(?:\+90|0090|0)?\s*\(?(5\d{2})\)?[\s\-./]*(\d{3})[\s\-./]*(\d{2})[\s\-./]*(\d{2})/;
  const match = trimmed.match(phoneRegex);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return trimmed;
}

export function formatDriverUpperCase(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
}

/**
 * Extracts driver name (UPPERCASE) and GSM ("5XX XXX XX XX") from ŞOFÖR cell (and optional GSM cell).
 */
export function extractDriverAndGsm(
  rawSofor: string,
  rawGsmCol?: string
): { surucu: string; gsm: string } {
  const phoneRegex = /(?:\+90|0090|0)?\s*\(?(5\d{2})\)?[\s\-./]*(\d{3})[\s\-./]*(\d{2})[\s\-./]*(\d{2})/;

  let gsm = '';
  let driverText = rawSofor || '';

  const matchInSofor = driverText.match(phoneRegex);
  if (matchInSofor) {
    gsm = `${matchInSofor[1]} ${matchInSofor[2]} ${matchInSofor[3]} ${matchInSofor[4]}`;
    driverText = driverText
      .replace(matchInSofor[0], '')
      .replace(/[\-–—/:|()[\]]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!gsm && rawGsmCol && rawGsmCol.trim()) {
    gsm = formatGsmNumber(rawGsmCol);
  }

  return {
    surucu: formatDriverUpperCase(driverText),
    gsm,
  };
}

export function analyzeExcelText(
  rawText: string,
  customMapping?: Partial<ColumnMapping> | null
): ExcelAnalysisResult {
  const grid = parseRawClipboardGrid(rawText);
  if (grid.length === 0) {
    const fallbackMapping: ColumnMapping = {
      firmaIndex: 3,
      ilIndex: 5,
      plakaIndex: 7,
      soforIndex: 9,
      gsmIndex: -1,
    };
    return {
      hasHeader: false,
      headers: Array.from({ length: EXPECTED_EXCEL_COLS }, (_, i) => `${i + 1}. Sütun`),
      columnCount: EXPECTED_EXCEL_COLS,
      totalPastedDataRows: 0,
      wasTruncated: false,
      detectedMapping: fallbackMapping,
      activeMapping: fallbackMapping,
      rows: [],
      vehiclesMerged: [],
      vehiclesUnmerged: [],
      provinceCounts: {},
    };
  }

  const maxColsInGrid = grid.reduce((max, r) => Math.max(max, r.length), 0);
  const columnCount = Math.max(maxColsInGrid, 4);

  const hasHeader = grid.length > 1 && detectHeaderRow(grid[0]);
  const rawHeaders = hasHeader
    ? Array.from({ length: columnCount }, (_, i) => grid[0][i] || `${i + 1}. Sütun`)
    : Array.from({ length: columnCount }, (_, i) => `${i + 1}. Sütun`);

  const allDataRows = hasHeader ? grid.slice(1) : grid;
  const totalPastedDataRows = allDataRows.length;
  const wasTruncated = totalPastedDataRows > MAX_EXCEL_ROWS;
  const cappedDataRows = allDataRows.slice(0, MAX_EXCEL_ROWS);

  const detectedMapping = detectColumnMapping(hasHeader, rawHeaders, cappedDataRows, columnCount);
  const activeMapping: ColumnMapping = {
    firmaIndex:
      customMapping?.firmaIndex !== undefined && customMapping.firmaIndex < columnCount
        ? customMapping.firmaIndex
        : detectedMapping.firmaIndex,
    ilIndex:
      customMapping?.ilIndex !== undefined && customMapping.ilIndex < columnCount
        ? customMapping.ilIndex
        : detectedMapping.ilIndex,
    plakaIndex:
      customMapping?.plakaIndex !== undefined && customMapping.plakaIndex < columnCount
        ? customMapping.plakaIndex
        : detectedMapping.plakaIndex,
    soforIndex:
      customMapping?.soforIndex !== undefined && customMapping.soforIndex < columnCount
        ? customMapping.soforIndex
        : detectedMapping.soforIndex,
    gsmIndex:
      customMapping?.gsmIndex !== undefined && customMapping.gsmIndex < columnCount
        ? customMapping.gsmIndex
        : detectedMapping.gsmIndex,
  };

  const provinceCounts: Record<string, number> = {};
  const parsedRows: ParsedExcelRow[] = [];
  const vehiclesUnmerged: VehicleEntry[] = [];

  interface PlateGroup {
    plaka: string;
    orderedStops: string[];
    includedProvinces: IncludedProvince[];
    surucu: string;
    gsm: string;
    sourceRows: number[];
  }
  const plateGroups = new Map<string, PlateGroup>();

  cappedDataRows.forEach((rawRow, idx) => {
    const paddedCells = Array.from({ length: columnCount }, (_, c) => rawRow[c] || '');
    const firmaRaw = paddedCells[activeMapping.firmaIndex] || '';
    const isEnlog = matchesTargetFirma(firmaRaw);

    const ilRaw = paddedCells[activeMapping.ilIndex] || '';
    const plakaRaw = paddedCells[activeMapping.plakaIndex] || '';
    const soforRaw = paddedCells[activeMapping.soforIndex] || '';
    const gsmRaw = activeMapping.gsmIndex >= 0 ? paddedCells[activeMapping.gsmIndex] || '' : '';

    const plakaFormatted = formatLicensePlate(plakaRaw);
    const { surucu, gsm } = extractDriverAndGsm(soforRaw, gsmRaw);
    const analysis = analyzeProvinceCell(ilRaw);
    const rowNumber = idx + 1;

    let disposition: EffectiveRowDisposition;
    if (!isEnlog) {
      disposition = 'HARIC_FIRMA';
    } else if (analysis.status === 'DAHIL') {
      disposition = 'DAHIL';
    } else if (analysis.status === 'HARIC') {
      disposition = 'HARIC_IL';
    } else {
      disposition = 'DIGER';
    }

    // Yalnızca FİRMA = ENLOG olan satırlar il sayaçlarına ve araç listesine dahil edilir
    if (isEnlog) {
      for (const inc of analysis.matchedIncluded) {
        provinceCounts[inc] = (provinceCounts[inc] || 0) + 1;
      }
      for (const exc of analysis.matchedExcluded) {
        provinceCounts[exc] = (provinceCounts[exc] || 0) + 1;
      }
    }

    parsedRows.push({
      rowNumber,
      cells: paddedCells,
      firmaRaw,
      isEnlog,
      ilRaw,
      plakaFormatted,
      surucuFormatted: surucu,
      gsmExtracted: gsm,
      analysis,
      disposition,
    });

    if (!isEnlog) {
      return;
    }

    const rowStops =
      analysis.orderedUpperStops.length > 0
        ? analysis.orderedUpperStops
        : ilRaw.trim()
          ? [ilRaw.trim().toLocaleUpperCase('tr-TR')]
          : [];

    if (analysis.status === 'DAHIL') {
      const guzergahText = rowStops.join('-');
      vehiclesUnmerged.push({
        id: `row-${rowNumber}-${plakaFormatted || idx}`,
        plaka: plakaFormatted,
        guzergah: guzergahText,
        includedProvinces: [...analysis.matchedIncluded],
        surucu,
        gsm,
        sourceRows: [rowNumber],
      });
    }

    const mergeKey = plakaFormatted || `noplate-row-${rowNumber}`;
    const existing = plateGroups.get(mergeKey);
    if (existing) {
      for (const stop of rowStops) {
        if (!existing.orderedStops.includes(stop)) {
          existing.orderedStops.push(stop);
        }
      }
      for (const inc of analysis.matchedIncluded) {
        if (!existing.includedProvinces.includes(inc)) {
          existing.includedProvinces.push(inc);
        }
      }
      if (!existing.surucu && surucu) existing.surucu = surucu;
      if (!existing.gsm && gsm) existing.gsm = gsm;
      existing.sourceRows.push(rowNumber);
    } else {
      plateGroups.set(mergeKey, {
        plaka: plakaFormatted,
        orderedStops: [...rowStops],
        includedProvinces: [...analysis.matchedIncluded],
        surucu,
        gsm,
        sourceRows: [rowNumber],
      });
    }
  });

  const vehiclesMerged: VehicleEntry[] = [];
  for (const [key, group] of plateGroups.entries()) {
    if (group.includedProvinces.length > 0) {
      vehiclesMerged.push({
        id: `plate-${key}`,
        plaka: group.plaka,
        guzergah: group.orderedStops.join('-'),
        includedProvinces: group.includedProvinces,
        surucu: group.surucu,
        gsm: group.gsm,
        sourceRows: group.sourceRows,
      });
    }
  }

  return {
    hasHeader,
    headers: rawHeaders,
    columnCount,
    totalPastedDataRows,
    wasTruncated,
    detectedMapping,
    activeMapping,
    rows: parsedRows,
    vehiclesMerged,
    vehiclesUnmerged,
    provinceCounts,
  };
}
