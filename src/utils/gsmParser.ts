import { normalizeTurkishAscii } from '../constants/provinces';
import {
  formatDriverUpperCase,
  formatGsmNumber,
  formatLicensePlate,
  parseRawClipboardGrid,
  VehicleEntry,
} from './excelParser';

export const MAX_GSM_EXCEL_ROWS = 1000;

export interface GsmColumnMapping {
  soforIndex: number;
  gsmIndex: number;
  plakaIndex: number; // -1 if no PLAKA column exists in Table 2
}

export interface ParsedGsmRow {
  rowNumber: number;
  cells: string[];
  soforRaw: string;
  soforKey: string;
  soforUpper: string;
  plakaFormatted: string;
  gsmRaw: string;
  gsmFormatted: string;
  isValidGsm: boolean;
  isMatched: boolean;
}

export interface GsmAnalysisResult {
  hasHeader: boolean;
  headers: string[];
  columnCount: number;
  totalPastedDataRows: number;
  wasTruncated: boolean;
  detectedMapping: GsmColumnMapping;
  activeMapping: GsmColumnMapping;
  rows: ParsedGsmRow[];
}

export function normalizeDriverMatchKey(name: string): string {
  if (!name) return '';
  return normalizeTurkishAscii(name)
    .replace(/[^a-z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function looksLikeTurkishMobile(raw: string): boolean {
  if (!raw || !raw.trim()) return false;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('905')) return true;
  if (digits.length === 11 && digits.startsWith('05')) return true;
  if (digits.length === 10 && digits.startsWith('5')) return true;
  return /(?:\+90|0090|0)?\s*\(?(5\d{2})\)?[\s\-./]*(\d{3})[\s\-./]*(\d{2})[\s\-./]*(\d{2})/.test(
    raw
  );
}

const GSM_HEADER_KEYWORDS = new Set([
  'sofor', 'surucu', 'ad', 'adi', 'soyad', 'soyadi', 'isim', 'personel', 'kaptan',
  'gsm', 'tel', 'telefon', 'cep', 'iletisim', 'numara', 'no', 'plaka', 'arac',
  'sira', 'firma', 'bolge', 'tc', 'dorse', 'not', 'aciklama',
]);

function detectGsmHeaderRow(firstRow: string[]): boolean {
  // If any cell in the first row already looks like a real mobile phone number, it's a data row, not a header!
  if (firstRow.some((cell) => looksLikeTurkishMobile(cell))) {
    return false;
  }
  let hits = 0;
  for (const cell of firstRow) {
    const norm = normalizeTurkishAscii(cell);
    const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.some((t) => GSM_HEADER_KEYWORDS.has(t))) {
      hits++;
    }
  }
  return hits >= 1;
}

function scoreSoforColHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (tokens.includes('gsm') || tokens.includes('tel') || tokens.includes('telefon') || tokens.includes('numara')) {
    return -10;
  }
  if (
    norm === 'sofor' ||
    norm === 'surucu' ||
    norm === 'ad soyad' ||
    norm === 'adi soyadi' ||
    norm === 'sofor adi' ||
    norm === 'sofor ad soyad' ||
    norm === 'surucu adi' ||
    norm === 'surucu ad soyad' ||
    norm === 'isim soyisim' ||
    norm === 'isim'
  ) {
    return 100;
  }
  if (
    tokens.includes('sofor') ||
    tokens.includes('surucu') ||
    tokens.includes('soyad') ||
    tokens.includes('soyadi') ||
    tokens.includes('isim') ||
    tokens.includes('personel') ||
    tokens.includes('kaptan')
  ) {
    return 85;
  }
  if (tokens.includes('ad') || tokens.includes('adi')) {
    return 70;
  }
  return 0;
}

function scoreGsmColHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (
    norm === 'gsm' ||
    norm === 'gsm no' ||
    norm === 'telefon' ||
    norm === 'tel' ||
    norm === 'cep' ||
    norm === 'cep tel' ||
    norm === 'cep telefonu' ||
    norm === 'sofor gsm' ||
    norm === 'surucu gsm' ||
    norm === 'sofor tel' ||
    norm === 'iletisim' ||
    norm === 'numara'
  ) {
    return 100;
  }
  if (
    tokens.includes('gsm') ||
    tokens.includes('telefon') ||
    tokens.includes('tel') ||
    tokens.includes('cep') ||
    tokens.includes('iletisim')
  ) {
    return 85;
  }
  return 0;
}

function scorePlakaColHeader(norm: string, tokens: string[]): number {
  if (!norm) return 0;
  if (tokens.includes('dorse') || tokens.includes('romork')) return 5;
  if (norm === 'plaka' || norm === 'arac plaka' || norm === 'cekici plaka') return 100;
  if (tokens.includes('plaka')) return 85;
  return 0;
}

const PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|8[01])[A-ZÇĞİÖŞÜa-zçğıöşü]{1,4}\d{2,5}$/;

function detectGsmColumnsFromData(dataRows: string[][], colCount: number): GsmColumnMapping {
  const sample = dataRows.slice(0, 50);

  let bestGsm = Math.min(1, colCount - 1);
  let bestGsmHits = -1;

  let bestPlaka = -1;
  let bestPlakaHits = 0;

  for (let c = 0; c < colCount; c++) {
    let gsmHits = 0;
    let plateHits = 0;
    for (const row of sample) {
      const val = row[c] || '';
      if (!val) continue;
      if (looksLikeTurkishMobile(val)) gsmHits++;
      if (PLATE_REGEX.test(val.replace(/[\s-]+/g, ''))) plateHits++;
    }
    if (gsmHits > bestGsmHits) {
      bestGsmHits = gsmHits;
      bestGsm = c;
    }
    if (plateHits > bestPlakaHits && plateHits >= 2) {
      bestPlakaHits = plateHits;
      bestPlaka = c;
    }
  }

  let bestSofor = 0;
  let bestSoforHits = -1;
  for (let c = 0; c < colCount; c++) {
    if (c === bestGsm || c === bestPlaka) continue;
    let nameHits = 0;
    for (const row of sample) {
      const val = row[c] || '';
      if (/[A-Za-zÇĞİÖŞÜçğıöşü]{2,}\s+[A-Za-zÇĞİÖŞÜçğıöşü]{2,}/.test(val)) {
        nameHits++;
      }
    }
    if (nameHits > bestSoforHits) {
      bestSoforHits = nameHits;
      bestSofor = c;
    }
  }

  if (bestSofor === bestGsm && colCount > 1) {
    bestSofor = (bestGsm + 1) % colCount;
  }

  return {
    soforIndex: bestSofor,
    gsmIndex: bestGsm,
    plakaIndex: bestPlaka !== bestSofor && bestPlaka !== bestGsm ? bestPlaka : -1,
  };
}

export function detectGsmColumnMapping(
  hasHeader: boolean,
  headers: string[],
  dataRows: string[][],
  colCount: number
): GsmColumnMapping {
  const heuristic = detectGsmColumnsFromData(dataRows, colCount);
  if (!hasHeader) {
    return heuristic;
  }

  let soforIndex = -1;
  let bestSofor = 0;

  let gsmIndex = -1;
  let bestGsm = 0;

  let plakaIndex = -1;
  let bestPlaka = 0;

  headers.forEach((h, idx) => {
    const norm = normalizeTurkishAscii(h);
    const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);

    const sScore = scoreSoforColHeader(norm, tokens);
    if (sScore > bestSofor) {
      bestSofor = sScore;
      soforIndex = idx;
    }

    const gScore = scoreGsmColHeader(norm, tokens);
    if (gScore > bestGsm) {
      bestGsm = gScore;
      gsmIndex = idx;
    }

    const pScore = scorePlakaColHeader(norm, tokens);
    if (pScore > bestPlaka) {
      bestPlaka = pScore;
      plakaIndex = idx;
    }
  });

  const resolvedGsm = gsmIndex >= 0 ? gsmIndex : heuristic.gsmIndex;
  let resolvedSofor = soforIndex >= 0 ? soforIndex : heuristic.soforIndex;
  if (resolvedSofor === resolvedGsm && colCount > 1) {
    resolvedSofor = (resolvedGsm + 1) % colCount;
  }

  const candidatePlaka = plakaIndex >= 0 ? plakaIndex : heuristic.plakaIndex;
  const resolvedPlaka =
    candidatePlaka >= 0 && candidatePlaka !== resolvedGsm && candidatePlaka !== resolvedSofor
      ? candidatePlaka
      : -1;

  return {
    soforIndex: resolvedSofor,
    gsmIndex: resolvedGsm,
    plakaIndex: resolvedPlaka,
  };
}

