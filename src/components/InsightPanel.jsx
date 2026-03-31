import { X, Lightbulb, AlertTriangle, Target, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateInsight } from '../utils/insights';

const classificationColors = {
  generic: 'bg-slate-100 text-slate-700',
  myBrand: 'bg-blue-100 text-blue-700',
  competitor: 'bg-purple-100 text-purple-700',
  mixed: 'bg-orange-100 text-orange-700',
};

const recColors = {
  'insight.prioritize': 'bg-green-100 text-green-800 border-green-300',
  'insight.testSP': 'bg-blue-100 text-blue-800 border-blue-300',
  'insight.monitorOnly': 'bg-gray-100 text-gray-700 border-gray-300',
  'insight.avoidCompetitor': 'bg-red-100 text-red-800 border-red-300',
};

export default function InsightPanel({ term, onClose }) {
  const { t } = useLanguage();

  if (!term) return null;

  const insight = generateInsight(term);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">
            {t('insight.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Term info */}
          <div>
            <p className="text-xl font-bold text-gray-900 mb-2">
              {term.searchTerm}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${classificationColors[term.classification]}`}
              >
                {t(`classification.${term.classification}`)}
              </span>
              {term.rank !== Infinity && (
                <span className="text-xs text-gray-500">
                  #{term.rank.toLocaleString()} SFR
                </span>
              )}
              <span className="text-xs text-gray-500">
                Score: {term.opportunityScore}
              </span>
            </div>
          </div>

          {/* Top 3 products */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {term.products.map((p) => (
              <div key={p.position} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-gray-500">#{p.position}</span>
                  <span
                    className={`truncate font-medium ${p.isOwn ? 'text-blue-700' : 'text-gray-700'}`}
                    title={p.title}
                  >
                    {p.brand.name} — {p.title.slice(0, 40)}
                  </span>
                </div>
                <span className="text-gray-500 flex-shrink-0 ml-2">
                  {p.clickShare.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Why USE */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-green-800 text-sm">
                {t('insight.whyUse')}
              </h3>
            </div>
            <ul className="space-y-1.5">
              {insight.whyUse.map((key, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-green-500">
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Why NOT */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-amber-800 text-sm">
                {t('insight.whyNot')}
              </h3>
            </div>
            <ul className="space-y-1.5">
              {insight.whyNot.map((key, i) => (
                <li key={i} className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-sm">
                {t('insight.recommendation')}
              </h3>
            </div>
            <div
              className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold border ${recColors[insight.recommendation] || 'bg-gray-100 text-gray-700'}`}
            >
              {t(insight.recommendation)}
            </div>
          </div>

          {/* Placement */}
          {insight.placements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-800 text-sm">
                  {t('insight.placement')}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {insight.placements.map((key, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200"
                  >
                    {t(key)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
