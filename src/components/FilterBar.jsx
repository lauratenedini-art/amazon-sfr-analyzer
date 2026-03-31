import { useState, useRef, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Download, X, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ── Simple dropdown component ──
function Dropdown({ label, value, options, onChange, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function FilterBar({ data, filters, onFiltersChange, onDownload }) {
  const { t } = useLanguage();

  // Collect unique brand names from position #1
  const brandOptions = useMemo(() => {
    const set = new Set();
    data.forEach((d) =>
      d.products.forEach((p) => {
        if (p.brand.name) set.add(p.brand.name);
      })
    );
    return [...set].sort();
  }, [data]);

  // Collect unique ASINs from all positions
  const asinOptions = useMemo(() => {
    const set = new Set();
    data.forEach((d) =>
      d.products.forEach((p) => {
        if (p.asin) set.add(p.asin);
      })
    );
    return [...set].sort();
  }, [data]);

  const filterMode = filters.filterMode; // 'none' | 'brand' | 'asin'

  const handleModeChange = (mode) => {
    if (mode === filterMode) return;
    onFiltersChange({
      ...filters,
      filterMode: mode,
      filterValue: '',
    });
  };

  const handleClear = () => {
    onFiltersChange({
      ...filters,
      filterMode: 'none',
      filterValue: '',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
      <SlidersHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" />

      {/* Text search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          value={filters.searchQuery || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, searchQuery: e.target.value })
          }
          placeholder={t('filters.searchPlaceholder')}
          className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 w-44 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filter mode toggle */}
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => handleModeChange('brand')}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterMode === 'brand'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {t('filters.byBrand')}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('asin')}
          className={`px-3 py-1.5 text-xs font-semibold border-l border-gray-300 transition-colors ${
            filterMode === 'asin'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {t('filters.byAsin')}
        </button>
      </div>

      {/* Conditional dropdown */}
      {filterMode === 'brand' && (
        <Dropdown
          value={filters.filterValue}
          onChange={(v) =>
            onFiltersChange({ ...filters, filterValue: v })
          }
          options={[
            { value: '', label: t('filters.allBrands') },
            { value: '__my__', label: `★ ${t('filters.myBrand')}` },
            ...brandOptions.map((b) => ({ value: b, label: b })),
          ]}
        />
      )}
      {filterMode === 'asin' && (
        <Dropdown
          value={filters.filterValue}
          onChange={(v) =>
            onFiltersChange({ ...filters, filterValue: v })
          }
          options={[
            { value: '', label: t('filters.allAsins') },
            ...asinOptions.map((a) => ({ value: a, label: a })),
          ]}
        />
      )}

      {/* Clear button */}
      {filterMode !== 'none' && filters.filterValue && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          <X className="h-3 w-3" />
          {t('filters.clear')}
        </button>
      )}

      {/* Fit level */}
      <Dropdown
        value={filters.fitLevel}
        onChange={(v) => onFiltersChange({ ...filters, fitLevel: v })}
        options={[
          { value: 'all', label: t('filters.fitAll') },
          { value: 'highest', label: t('fit.highest') },
          { value: 'high', label: t('fit.high') },
          { value: 'medium', label: t('fit.medium') },
          { value: 'monitor', label: t('fit.monitor') },
        ]}
      />

      {/* Sort */}
      <Dropdown
        value={filters.sortBy}
        onChange={(v) => onFiltersChange({ ...filters, sortBy: v })}
        options={[
          { value: 'score', label: `${t('filters.sort')}: ${t('filters.sortScore')}` },
          { value: 'rank', label: `${t('filters.sort')}: ${t('filters.sortRank')}` },
          { value: 'gap', label: `${t('filters.sort')}: ${t('filters.sortGap')}` },
        ]}
      />

      {/* Export */}
      <div className="ml-auto">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          {t('filters.export')}
        </button>
      </div>
    </div>
  );
}
