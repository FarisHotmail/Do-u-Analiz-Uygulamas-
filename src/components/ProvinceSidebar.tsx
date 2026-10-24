import { EXCLUDED_PROVINCES, INCLUDED_PROVINCES, IncludedProvince } from '../constants/provinces';

interface ProvinceSidebarProps {
  provinceCounts: Record<string, number>;
  selectedProvince: IncludedProvince | null;
  onSelectProvince: (province: IncludedProvince | null) => void;
}

export function ProvinceSidebar({
  provinceCounts,
  selectedProvince,
  onSelectProvince,
}: ProvinceSidebarProps) {
  return (
    <aside
      aria-label="Sabit Bölge Listesi"
      className="bg-white border border-slate-200 rounded-lg p-5 lg:sticky lg:top-20 lg:self-start"
    >
      {/* HARİÇ Listesi */}
      <div>
        <div className="flex items-baseline justify-between pb-2 mb-2.5 border-b border-slate-200">
          <h2 className="text-sm font-bold tracking-tight text-red-700">HARİÇ</h2>
          <span className="text-xs text-slate-500 tabular-nums">
            {EXCLUDED_PROVINCES.length} il
          </span>
        </div>
        <ul className="space-y-1">
          {EXCLUDED_PROVINCES.map((province) => {
            const count = provinceCounts[province] || 0;
            return (
              <li
                key={province}
                className="flex items-center justify-between py-1 px-2 rounded text-sm text-slate-600"
              >
                <span>{province}</span>
                {count > 0 && (
                  <span
                    title="Tabloda bulunan ancak analiz dışı bırakılan satır sayısı"
                    className="font-mono text-xs text-red-600 tabular-nums"
                  >
                    {count}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* DAHİL Listesi */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <div className="flex items-baseline justify-between pb-2 mb-2.5 border-b border-slate-200">
          <h2 className="text-sm font-bold tracking-tight text-emerald-700">DAHİL</h2>
          {selectedProvince ? (
            <button
              type="button"
              onClick={() => onSelectProvince(null)}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded whitespace-nowrap shrink-0 cursor-pointer"
            >
              Filtreyi Kaldır
            </button>
          ) : (
            <span className="text-xs text-slate-500 tabular-nums">
              {INCLUDED_PROVINCES.length} il
            </span>
          )}
        </div>
        <ul className="space-y-1">
          {INCLUDED_PROVINCES.map((province) => {
            const count = provinceCounts[province] || 0;
            const isSelected = selectedProvince === province;
            return (
              <li key={province}>
                <button
                  type="button"
                  onClick={() => onSelectProvince(isSelected ? null : province)}
                  className={`w-full flex items-center justify-between py-1.5 px-2 rounded text-left text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold'
                      : count > 0
                        ? 'text-slate-900 font-medium hover:bg-slate-100'
                        : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{province}</span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isSelected
                        ? 'text-slate-200'
                        : count > 0
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-400'
                    }`}
                  >
                    {count > 0 ? count : '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
          Yalnızca <strong className="font-semibold text-slate-700">DAHİL</strong> listesindeki illere gidecek araçlar sevkiyat listesine eklenir. İl adına tıklayarak filtreleyebilirsiniz.
        </p>
      </div>
    </aside>
  );
}
