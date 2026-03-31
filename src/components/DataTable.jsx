import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ROWS_PER_PAGE = 25;

const classificationBadge = {
  generic: 'bg-slate-100 text-slate-700',
  myBrand: 'bg-blue-100 text-blue-700',
  competitor: 'bg-purple-100 text-purple-700',
  mixed: 'bg-orange-100 text-orange-700',
};

const fitBadge = {
  highest: 'bg-red-100 text-red-700 border border-red-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  monitor: 'bg-gray-100 text-gray-500 border border-gray-200',
};

export default function DataTable({ data, onRowClick }) {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));
  const pageData = data.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
        <p className="text-gray-400 text-lg font-medium">{t('table.noResults')}</p>
        <p className="text-gray-300 text-sm mt-1">{t('table.noResultsHint')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider w-16">
                {t('table.rank')}
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                {t('table.searchTerm')}
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider w-24">
                {t('table.classification')}
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                {t('table.competitor1')}
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                {t('table.position2')}
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                {t('table.myProduct')}
              </th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600 text-xs uppercase tracking-wider w-20">
                {t('table.csGap')}
              </th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider w-28">
                {t('table.score')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageData.map((row, i) => {
              const rowBg = row.isAbsent
                ? 'bg-red-50/50'
                : row.isLosing
                  ? 'bg-emerald-50/50'
                  : '';

              const p1 = row.products[0];
              const p2 = row.products[1];

              return (
                <tr
                  key={`${row.searchTerm}-${i}`}
                  onClick={() => onRowClick?.(row)}
                  className={`${rowBg} hover:bg-blue-50/40 transition-colors cursor-pointer`}
                >
                  <td className="px-3 py-2.5 font-mono text-gray-500 text-xs">
                    {row.rank === Infinity ? '\u2014' : `#${row.rank.toLocaleString()}`}
                  </td>
                  <td className="px-3 py-2.5 max-w-[200px]">
                    <span className="font-semibold text-gray-900 truncate block" title={row.searchTerm}>
                      {row.searchTerm}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${classificationBadge[row.classification]}`}>
                      {t(`classification.${row.classification}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px]">
                    <span className="font-medium text-gray-800 truncate block text-xs" title={p1.title}>
                      {p1.brand.name}
                    </span>
                    <span className="text-[10px] text-gray-400">{p1.clickShare.toFixed(1)}% CS</span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[160px]">
                    <span className={`font-medium truncate block text-xs ${p2.isOwn ? 'text-blue-700' : 'text-gray-700'}`} title={p2.title}>
                      {p2.brand.name}
                    </span>
                    <span className="text-[10px] text-gray-400">{p2.clickShare.toFixed(1)}% CS</span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[180px]">
                    {row.ownProduct ? (
                      <>
                        <span className="font-medium text-blue-700 truncate block text-xs" title={row.ownProduct.title}>
                          #{row.ownProduct.position} &middot;{' '}
                          {row.ownProduct.title.length > 30
                            ? row.ownProduct.title.slice(0, 30) + '\u2026'
                            : row.ownProduct.title}
                        </span>
                        <span className="text-[10px] text-blue-400">
                          {row.ownProduct.clickShare.toFixed(1)}% CS
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-300 italic text-xs">{t('table.notInTop3')}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-bold text-gray-800 text-xs">{row.csGap.toFixed(1)}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${fitBadge[row.fitLevel]}`}>
                      {row.opportunityScore}
                      <span className="font-medium opacity-70">{t(`fit.${row.fitLevel}`)}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: hint + pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
        <span className="text-xs text-gray-400">
          {t('table.clickForInsight')} &middot;{' '}
          {t('table.showing')}{' '}
          <span className="font-medium text-gray-600">{page * ROWS_PER_PAGE + 1}</span>
          {'\u2013'}
          <span className="font-medium text-gray-600">{Math.min((page + 1) * ROWS_PER_PAGE, data.length)}</span>{' '}
          {t('table.of')}{' '}
          <span className="font-medium text-gray-600">{data.length}</span>
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-600 font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
