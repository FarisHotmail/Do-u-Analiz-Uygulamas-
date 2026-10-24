/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IncludedProvince } from './constants/provinces';
import { SAMPLE_EXCEL_TSV, SAMPLE_GSM_EXCEL_TSV } from './data/sampleExcelData';
import { analyzeExcelText, ColumnMapping } from './utils/excelParser';
import {
  analyzeGsmExcelText,
  GsmColumnMapping,
  matchVehiclesWithGsmTable,
} from './utils/gsmParser';
import { ProvinceSidebar } from './components/ProvinceSidebar';
import {
  formatVehiclePlainText,
  VehicleFieldOverrides,
  VehicleOutputList,
} from './components/VehicleOutputList';
import { ExcelPastePanel } from './components/ExcelPastePanel';
import { GsmPastePanel } from './components/GsmPastePanel';

export default function App() {
  // 1. Tablo: Sevkiyat Tablosu (FİRMA=ENLOG, İL, PLAKA, ŞOFÖR)
  const [rawExcelText, setRawExcelText] = useState<string>('');
  const [customMapping, setCustomMapping] = useState<Partial<ColumnMapping> | null>(null);

  // 2. Tablo: Sürücü GSM Tablosu (ŞOFÖR / PLAKA -> GSM)
  const [rawGsmExcelText, setRawGsmExcelText] = useState<string>('');
  const [customGsmMapping, setCustomGsmMapping] = useState<Partial<GsmColumnMapping> | null>(null);

  const [mergeSamePlates, setMergeSamePlates] = useState<boolean>(true);
  const [selectedProvince, setSelectedProvince] = useState<IncludedProvince | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [overrides, setOverrides] = useState<Record<string, VehicleFieldOverrides>>({});
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const pasteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gsmPasteTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const shipmentAnalysis = useMemo(
    () => analyzeExcelText(rawExcelText, customMapping),
    [rawExcelText, customMapping]
  );

  const gsmAnalysis = useMemo(
    () => analyzeGsmExcelText(rawGsmExcelText, customGsmMapping),
    [rawGsmExcelText, customGsmMapping]
  );

  const baseVehicles = mergeSamePlates
    ? shipmentAnalysis.vehiclesMerged
    : shipmentAnalysis.vehiclesUnmerged;

  // 2. Tablodaki sürücü GSM bilgilerini 1. tablodan gelen araç listesine eşleştirerek ekle
  const { enrichedVehicles: activeVehicles } = useMemo(
    () => matchVehiclesWithGsmTable(baseVehicles, gsmAnalysis),
    [baseVehicles, gsmAnalysis]
  );

  const filteredVehicles = useMemo(() => {
    return activeVehicles.filter((v) => {
      if (selectedProvince && !v.includedProvinces.includes(selectedProvince)) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLocaleLowerCase('tr-TR').trim();
      const ov = overrides[v.id];
      const plaka = (ov?.plaka ?? v.plaka).toLocaleLowerCase('tr-TR');
      const guzergah = (ov?.guzergah ?? v.guzergah).toLocaleLowerCase('tr-TR');
      const surucu = (ov?.surucu ?? v.surucu).toLocaleLowerCase('tr-TR');
      const gsm = (ov?.gsm ?? v.gsm).toLocaleLowerCase('tr-TR');
      return (
        plaka.includes(q) ||
        guzergah.includes(q) ||
        surucu.includes(q) ||
        gsm.includes(q)
      );
    });
  }, [activeVehicles, selectedProvince, searchQuery, overrides]);

  const handleUpdateOverride = (
    vehicleId: string,
    field: keyof VehicleFieldOverrides,
    value: string
  ) => {
    setOverrides((prev) => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        [field]: value,
      },
    }));
  };

  const handleCopyAllVehicles = async () => {
    if (filteredVehicles.length === 0) return;

    const formattedBlock = filteredVehicles
      .map((v) => formatVehiclePlainText(v, overrides[v.id]))
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(formattedBlock);
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Clipboard API fallback ignored
    }
  };

  const handleLoadAllSamples = () => {
    setRawExcelText(SAMPLE_EXCEL_TSV);
    setRawGsmExcelText(SAMPLE_GSM_EXCEL_TSV);
    setCustomMapping(null);
    setCustomGsmMapping(null);
    setSelectedProvince(null);
    setSearchQuery('');
    setOverrides({});
  };

  const handleClearAllTables = () => {
    setRawExcelText('');
    setRawGsmExcelText('');
    setSelectedProvince(null);
    setSearchQuery('');
    setOverrides({});
    window.setTimeout(() => {
      pasteTextareaRef.current?.focus();
    }, 50);
  };

  const handleFocusShipmentPasteBox = () => {
    pasteTextareaRef.current?.focus();
    pasteTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFocusGsmPasteBox = () => {
    gsmPasteTextareaRef.current?.focus();
    gsmPasteTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Üst Bar (3 Bölge: Tek Satır Başlık — Navigasyon/Aksiyon Linkleri — Tek Birincil Buton) */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Doğu Sevkiyat Analizi
        </a>

        <nav
          aria-label="Hızlı İşlemler"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={handleFocusShipmentPasteBox}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            1. Sevkiyat Tablosu
          </button>
          <button
            type="button"
            onClick={handleFocusGsmPasteBox}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            2. GSM Tablosu
          </button>
          <button
            type="button"
            onClick={handleLoadAllSamples}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Örnek Veriler
          </button>
          <button
            type="button"
            onClick={handleClearAllTables}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tümünü Sıfırla
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleCopyAllVehicles}
            disabled={filteredVehicles.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Liste Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sevkiyat Listesini Kopyala</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Ana 3 Sütunlu Çalışma Alanı */}
      <main
        id="top"
        className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[220px_380px_minmax(0,1fr)] xl:grid-cols-[240px_420px_minmax(0,1fr)] gap-5 items-start">
          {/* Sol Sütun: Sabit HARİÇ ve DAHİL İl Listesi */}
          <ProvinceSidebar
            provinceCounts={shipmentAnalysis.provinceCounts}
            selectedProvince={selectedProvince}
            onSelectProvince={setSelectedProvince}
          />

          {/* Orta Sütun: Doğuya Gidecek Araçlar (1. Tablo + 2. Tablo GSM Birleşimi) */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <VehicleOutputList
              vehicles={activeVehicles}
              filteredVehicles={filteredVehicles}
              searchQuery={searchQuery}
              onChangeSearchQuery={setSearchQuery}
              overrides={overrides}
              onUpdateOverride={handleUpdateOverride}
              mergeSamePlates={mergeSamePlates}
              onToggleMergePlates={setMergeSamePlates}
              selectedProvince={selectedProvince}
              onClearProvinceFilter={() => setSelectedProvince(null)}
              onCopyAll={handleCopyAllVehicles}
              copiedAll={copiedAll}
              onFocusPasteBox={handleFocusShipmentPasteBox}
              onLoadSample={handleLoadAllSamples}
            />
          </div>

          {/* Sağ Sütun: 1. Sevkiyat Excel Tablosu + 2. Sürücü GSM Excel Tablosu */}
          <div className="flex flex-col gap-5 min-w-0">
            <ExcelPastePanel
              rawText={rawExcelText}
              onChangeRawText={setRawExcelText}
              analysis={shipmentAnalysis}
              customMapping={customMapping}
              onUpdateMapping={setCustomMapping}
              onLoadSample={() => {
                setRawExcelText(SAMPLE_EXCEL_TSV);
                setCustomMapping(null);
              }}
              onClear={() => {
                setRawExcelText('');
                window.setTimeout(() => pasteTextareaRef.current?.focus(), 50);
              }}
              textareaRef={pasteTextareaRef}
            />

            <GsmPastePanel
              rawText={rawGsmExcelText}
              onChangeRawText={setRawGsmExcelText}
              analysis={gsmAnalysis}
              customMapping={customGsmMapping}
              onUpdateMapping={setCustomGsmMapping}
              onLoadSample={() => {
                setRawGsmExcelText(SAMPLE_GSM_EXCEL_TSV);
                setCustomGsmMapping(null);
              }}
              onClear={() => {
                setRawGsmExcelText('');
                window.setTimeout(() => gsmPasteTextareaRef.current?.focus(), 50);
              }}
              textareaRef={gsmPasteTextareaRef}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
