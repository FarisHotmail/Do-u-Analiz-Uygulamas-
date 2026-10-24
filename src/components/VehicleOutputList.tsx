import { useState } from 'react';
import { Check, Copy, Download, Search, X } from 'lucide-react';
import { IncludedProvince } from '../constants/provinces';
import {
  formatDriverUpperCase,
  formatGsmNumber,
  formatLicensePlate,
  VehicleEntry,
} from '../utils/excelParser';

export interface VehicleFieldOverrides {
  plaka?: string;
  guzergah?: string;
  surucu?: string;
  gsm?: string;
}

interface VehicleOutputListProps {
  vehicles: VehicleEntry[];
  filteredVehicles: VehicleEntry[];
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  overrides: Record<string, VehicleFieldOverrides>;
  onUpdateOverride: (vehicleId: string, field: keyof VehicleFieldOverrides, value: string) => void;
  mergeSamePlates: boolean;
  onToggleMergePlates: (merge: boolean) => void;
  selectedProvince: IncludedProvince | null;
  onClearProvinceFilter: () => void;
  onCopyAll: () => void;
  copiedAll: boolean;
  onFocusPasteBox: () => void;
  onLoadSample: () => void;
}

/**
 * Kopyalanacak metin formatı (PLAKA, GÜZERGAH, SÜRÜCÜ, GSM başlıkları olmadan):
 * 35BHF355
 * BİTLİS-MUŞ-TUNCELİ
 * MEHMET REŞAT ÇAYIR
 * 544 417 22 87
 */
export function formatVehiclePlainText(
  vehicle: VehicleEntry,
  override?: VehicleFieldOverrides
): string {
  const plakaRaw = override?.plaka !== undefined ? override.plaka : vehicle.plaka;
  const guzergahRaw = override?.guzergah !== undefined ? override.guzergah : vehicle.guzergah;
  const surucuRaw = override?.surucu !== undefined ? override.surucu : vehicle.surucu;
  const gsmRaw = override?.gsm !== undefined ? override.gsm : vehicle.gsm;

  const plaka = formatLicensePlate(plakaRaw);
  const guzergah = guzergahRaw
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/\s*-\s*/g, '-');
  const surucu = formatDriverUpperCase(surucuRaw);
  const gsm = formatGsmNumber(gsmRaw);

  const lines = [plaka, guzergah, surucu];
  if (gsm) {
    lines.push(gsm);
  }
  return lines.join('\n');
}

