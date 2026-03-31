import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { ArrowLeft, Activity, X, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import SummaryCards from './SummaryCards';
import FilterBar from './FilterBar';
import CategoryTabs from './CategoryTabs';
import DataTable from './DataTable';
import InsightPanel from './InsightPanel';
import DemandAnalysis from './DemandAnalysis';
import WhereWeCanGrow from './WhereWeCanGrow';
import { isHiddenKW } from '../utils/categories';

export default function Dashboard({
  data,
  config,
  duplicateCount = 0,
  dynamicCategories = [],
  onReset,
}) {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    filterMode: 'none',
    filterValue: '',
    fitLevel: 'all',
    sortBy: 'score',
    searchQuery: '',
  });
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [showDemand, setShowDemand] = useState(false);
  const [showCompNotice, setShowCompNotice] = useState(
    (config.detectedCompetitors || []).length > 0
  );
  const [showDupeNotice, setShowDupeNotice] = useState(duplicateCount > 0);

  // ── Apply filters and tab selection ──
  const filteredData = useMemo(() => {
    let result = [...data];

    // Text search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((d) => d.searchTerm.includes(q));
    }

    // Filter mode: Brand OR ASIN
    if (filters.filterMode === 'brand' && filters.filterValue) {
      if (filters.filterValue === '__my__') {
        result = result.filter((d) =>
          d.products.some((p) => p.brand.type === 'own')
        );
      } else {
        result = result.filter((d) =>
          d.products.some((p) => p.brand.name === filters.filterValue)
        );
      }
    } else if (filters.filterMode === 'asin' && filters.filterValue) {
      result = result.filter((d) =>
        d.products.some((p) => p.asin === filters.filterValue)
      );
    }

    // Tab filter
    switch (activeTab) {
      case 'generic':
        result = result.filter((d) => d.classification === 'generic');
        break;
      case 'myBrand':
        result = result.filter((d) => d.classification === 'myBrand');
        break;
      case 'competitorBranded':
        result = result.filter((d) => d.classification === 'competitor');
        break;
      case 'hiddenKw':
        result = result.filter(isHiddenKW);
        break;
      case 'whereWeCanGrow':
        break;
      case 'all':
        break;
      default:
        // Dynamic product-category tabs
        result = result.filter((d) => d.categories.includes(activeTab));
        break;
    }

    // Fit level
    if (filters.fitLevel !== 'all') {
      result = result.filter((d) => d.fitLevel === filters.fitLevel);
    }

    // Sort
    switch (filters.sortBy) {
      case 'rank':
        result.sort((a, b) => a.rank - b.rank);
        break;
      case 'gap':
        result.sort((a, b) => b.csGap - a.csGap);
        break;
      case 'score':
      default:
        result.sort((a, b) => b.opportunityScore - a.opportunityScore);
        break;
    }

    return result;
  }, [data, activeTab, filters]);

  // ── Export CSV ──
  const handleDownload = () => {
    const rows = filteredData.map((d) => ({
      [t('table.rank')]: d.rank === Infinity ? '' : d.rank,
      [t('table.searchTerm')]: d.searchTerm,
      [t('table.classification')]: t(`classification.${d.classification}`),
      [`${t('table.competitor1')} Brand`]: d.products[0].brand.name,
      [`${t('table.competitor1')} ASIN`]: d.products[0].asin,
      [`${t('table.competitor1')} CS%`]: d.products[0].clickShare.toFixed(1),
      [`${t('table.position2')} Brand`]: d.products[1].brand.name,
      [`${t('table.position2')} ASIN`]: d.products[1].asin,
      [`${t('table.position2')} CS%`]: d.products[1].clickShare.toFixed(1),
      [t('table.myProduct')]: d.ownProduct ? d.ownProduct.title : '',
      [`${t('table.myProduct')} ASIN`]: d.ownProduct ? d.ownProduct.asin : '',
      [`${t('table.myProduct')} CS%`]: d.ownProduct
        ? d.ownProduct.clickShare.toFixed(1)
        : '',
      [t('table.csGap')]: d.csGap.toFixed(1),
      [t('table.score')]: d.opportunityScore,
      'Fit Level': t(`fit.${d.fitLevel}`),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sfr-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isGrowthTab = activeTab === 'whereWeCanGrow';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('dashboard.newAnalysis')}
            </button>
            <div className="h-5 w-px bg-gray-200 flex-shrink-0" />
            <h1 className="font-bold text-gray-900 text-lg truncate">
              {t('dashboard.title')}
            </h1>
            <span className="text-sm text-gray-400 hidden sm:inline flex-shrink-0">
              {t('dashboard.forBrand')}{' '}
              <span className="font-medium text-gray-600">
                {config.brandName}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowDemand(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-violet-700 hover:to-purple-700 shadow-sm transition-all"
            >
              <Activity className="h-4 w-4" />
              {t('dashboard.demandAnalysis')}
            </button>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Notices */}
        {showCompNotice && config.detectedCompetitors?.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-800">
            <span>
              <strong>{t('dashboard.detectedCompetitors')}</strong>{' '}
              {config.detectedCompetitors.slice(0, 10).join(', ')}
              {config.detectedCompetitors.length > 10 && ` (+${config.detectedCompetitors.length - 10})`}
            </span>
            <button
              onClick={() => setShowCompNotice(false)}
              className="text-blue-400 hover:text-blue-600 ml-3 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {showDupeNotice && duplicateCount > 0 && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
            <span>
              {t('dashboard.duplicatesSkipped')} {duplicateCount}
            </span>
            <button
              onClick={() => setShowDupeNotice(false)}
              className="text-amber-400 hover:text-amber-600 ml-3 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <SummaryCards data={data} />

        <FilterBar
          data={data}
          filters={filters}
          onFiltersChange={setFilters}
          onDownload={handleDownload}
        />

        <CategoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          data={data}
          dynamicCategories={dynamicCategories}
        />

        {isGrowthTab ? (
          <WhereWeCanGrow data={data} filters={filters} />
        ) : (
          <DataTable
            data={filteredData}
            onRowClick={(term) => setSelectedTerm(term)}
          />
        )}
      </main>

      {/* ── Insight side panel ── */}
      {selectedTerm && (
        <InsightPanel
          term={selectedTerm}
          onClose={() => setSelectedTerm(null)}
        />
      )}

      {/* ── Demand Analysis modal ── */}
      {showDemand && (
        <DemandAnalysis data={data} onClose={() => setShowDemand(false)} />
      )}
    </div>
  );
}
