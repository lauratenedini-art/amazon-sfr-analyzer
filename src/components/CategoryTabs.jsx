import { useLanguage } from '../contexts/LanguageContext';
import { getAllTabKeysDynamic, isHiddenKW } from '../utils/categories';

export default function CategoryTabs({
  activeTab,
  onTabChange,
  data,
  dynamicCategories = [],
}) {
  const { t } = useLanguage();
  const tabKeys = getAllTabKeysDynamic(dynamicCategories);

  // Build label lookup for dynamic (auto-detected) categories
  const dynamicLabels = {};
  dynamicCategories.forEach((c) => {
    dynamicLabels[c.key] = c.label;
  });

  const FIXED_TABS = new Set([
    'all', 'generic', 'myBrand', 'competitorBranded', 'hiddenKw', 'whereWeCanGrow',
  ]);

  const getCount = (key) => {
    switch (key) {
      case 'all':
        return data.length;
      case 'generic':
        return data.filter((d) => d.classification === 'generic').length;
      case 'myBrand':
        return data.filter((d) => d.classification === 'myBrand').length;
      case 'competitorBranded':
        return data.filter((d) => d.classification === 'competitor').length;
      case 'hiddenKw':
        return data.filter(isHiddenKW).length;
      case 'whereWeCanGrow':
        return null; // no count badge
      default:
        return data.filter((d) => d.categories.includes(key)).length;
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {tabKeys.map((key) => {
        const count = getCount(key);
        const isActive = activeTab === key;
        const isGrowth = key === 'whereWeCanGrow';

        // Hide empty dynamic category tabs (but always show fixed tabs)
        if (count === 0 && !FIXED_TABS.has(key)) return null;

        // Use i18n for fixed tabs, auto-detected label for dynamic
        const label = dynamicLabels[key] || t(`tabs.${key}`);

        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? isGrowth
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-sm'
                : isGrowth
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {label}
            {count !== null && (
              <span
                className={`ml-1.5 text-xs ${
                  isActive
                    ? isGrowth
                      ? 'text-emerald-200'
                      : 'text-blue-200'
                    : 'text-gray-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