export function VehicleOutputList({
  vehicles,
  filteredVehicles,
  searchQuery,
  onChangeSearchQuery,
  overrides,
  onUpdateOverride,
  mergeSamePlates,
  onToggleMergePlates,
  selectedProvince,
  onClearProvinceFilter,
  onCopyAll,
  copiedAll,
  onFocusPasteBox,
  onLoadSample,
}: VehicleOutputListProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'raw'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySingle = async (vehicle: VehicleEntry) => {
    const text = formatVehiclePlainText(vehicle, overrides[vehicle.id]);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(vehicle.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === vehicle.id ? null : prev));
      }, 1800);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const handleDownloadTxt = () => {
    if (filteredVehicles.length === 0) return;
    const content = filteredVehicles
      .map((v) => formatVehiclePlainText(v, overrides[v.id]))
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `dogu-sevkiyat-araclari-${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const allPlainText = filteredVehicles
    .map((v) => formatVehiclePlainText(v, overrides[v.id]))
    .join('\n\n');

  return (
    <section
      aria-label="Doğu Güzergahı Araç Listesi"
      className="bg-white border border-slate-200 rounded-lg flex flex-col"
    >
      {/* Panel Başlığı */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Doğuya Gidecek Araçlar
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
              <span className="font-semibold text-slate-700">ENLOG</span>
              <span aria-hidden="true">·</span>
              <span>{filteredVehicles.length} araç listelendi</span>
              {selectedProvince && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-800">
                    Filtre: {selectedProvince}
                  </span>
                  <button
                    type="button"
                    onClick={onClearProvinceFilter}
                    className="inline-flex items-center text-sky-700 hover:text-sky-900 underline ml-0.5 cursor-pointer"
                  >
                    Temizle
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={filteredVehicles.length === 0}
              title="Metin dosyası (.txt) olarak indir"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TXT İndir</span>
            </button>
            <button
              type="button"
              onClick={onCopyAll}
              disabled={filteredVehicles.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Tümünü Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Arama ve Görünüm Kontrolleri */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Plaka, güzergah veya sürücü ara..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onChangeSearchQuery('')}
                aria-label="Aramayı temizle"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kopyalanacak Metin
            </button>
          </div>
        </div>

        {/* Plaka Birleştirme Seçeneği */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-600">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mergeSamePlates}
              onChange={(e) => onToggleMergePlates(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-sky-600 cursor-pointer"
            />
            <span>Aynı plakalı çoklu uğrama satırlarını birleştir</span>
          </label>
        </div>
      </div>

      {/* İçerik Alanı */}
      <div className="p-5 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[420px]">
        {filteredVehicles.length === 0 ? (
          <div className="space-y-4">
            {/* İstenen sabit şablon her zaman görünür kalır */}
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-md font-mono text-xs text-slate-500 space-y-1.5">
              <div>PLAKA : </div>
              <div>GÜZERGAH : </div>
              <div>SÜRÜCÜ : </div>
              <div>GSM : </div>
            </div>

            <div className="text-center py-4">
              <p className="text-sm font-medium text-slate-800">
                {vehicles.length === 0
                  ? 'Henüz DAHİL bölgesine gidecek araç bulunmuyor'
                  : 'Arama kriterine uygun araç bulunamadı'}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {vehicles.length === 0
                  ? 'Sağdaki alana Excel tablonuzu yapıştırdığınızda doğu illerine gidecek araçlar burada listelenir.'
                  : 'Filtreyi veya arama metnini temizleyerek tüm araçları görebilirsiniz.'}
              </p>
              {vehicles.length === 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={onFocusPasteBox}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Excel Yapıştırma Alanına Git
                  </button>
                  <button
                    type="button"
                    onClick={onLoadSample}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Örnek Tablo Yükle
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'raw' ? (
          <textarea
            readOnly
            value={allPlainText}
            aria-label="Kopyalanacak başlıksız düz metin önizlemesi"
            className="w-full h-full min-h-[380px] p-3.5 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-sky-600 resize-y"
          />
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredVehicles.map((vehicle, idx) => {
              const ov = overrides[vehicle.id];
              const plakaVal = ov?.plaka !== undefined ? ov.plaka : vehicle.plaka;
              const guzergahVal = ov?.guzergah !== undefined ? ov.guzergah : vehicle.guzergah;
              const surucuVal = ov?.surucu !== undefined ? ov.surucu : vehicle.surucu;
              const gsmVal = ov?.gsm !== undefined ? ov.gsm : vehicle.gsm;
              const isCopied = copiedId === vehicle.id;

              return (
                <article
                  key={vehicle.id}
                  className={`${idx === 0 ? 'pb-4' : idx === filteredVehicles.length - 1 ? 'pt-4' : 'py-4'} group`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                    <span className="font-mono tabular-nums">
                      #{idx + 1} · Excel Satır {vehicle.sourceRows.join(', ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopySingle(vehicle)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded px-1.5 py-0.5"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Arayüzde PLAKA / GÜZERGAH / SÜRÜCÜ / GSM etiketli görünüm; kopyalamada yalnızca değerler alınır */}
                  <div className="space-y-1 font-mono text-[13px] leading-snug">
                    <div className="flex items-baseline gap-1.5">
                      <span className="w-24 shrink-0 font-semibold text-slate-600 select-none">
                        PLAKA :
                      </span>
                      <input
                        type="text"
                        value={plakaVal}
                        onChange={(e) =>
                          onUpdateOverride(vehicle.id, 'plaka', e.target.value)
                        }
                        placeholder="Belirtilmedi"
                        aria-label={`Araç ${idx + 1} Plaka`}
                        className="flex-1 min-w-0 font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-600 focus:bg-slate-50 focus:outline-none px-1 py-0.5 rounded-xs tabular-nums"
                      />
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="w-24 shrink-0 font-semibold text-slate-600 select-none">
                        GÜZERGAH :
                      </span>
                      <input
                        type="text"
                        value={guzergahVal}
                        onChange={(e) =>
                          onUpdateOverride(vehicle.id, 'guzergah', e.target.value)
                        }
                        placeholder="Belirtilmedi"
                        aria-label={`Araç ${idx + 1} Güzergah`}
                        className="flex-1 min-w-0 font-medium text-emerald-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-600 focus:bg-slate-50 focus:outline-none px-1 py-0.5 rounded-xs"
                      />
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="w-24 shrink-0 font-semibold text-slate-600 select-none">
                        SÜRÜCÜ :
                      </span>
                      <input
                        type="text"
                        value={surucuVal}
                        onChange={(e) =>
                          onUpdateOverride(vehicle.id, 'surucu', e.target.value)
                        }
                        placeholder="Belirtilmedi"
                        aria-label={`Araç ${idx + 1} Sürücü`}
                        className="flex-1 min-w-0 text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-600 focus:bg-slate-50 focus:outline-none px-1 py-0.5 rounded-xs"
                      />
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className="w-24 shrink-0 font-semibold text-slate-600 select-none">
                        GSM :
                      </span>
                      <input
                        type="text"
                        value={gsmVal}
                        onChange={(e) =>
                          onUpdateOverride(vehicle.id, 'gsm', e.target.value)
                        }
                        placeholder="GSM girin (isteğe bağlı)"
                        aria-label={`Araç ${idx + 1} GSM`}
                        className="flex-1 min-w-0 text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-600 focus:bg-slate-50 focus:outline-none px-1 py-0.5 rounded-xs tabular-nums"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
