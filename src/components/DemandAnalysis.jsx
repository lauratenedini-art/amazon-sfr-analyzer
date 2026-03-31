import { useMemo } from 'react';
import { X, Activity, AlertTriangle, ShieldAlert, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  computeBrandAwareness,
  computeGenericTrafficLoss,
  computeBrandedTrafficLoss,
  computeHealthScore,
  generateActions,
  generateDiagnosis,
} from '../utils/demandAnalysis';

// ── Simple horizontal bar ──
function Bar({ pct, color = 'blue', label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 text-right flex-shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
        <div
          className={`h-4 rounded-full bg-${color}-500 transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-14">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

// ── Score gauge (SVG ring) ──
function ScoreGauge({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75
      ? '#10b981'
      : score >= 50
        ? '#f59e0b'
        : score >= 25
          ? '#f97316'
          : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70" cy="70" r={radius}
          stroke="#e5e7eb" strokeWidth="12" fill="none"
        />
        <circle
          cx="70" cy="70" r={radius}
          stroke={color} strokeWidth="12" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span
        className="text-4xl font-extrabold -mt-24 mb-16"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

// ── Severity badge ──
function SeverityBadge({ level, t }) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[level] || styles.low}`}>
      {t(`demand.${level}`)}
    </span>
  );
}

export default function DemandAnalysis({ data, onClose }) {
  const { t, lang } = useLanguage();

  const analysis = useMemo(() => {
    const awareness = computeBrandAwareness(data);
    const genericLoss = computeGenericTrafficLoss(data);
    const brandedLoss = computeBrandedTrafficLoss(data);
    const healthScore = computeHealthScore(awareness, genericLoss, brandedLoss, data);
    const actions = generateActions(awareness, genericLoss, brandedLoss, lang);
    const diagnosis = generateDiagnosis(healthScore, awareness, lang);
    return { awareness, genericLoss, brandedLoss, healthScore, actions, diagnosis };
  }, [data, lang]);

  const { awareness, genericLoss, brandedLoss, healthScore, actions, diagnosis } = analysis;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            {t('demand.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-10">
          {/* ─── Section 1: Brand Awareness ─── */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {t('demand.section1')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{t('demand.section1Sub')}</p>

            {/* Tier badge */}
            <div className="flex items-center gap-3 mb-5">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                awareness.tier === 'topOfMind'
                  ? 'bg-green-100 text-green-800'
                  : awareness.tier === 'challenger'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
              }`}>
                {t(`demand.${awareness.tier}`)}
              </span>
              <span className="text-sm text-gray-600">
                {t(`demand.${awareness.tier}Desc`)}
              </span>
            </div>

            {/* Bars */}
            <div className="space-y-2 mb-6">
              <Bar
                pct={awareness.ratio > 100 ? 100 : awareness.ratio}
                color="blue"
                label={`${t('demand.branded')} (${awareness.ratio}%)`}
              />
              <Bar pct={100} color="gray" label={t('demand.genericSearch')} />
            </div>

            {/* Top terms side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50/50 rounded-lg p-4">
                <h4 className="text-xs font-bold text-blue-700 mb-2">{t('demand.topBranded')}</h4>
                {awareness.topBranded.length > 0 ? (
                  <ol className="space-y-1 text-xs text-gray-700">
                    {awareness.topBranded.map((tr, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="truncate pr-2">{i + 1}. {tr.searchTerm}</span>
                        <span className="text-gray-400">#{tr.rank}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-gray-400">{t('demand.noData')}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-xs font-bold text-gray-600 mb-2">{t('demand.topGeneric')}</h4>
                {awareness.topGeneric.length > 0 ? (
                  <ol className="space-y-1 text-xs text-gray-700">
                    {awareness.topGeneric.map((tr, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="truncate pr-2">{i + 1}. {tr.searchTerm}</span>
                        <span className="text-gray-400">#{tr.rank}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-gray-400">{t('demand.noData')}</p>
                )}
              </div>
            </div>
          </section>

          {/* ─── Section 2: Generic Traffic Loss ─── */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('demand.section2')}
            </h3>
            {genericLoss.losses.length > 0 ? (
              <>
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2 mb-4 font-medium">
                  {t('demand.genericLossSummary', { pct: genericLoss.avgLossPct })}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('demand.term')}</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('demand.myCS')}</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('demand.leadingComp')}</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('demand.theirCS')}</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('demand.gap')}</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-600">{t('demand.lossEstimate')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {genericLoss.losses.slice(0, 15).map((l, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800 truncate max-w-[200px]">{l.searchTerm}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{l.myCS.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-gray-700">{l.leadingComp}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{l.theirCS.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-right font-bold text-red-600">{l.gap}%</td>
                          <td className="px-3 py-2 text-center"><SeverityBadge level={l.lossTier} t={t} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t('demand.noData')}</p>
            )}
          </section>

          {/* ─── Section 3: Branded Traffic Loss ─── */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              {t('demand.section3')}
            </h3>
            {brandedLoss.losses.length > 0 ? (
              <>
                <p className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-2 mb-4 font-medium">
                  {t('demand.brandedLossSummary', { pct: brandedLoss.capturedPct })}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('demand.term')}</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('demand.myCS')}</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('demand.compStealingClicks')}</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('demand.theirCS')}</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">{t('demand.gap')}</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-600">{t('demand.severity')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {brandedLoss.losses.slice(0, 15).map((l, i) => (
                        <tr key={i} className={`hover:bg-gray-50 ${l.severity === 'critical' ? 'bg-red-50/50' : ''}`}>
                          <td className="px-3 py-2 font-medium text-gray-800 truncate max-w-[200px]">{l.searchTerm}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{l.myCS.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-gray-700">{l.compName}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{l.theirCS.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-right font-bold text-red-600">{l.gap}%</td>
                          <td className="px-3 py-2 text-center"><SeverityBadge level={l.severity} t={t} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t('demand.noData')}</p>
            )}
          </section>

          {/* ─── Section 4: Demand Health Score ─── */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              {t('demand.section4')}
            </h3>

            <div className="flex flex-col items-center mb-6">
              <ScoreGauge score={healthScore.score} />
              <div className="flex items-center gap-6 text-xs text-gray-500 mt-2">
                <span>Awareness: {healthScore.awarenessPoints}/40</span>
                <span>Generic: {healthScore.genericPoints}/30</span>
                <span>Branded: {healthScore.brandedPoints}/30</span>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-xs font-bold text-gray-600 mb-1">{t('demand.healthDiagnosis')}</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{diagnosis}</p>
            </div>

            {/* Actions */}
            <div>
              <h4 className="text-xs font-bold text-gray-600 mb-2">{t('demand.actions')}</h4>
              <ol className="space-y-2">
                {actions.map((action, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