export function analyzeGsmExcelText(
  rawText: string,
  customMapping?: Partial<GsmColumnMapping> | null
): GsmAnalysisResult {
  const grid = parseRawClipboardGrid(rawText);
  if (grid.length === 0) {
    const fallback: GsmColumnMapping = { soforIndex: 1, gsmIndex: 2, plakaIndex: 0 };
    return {
      hasHeader: false,
      headers: ['1. Sütun', '2. Sütun', '3. Sütun'],
      columnCount: 3,
      totalPastedDataRows: 0,
      wasTruncated: false,
      detectedMapping: fallback,
      activeMapping: fallback,
      rows: [],
    };
  }

  const maxColsInGrid = grid.reduce((max, r) => Math.max(max, r.length), 0);
  const columnCount = Math.max(maxColsInGrid, 2);

  const hasHeader = grid.length > 1 && detectGsmHeaderRow(grid[0]);
  const rawHeaders = hasHeader
    ? Array.from({ length: columnCount }, (_, i) => grid[0][i] || `${i + 1}. Sütun`)
    : Array.from({ length: columnCount }, (_, i) => `${i + 1}. Sütun`);

  const allDataRows = hasHeader ? grid.slice(1) : grid;
  const totalPastedDataRows = allDataRows.length;
  const wasTruncated = totalPastedDataRows > MAX_GSM_EXCEL_ROWS;
  const cappedRows = allDataRows.slice(0, MAX_GSM_EXCEL_ROWS);

  const detectedMapping = detectGsmColumnMapping(hasHeader, rawHeaders, cappedRows, columnCount);
  const activeMapping: GsmColumnMapping = {
    soforIndex:
      customMapping?.soforIndex !== undefined && customMapping.soforIndex < columnCount
        ? customMapping.soforIndex
        : detectedMapping.soforIndex,
    gsmIndex:
      customMapping?.gsmIndex !== undefined && customMapping.gsmIndex < columnCount
        ? customMapping.gsmIndex
        : detectedMapping.gsmIndex,
    plakaIndex:
      customMapping?.plakaIndex !== undefined && customMapping.plakaIndex < columnCount
        ? customMapping.plakaIndex
        : detectedMapping.plakaIndex,
  };

  const rows: ParsedGsmRow[] = cappedRows.map((rawRow, idx) => {
    const paddedCells = Array.from({ length: columnCount }, (_, c) => rawRow[c] || '');
    const soforRaw = paddedCells[activeMapping.soforIndex] || '';
    const gsmRaw = paddedCells[activeMapping.gsmIndex] || '';
    const plakaRaw = activeMapping.plakaIndex >= 0 ? paddedCells[activeMapping.plakaIndex] || '' : '';

    const gsmFormatted = formatGsmNumber(gsmRaw);
    const isValidGsm = Boolean(gsmFormatted);

    return {
      rowNumber: idx + 1,
      cells: paddedCells,
      soforRaw,
      soforKey: normalizeDriverMatchKey(soforRaw),
      soforUpper: formatDriverUpperCase(soforRaw),
      plakaFormatted: formatLicensePlate(plakaRaw),
      gsmRaw,
      gsmFormatted,
      isValidGsm,
      isMatched: false,
    };
  });

  return {
    hasHeader,
    headers: rawHeaders,
    columnCount,
    totalPastedDataRows,
    wasTruncated,
    detectedMapping,
    activeMapping,
    rows,
  };
}

