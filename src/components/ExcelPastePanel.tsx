import { RefObject, useState } from 'react';
import { Check, ClipboardPaste, RotateCcw, SlidersHorizontal, Trash2, X } from 'lucide-react';
import {
  ColumnMapping,
  EffectiveRowDisposition,
  ExcelAnalysisResult,
  EXPECTED_EXCEL_COLS,
  MAX_EXCEL_ROWS,
  TARGET_FIRMA_KEYWORD,
} from '../utils/excelParser';

interface ExcelPastePanelProps {
  rawText: string;
  onChangeRawText: (value: string) => void;
  analysis: ExcelAnalysisResult;
  customMapping: Partial<ColumnMapping> | null;
  onUpdateMapping: (mapping: Partial<ColumnMapping> | null) => void;
  onLoadSample: () => void;
  onClear: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

type TableRowFilter = 'ALL' | 'DAHIL' | 'HARIC_IL' | 'HARIC_FIRMA';

export function ExcelPastePanel({
  rawText,
  onChangeRawText,
  analysis,
  customMapping,
  onUpdateMapping,
  onLoadSample,
  onClear,
  textareaRef,
}: ExcelPastePanelProps) {
  const [rowFilter, setRowFilter] = useState<TableRowFilter>('ALL');
  const [showMappingBar, setShowMappingBar] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const dahilCount = analysis.rows.filter((r) => r.disposition === 'DAHIL').length;
  const haricIlCount = analysis.rows.filter(
    (r) => r.disposition === 'HARIC_IL' || r.disposition === 'DIGER'
  ).length;
  const haricFirmaCount = analysis.rows.filter((r) => r.disposition === 'HARIC_FIRMA').length;

  const filteredRows = analysis.rows.filter((row) => {
    if (rowFilter === 'ALL') return true;
    if (rowFilter === 'DAHIL') return row.disposition === 'DAHIL';
    if (rowFilter === 'HARIC_FIRMA') return row.disposition === 'HARIC_FIRMA';
    return row.disposition === 'HARIC_IL' || row.disposition === 'DIGER';
  });

  const handlePasteFromClipboardButton = async () => {
    setClipboardError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onChangeRawText(text);
      } else {
        textareaRef.current?.focus();
        setClipboardError('Pano boş görünüyor. Aşağıdaki kutuya sağ tıklayıp Yapıştır (Ctrl+V) yapabilirsiniz.');
      }
    } catch {
      textareaRef.current?.focus();
      setClipboardError('Tarayıcı izinleri nedeniyle aşağıdaki metin kutusuna tıklayıp Ctrl+V (veya Sağ Tık -> Yapıştır) yapın.');
    }
  };

  const { activeMapping } = analysis;

  const getColumnRoleLabel = (colIdx: number): string | null => {
    if (colIdx === activeMapping.firmaIndex) return `FİRMA (${TARGET_FIRMA_KEYWORD})`;
    if (colIdx === activeMapping.ilIndex) return 'İL (Analiz)';
    if (colIdx === activeMapping.plakaIndex) return 'PLAKA (Analiz)';
    if (colIdx === activeMapping.soforIndex) return 'ŞOFÖR (Analiz)';
    if (colIdx === activeMapping.gsmIndex) return 'GSM (Analiz)';
    return null;
  };

  const renderStatusCell = (disposition: EffectiveRowDisposition) => {
    if (disposition === 'DAHIL') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 whitespace-nowrap">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>Dahil ({TARGET_FIRMA_KEYWORD})</span>
        </span>
      );
    }
    if (disposition === 'HARIC_FIRMA') {
      return (
        <span className="inline-flex items-center gap-1 text-slate-400 whitespace-nowrap">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>Firma Hariç</span>
        </span>
      );
    }
    if (disposition === 'HARIC_IL') {
      return (
        <span className="inline-flex items-center gap-1 font-medium text-red-700 whitespace-nowrap">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>İl Hariç</span>
        </span>
      );
    }
    return <span className="text-slate-400 whitespace-nowrap">Kapsam Dışı</span>;
  };

  return (
    <section
      aria-label="Excel Tablo Yapıştırma ve Analiz Alanı"
      className="bg-white border border-slate-200 rounded-lg flex flex-col min-w-0"
    >
      {/* Üst Başlık ve Yapıştırma Aksiyonları */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              1. Excel Tablosu Yapıştırma Alanı (Sevkiyat Tablosu)
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
              <span>Standart: {EXPECTED_EXCEL_COLS} sütun</span>
              <span aria-hidden="true">·</span>
              <span>
                Satır: {analysis.rows.length} / {MAX_EXCEL_ROWS} maks.
              </span>
              <span aria-hidden="true">·</span>
              <span>Filtre: FİRMA = {TARGET_FIRMA_KEYWORD} ve DAHİL İller</span>
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
                <span>Örnek Veri Yükle</span>
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
            Yapıştırılan tabloda {analysis.totalPastedDataRows} veri satırı bulundu. En fazla {MAX_EXCEL_ROWS} satır kuralına göre ilk {MAX_EXCEL_ROWS} satır analiz edildi.
          </p>
        )}

        {/* Sütun Eşleştirme Seçicileri (İsteğe Bağlı Manuel Müdahale) */}
        {showMappingBar && (
          <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-800">
                Analiz Edilen Sütunlar (Diğer sütunlar analiz dışı bırakılır)
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <label className="block text-xs">
                <span className="font-medium text-slate-700 block mb-1">
                  FİRMA Sütunu ({TARGET_FIRMA_KEYWORD})
                </span>
                <select
                  value={activeMapping.firmaIndex}
                  onChange={(e) =>
                    onUpdateMapping({
                      ...activeMapping,
                      firmaIndex: Number(e.target.value),
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
                <span className="font-medium text-slate-700 block mb-1">İL Sütunu</span>
                <select
                  value={activeMapping.ilIndex}
                  onChange={(e) =>
                    onUpdateMapping({
                      ...activeMapping,
                      ilIndex: Number(e.target.value),
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
                <span className="font-medium text-slate-700 block mb-1">PLAKA Sütunu</span>
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
                  {analysis.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {i + 1}. Sütun — {h}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs">
                <span className="font-medium text-slate-700 block mb-1">ŞOFÖR Sütunu</span>
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
                <span className="font-medium text-slate-700 block mb-1">GSM Sütunu (Varsa)</span>
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
                  <option value={-1}>Yok (Şoför Hücresinden Ayıkla)</option>
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

        {/* Doğrudan Excel Yapıştırma Kutusu (Sağ Tık -> Yapıştır ve Ctrl+V uyumlu) */}
        <div className="mt-4">
          <label htmlFor="excel-paste-textarea" className="sr-only">
            Excel Verisi Yapıştırma Kutusu
          </label>
          <textarea
            id="excel-paste-textarea"
            ref={textareaRef}
            value={rawText}
            onChange={(e) => {
              setClipboardError(null);
              onChangeRawText(e.target.value);
            }}
            rows={4}
            placeholder="Excel dosyanızdan kopyaladığınız 11 sütunlu tabloyu (başlık satırıyla birlikte en fazla 150 satır) buraya sağ tıklayıp yapıştırın veya Ctrl+V tuşlarına basın..."
            className="w-full p-3 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none transition-colors resize-y"
          />
        </div>
      </div>

      {/* Alt Bölüm: 11 Sütunlu Tablo Önizleme ve Durum Filtreleri */}
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
              Tümü ({analysis.rows.length})
            </button>
            <button
              type="button"
              onClick={() => setRowFilter('DAHIL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                rowFilter === 'DAHIL'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dahil · {TARGET_FIRMA_KEYWORD} ({dahilCount})
            </button>
            <button
              type="button"
              onClick={() => setRowFilter('HARIC_IL')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                rowFilter === 'HARIC_IL'
                  ? 'bg-white text-red-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              İl Hariç ({haricIlCount})
            </button>
            <button
              type="button"
              onClick={() => setRowFilter('HARIC_FIRMA')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                rowFilter === 'HARIC_FIRMA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diğer Firma ({haricFirmaCount})
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Yalnızca <strong className="font-semibold text-slate-700">{TARGET_FIRMA_KEYWORD}</strong> firması ve DAHİL iller listeye alınır
          </span>
        </div>

        {analysis.rows.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-md py-14 px-6 text-center bg-slate-50/60">
            <p className="text-sm font-medium text-slate-700">
              Analiz edilecek Excel tablosu bekleniyor
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Excel sayfasında 11 sütunlu tablonuzu seçip kopyalayın (<kbd className="font-mono font-semibold">Ctrl+C</kbd>), ardından yukarıdaki kutuya yapıştırın (<kbd className="font-mono font-semibold">Ctrl+V</kbd>).
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md overflow-x-auto max-h-[calc(100vh-410px)] min-h-[300px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 border-r border-slate-200 whitespace-nowrap tabular-nums">
                    #
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    Analiz Durumu
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
                {filteredRows.map((row) => {
                  const isDahil = row.disposition === 'DAHIL';
                  const isHaricFirma = row.disposition === 'HARIC_FIRMA';

                  return (
                    <tr
                      key={row.rowNumber}
                      className={`transition-colors hover:bg-slate-50 ${
                        isDahil
                          ? 'bg-emerald-50/25'
                          : isHaricFirma
                            ? 'opacity-60'
                            : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-mono text-slate-400 border-r border-slate-100 tabular-nums whitespace-nowrap">
                        {row.rowNumber}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 whitespace-nowrap">
                        {renderStatusCell(row.disposition)}
                      </td>
                      {row.cells.map((cell, colIdx) => {
                        const isAnalyzed = getColumnRoleLabel(colIdx) !== null;
                        const isPlateCol = colIdx === activeMapping.plakaIndex;
                        const isFirmaCol = colIdx === activeMapping.firmaIndex;

                        return (
                          <td
                            key={colIdx}
                            className={`py-2 px-3 border-r last:border-r-0 border-slate-100 whitespace-nowrap max-w-[220px] truncate ${
                              isAnalyzed
                                ? isDahil
                                  ? 'text-slate-900 font-medium bg-emerald-50/20'
                                  : isFirmaCol && !row.isEnlog
                                    ? 'text-slate-500'
                                    : 'text-slate-800'
                                : 'text-slate-400'
                            } ${isPlateCol ? 'font-mono tabular-nums' : ''} ${
                              isFirmaCol && row.isEnlog ? 'font-semibold text-slate-900' : ''
                            }`}
                            title={cell}
                          >
                            {cell || '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
