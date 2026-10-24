import { RefObject, useState } from 'react';
import { ClipboardPaste, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  ColumnMapping,
  ExcelAnalysisResult,
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
  const [showMappingBar, setShowMappingBar] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

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

  return (
    <section
      aria-label="1. Excel Tablosu Yapıştırma Alanı"
      className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col min-w-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          1. Excel Tablosu Yapıştırma Alanı (Sevkiyat Tablosu)
        </h2>

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
          Yapıştırılan tabloda {analysis.totalPastedDataRows} veri satırı bulundu; ilk {MAX_EXCEL_ROWS} satır işlendi.
        </p>
      )}

      {showMappingBar && (
        <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-md">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-800">
              Sütun Eşleştirmesi
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
                <option value={-1}>Yok (2. Tablodan / Hücreden)</option>
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
          rows={8}
          placeholder="Excel dosyanızdan kopyaladığınız 11 sütunlu sevkiyat tablosunu buraya sağ tıklayıp yapıştırın veya Ctrl+V tuşlarına basın..."
          className="w-full p-3 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none transition-colors resize-y"
        />
      </div>
    </section>
  );
}