/**
 * Enriches vehicles extracted from Table 1 using driver GSM records from Table 2,
 * and marks which rows in Table 2 matched an active vehicle.
 */
export function matchVehiclesWithGsmTable(
  vehicles: VehicleEntry[],
  gsmAnalysis: GsmAnalysisResult
): {
  enrichedVehicles: VehicleEntry[];
  rowsWithMatchFlags: ParsedGsmRow[];
  matchedVehicleCount: number;
} {
  if (gsmAnalysis.rows.length === 0) {
    return {
      enrichedVehicles: vehicles,
      rowsWithMatchFlags: gsmAnalysis.rows,
      matchedVehicleCount: 0,
    };
  }

  const matchedRowIndices = new Set<number>();
  let matchedVehicleCount = 0;

  const enrichedVehicles = vehicles.map((vehicle) => {
    const vDriverKey = normalizeDriverMatchKey(vehicle.surucu);
    const vPlate = vehicle.plaka;

    let matchedRowIdx = -1;

    // 1. Tam sürücü adı eşleşmesi (varsa aynı plakayı önceliklendir)
    if (vDriverKey) {
      for (let i = 0; i < gsmAnalysis.rows.length; i++) {
        const r = gsmAnalysis.rows[i];
        if (!r.gsmFormatted) continue;
        if (r.soforKey === vDriverKey) {
          matchedRowIdx = i;
          if (vPlate && r.plakaFormatted === vPlate) {
            break;
          }
        }
      }
    }

    // 2. Plaka eşleşmesi (2. tabloda plaka sütunu varsa)
    if (matchedRowIdx < 0 && vPlate) {
      for (let i = 0; i < gsmAnalysis.rows.length; i++) {
        const r = gsmAnalysis.rows[i];
        if (!r.gsmFormatted) continue;
        if (r.plakaFormatted && r.plakaFormatted === vPlate) {
          matchedRowIdx = i;
          break;
        }
      }
    }

    // 3. Esnek isim-soyisim alt küme eşleşmesi (ör. "MEHMET ÇAYIR" <-> "MEHMET REŞAT ÇAYIR", tekil eşleşme varsa)
    if (matchedRowIdx < 0 && vDriverKey) {
      const vTokens = vDriverKey.split(' ').filter((t) => t.length >= 2);
      if (vTokens.length >= 2) {
        const candidates: number[] = [];
        for (let i = 0; i < gsmAnalysis.rows.length; i++) {
          const r = gsmAnalysis.rows[i];
          if (!r.gsmFormatted || !r.soforKey) continue;
          const rTokens = r.soforKey.split(' ').filter((t) => t.length >= 2);
          if (rTokens.length < 2) continue;

          const vInR = vTokens.every((t) => rTokens.includes(t));
          const rInV = rTokens.every((t) => vTokens.includes(t));
          if (vInR || rInV) {
            candidates.push(i);
          }
        }
        if (candidates.length === 1) {
          matchedRowIdx = candidates[0];
        }
      }
    }

    if (matchedRowIdx >= 0) {
      matchedRowIndices.add(matchedRowIdx);
      matchedVehicleCount++;
      const matchedRow = gsmAnalysis.rows[matchedRowIdx];
      return {
        ...vehicle,
        gsm: matchedRow.gsmFormatted,
        surucu: vehicle.surucu || matchedRow.soforUpper,
      };
    }

    return vehicle;
  });

  const rowsWithMatchFlags = gsmAnalysis.rows.map((row, idx) => ({
    ...row,
    isMatched: matchedRowIndices.has(idx),
  }));

  return {
    enrichedVehicles,
    rowsWithMatchFlags,
    matchedVehicleCount,
  };
}
