import { Hash, Search, EyeOff, TrendingDown, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SummaryCards({ data }) {
  const { t } = useLanguage();

  const totalTerms = data.length;
  const genericTerms = data.filter((d) => d.classification === 'generic').length;
  const absentTerms = data.filter((d) => d.isAbsent).length;
  const competitorOutperforms = data.filter(
    (d) => d.csGap > 0 && !d.isLeading
  ).length;
  const gaps = data.filter((d) => d.csGap > 0);
  const avgGap =
    gaps.length > 0
      ? (gaps.reduce((s, d) => s + d.csGap, 0) / gaps.length).toFixed(1)
      : '0.0';

  const cards = [
    {
      icon: Hash,
      label: t('summary.totalTerms'),
      value: totalTerms.toLocaleString(),
      accent: 'blue',
    },
    {
      icon: Search,
      label: t('summary.genericTerms'),
      value: genericTerms.toLocaleString(),
      accent: 'indigo',
    },
    {
      icon: EyeOff,
      label: t('summary.brandAbsent'),
      value: absentTerms.toLocaleString(),
      accent: 'red',
    },
    {
      icon: TrendingDown,
      label: t('summary.competitorOutperforms'),
      value: competitorOutperforms.toLocaleString(),
      accent: 'amber',
    },
    {
      icon: TrendingUp,
      label: t('summary.avgGap'),
      value: `${avgGap}%`,
      accent: 'emerald',
    },
  ];

  const colors = {
    blue: { icon: 'bg-blue-50 text-blue-600', border: 'border-l-blue-500' },
    indigo: { icon: 'bg-indigo-50 text-indigo-600', border: 'border-l-indigo-500' },
    red: { icon: 'bg-red-50 text-red-600', border: 'border-l-red-500' },
    amber: { icon: 'bg-amber-50 text-amber-600', border: 'border-l-amber-500' },
    emerald: { icon: 'bg-emerald-50 text-emerald-600', border: 'border-l-emerald-500' },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`bg-white rounded-xl border border-gray-200 border-l-4 ${colors[card.accent].border} p-4 shadow-sm`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-1.5 rounded-lg ${colors[card.accent].icon}`}>
              <card.icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-gray-500 leading-tight">
              {card.label}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
