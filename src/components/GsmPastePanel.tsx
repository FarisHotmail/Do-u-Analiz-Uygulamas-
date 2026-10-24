import { RefObject, useState } from 'react';
import { Check, ClipboardPaste, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  GsmAnalysisResult,
  GsmColumnMapping,
  MAX_GSM_EXCEL_ROWS,
  ParsedGsmRow,
} from '../utils/gsmParser';

interface GsmPastePanelProps {
  rawText: string;
  onChangeRawText: (value: string) => void;
  analysis: GsmAnalysisResult;
  rowsWithMatchFlags: ParsedGsmRow[];
  matchedVehicleCount: number;
  totalVehicleCount: number;
  customMapping: Partial<GsmColumnMapping> | null;
  onUpdateMapping: (mapping: Partial<GsmColumnMapping> | null) => void;
  onLoadSample: () => void;
  onClear: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

type GsmRowFilter = 'ALL' | 'MATCHED' | 'UNMATCHED';

export function GsmPastePanel({
  rawText,
  onChangeRawText,
  analysis,
  rowsWithMatchFlags,
  matchedVehicleCount,
  totalVehicleCount,
  customMapping,
  onUpdateMapping,
  onLoadSample,
  onClear,
  textareaRef,
}: GsmPastePanelProps) {
  const [rowFilter, setRowFilter] = useState<GsmRowFilter>('ALL');
  const [showMappingBar, setShowMappingBar] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const matchedRowCount = rowsWithMatchFlags.filter((r) => r.isMatched).length;
  const unmatchedRowCount = rowsWithMatchFlags.length - matchedRowCount;

  const filteredRows = rowsWithMatchFlags.filter((row) => {
    if (rowFilter === 'ALL') return true;
    if (rowFilter === 'MATCHED') return row.isMatched;
    return !row.isMatched;
  });

  const handlePasteFromClipboardButton = async () => {
    setClipboardError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onChangeRawText(text);
      } else {
        textareaRef.current?.focus();
        setClipboardError(
          'Pano boş görünüyor. Aşağıdaki kutuya sağ tıklayıp Yapıştır (Ctrl+V) yapabilirsiniz.'
        );
      }
    } catch {
      textareaRef.current?.focus();
      setClipboardError(
        'Tarayıcı izinleri nedeniyle aşağıdaki metin kutusuna tıklayıp Ctrl+V (veya Sağ Tık -> Yapıştır) yapın.'
      );
    }
  };

  const { activeMapping } = analysis;

  const getColumnRoleLabel = (colIdx: number): string | null => {
    if (colIdx === activeMapping.soforIndex) return 'ŞOFÖR (Eşleştirme)';
    if (colIdx === activeMapping.gsmIndex) return 'GSM (Aktarılacak)';
    if (colIdx === activeMapping.plakaIndex) return 'PLAKA (Eşleştirme)';
    return null;
  };

  return (
    <section
      aria-label="Sürücü GSM Excel Tablosu Yapıştırma Alanı"
      className="bg-white border border-slate-200 rounded-lg flex flex-col min-w-0"
    >
      {/* Üst Başlık ve Yapıştırma Aksiyonları */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              2. Excel Tablosu Yapıştırma Alanı (Sürücü GSM Bilgileri)
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
              <span>Kayıtlı sürücü satırı: {rowsWithMatchFlags.length}</span>
              <span aria-hidden="true">·</span>
              <span>
                GSM eşleşen araç: {matchedVehicleCount} / {totalVehicleCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>Aktif sütunlar: ŞOFÖR, GSM{activeMapping.plakaIndex >= 0 ? ', PLAKA' : ''}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowMappingBar((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                showMappingBar || customMapping
                  ? 'bg-sky-50 text-sky-900 border border-sky-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sütun Eşleştirme</span>
            </button>

            <button
              type="button"
              onClick={handlePasteFromClipboardButton}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Panodan Yapıştır</span>
            </button>

            {rawText.trim() ? (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Örnek GSM Yükle</span>
              </button>
            )}
          </div>
        </div>

        {clipboardError && (
          <p className="mt-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            {clipboardError}
          </p>
        )}

        {analysis.wasTruncated && (
          <p className="mt-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 tabular-nums">
            Yapıştırılan tabloda {analysis.totalPastedDataRows} satır bulundu; ilk {MAX_GSM_EXCEL_ROWS} satır işlendi.
          </p>
        )}

        {/* Sütun Eşleştirme Seçicileri */}
        {showMappingBar && (
          <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-800">
                2. Tablo Sütun Eşleştirmesi (Sürücü GSM Eşleştirme)
              </span>
              {customMapping && (
                <button
                  type="button"
                  onClick={() => onUpdateMapping(null)}
                  className="text-xs font-medium text-sky-700 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Otomatik Algılamaya Dön
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block text-xs">
                <span className="font-medium text-slate-700 block mb-1">
                  ŞOFÖR / AD SOYAD Sütunu
                </span>
                <select
                  value={activeMapping.soforIndex}
                  onChange={(e) =>
                    onUpdateMapping({
                      ...activeMapping,
                      soforIndex: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                >
                  {analysis.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {i + 1}. Sütun — {h}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700 block mb-1">
                  GSM / TELEFON Sütunu
                </span>
                <select
                  value={activeMapping.gsmIndex}
                  onChange={(e) =>
                    onUpdateMapping({
                      ...activeMapping,
                      gsmIndex: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                >
                  {analysis.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {i + 1}. Sütun — {h}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700 block mb-1">
                  PLAKA Sütunu (Varsa)
                </span>
                <select
                  value={activeMapping.plakaIndex}
                  onChange={(e) =>
                    onUpdateMapping({
                      ...activeMapping,
                      plakaIndex: Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-sky-600"
                >
                  <option value={-1}>Yok (Yalnızca Şoför Adıyla Eşleştir)</option>
                  {analysis.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {i + 1}. Sütun — {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Doğrudan Excel Yapıştırma Kutusu */}
        <div className="mt-4">
          <label htmlFor="gsm-excel-paste-textarea" className="sr-only">
            Sürücü GSM Excel Verisi Yapıştırma Kutusu
          </label>
          <textarea
            id="gsm-excel-paste-textarea"
            ref={textareaRef}
            value={rawText}
            onChange={(e) => {
              setClipboardError(null);
              onChangeRawText(e.target.value);
            }}
            rows={4}
            placeholder="Sürücülere ait GSM numaralarının bulunduğu ikinci Excel tablosunu kopyalayıp buraya sağ tıklayarak yapıştırın veya Ctrl+V tuşlarına basın..."
            className="w-full p-3 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none transition-colors resize-y"
          />
        </div>
      </div>

      {/* Alt Bölüm: 2. Tablo Önizleme ve Eşleşme Filtreleri */}
      <div className="p-5 flex-1 flex flex-col min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md">
            <button
              type="button"
              onClick={() => setRowFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                rowFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü ({rowsWithMatchFlags.length})
            </button>
            <button
              type="button"
              onClick={() => setRowFilter('MATCHED')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                rowFilter === 'MATCHED'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Listeyle Eşleşen ({matchedRowCount})
            </button>
            <button
              type="button"
              onClick={() => setRowFilter('UNMATCHED')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                rowFilter === 'UNMATCHED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diğer Kayıtlar ({unmatchedRowCount})
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Eşleşen sürücülerin GSM bilgileri sol-orta listeye otomatik aktarılır
          </span>
        </div>

        {rowsWithMatchFlags.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-md py-10 px-6 text-center bg-slate-50/60">
            <p className="text-sm font-medium text-slate-700">
              Sürücü GSM tablosu bekleniyor
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Sürücü isimleri ve telefon numaralarını içeren ikinci Excel tablosunu yukarıdaki kutuya yapıştırdığınızda GSM alanları otomatik doldurulur.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md overflow-x-auto max-h-[300px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 border-r border-slate-200 whitespace-nowrap tabular-nums">
                    #
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    GSM Aktarım Durumu
                  </th>
                  {analysis.headers.map((headerText, colIdx) => {
                    const roleLabel = getColumnRoleLabel(colIdx);
                    const isAnalyzed = roleLabel !== null;
                    return (
                      <th
                        key={colIdx}
                        className={`py-2 px-3 border-r last:border-r-0 border-slate-200 whitespace-nowrap ${
                          isAnalyzed
                            ? 'bg-sky-50/80 text-slate-900 font-bold'
                            : 'text-slate-400 font-normal'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{headerText}</span>
                          <span
                            className={`text-[10px] font-mono ${
                              isAnalyzed ? 'text-sky-700 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {roleLabel || 'Analiz Dışı'}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`transition-colors hover:bg-slate-50 ${
                      row.isMatched ? 'bg-emerald-50/25' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-slate-400 border-r border-slate-100 tabular-nums whitespace-nowrap">
                      {row.rowNumber}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 whitespace-nowrap">
                      {row.isMatched ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Aktarıldı</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Listede Yok</span>
                      )}
                    </td>
                    {row.cells.map((cell, colIdx) => {
                      const isAnalyzed = getColumnRoleLabel(colIdx) !== null;
                      const isMonoCol =
                        colIdx === activeMapping.gsmIndex ||
                        colIdx === activeMapping.plakaIndex;

                      return (
                        <td
                          key={colIdx}
                          className={`py-2 px-3 border-r last:border-r-0 border-slate-100 whitespace-nowrap max-w-[220px] truncate ${
                            isAnalyzed
                              ? row.isMatched
                                ? 'text-slate-900 font-medium bg-emerald-50/20'
                                : 'text-slate-800'
                              : 'text-slate-400'
                          } ${isMonoCol ? 'font-mono tabular-nums' : ''}`}
                          title={cell}
                        >
                          {cell || '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
