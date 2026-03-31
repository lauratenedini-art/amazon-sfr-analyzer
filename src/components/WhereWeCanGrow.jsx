import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Rocket, Shield, Zap, FileText, Package } from 'lucide-react';

const fitBadge = {
  highest: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  monitor: 'bg-gray-100 text-gray-500',
};

export default function WhereWeCanGrow({ data, filters }) {
  const { t } = useLanguage();

  const analysis = useMemo(() => {
    // --- Top 10 generic opportunities ---
    const top10 = data
      .filter((d) => d.classification === 'generic')
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10)
      .map((d) => {
        let rationale;
        if (d.isAbsent && d.rank <= 200) rationale = 'growth.absentOpp';
        else if (d.opportunityScore >= 65) rationale = 'growth.highOpp';
        else rationale = 'growth.medOpp';
        return { ...d, rationale };
      });

    // --- Competitor strongholds (CS > 8%, my brand absent) ---
    const strongholdTerms = data.filter(
      (d) =>
        d.classification === 'generic' &&
        d.isAbsent &&
        d.products[0].clickShare > 8
    );
    const strongholdMap = {};
    strongholdTerms.forEach((d) => {
      const comp = d.products[0].brand.name;
      if (!strongholdMap[comp]) strongholdMap[comp] = [];
      strongholdMap[comp].push(d);
    });
    Object.values(strongholdMap).forEach((arr) =>
      arr.sort((a, b) => a.rank - b.rank)
    );

    // --- Quick wins (my brand in top 3, CS gap to #1 < 3%) ---
    const quickWins = data
      .filter(
        (d) =>
          d.ownProduct &&
          !d.isLeading &&
          d.csGap > 0 &&
          d.csGap < 3 &&
          d.classification === 'generic'
      )
      .sort((a, b) => a.csGap - b.csGap)
      .slice(0, 15);

    // --- Content recommendations ---
    const genericTerms = data.filter((d) => d.classification === 'generic');
    const titleTerms = genericTerms
      .filter((d) => d.opportunityScore >= 65 && d.rank <= 200)
      .slice(0, 10);
    const bulletTerms = genericTerms
      .filter(
        (d) => d.opportunityScore >= 40 && d.opportunityScore < 65 && d.rank <= 500
      )
      .slice(0, 10);
    const backendTerms = genericTerms
      .filter((d) => d.opportunityScore >= 20 && d.opportunityScore < 40)
      .slice(0, 10);
    const spTerms = genericTerms
      .filter((d) => d.csGap >= 10 && d.opportunityScore >= 30)
      .slice(0, 10);

    // --- ASIN-level breakdown (if filtering by ASIN) ---
    let asinBreakdown = null;
    if (filters.filterMode === 'asin' && filters.filterValue) {
      const asin = filters.filterValue;
      const termsWithAsin = data.filter((d) =>
        d.products.some((p) => p.asin === asin)
      );
      const wins = termsWithAsin.filter(
        (d) => d.products[0].asin === asin
      ).length;
      const gaps = termsWithAsin.filter(
        (d) =>
          d.products.some((p) => p.asin === asin && p.position > 1) &&
          d.products[0].asin !== asin
      ).length;
      const absent = data.filter(
        (d) => !d.products.some((p) => p.asin === asin) && d.classification === 'generic'
      ).length;

      asinBreakdown = {
        asin,
        total: termsWithAsin.length,
        wins,
        gaps,
        opportunities: absent,
      };
    }

    return {
      top10,
      strongholdMap,
      quickWins,
      titleTerms,
      bulletTerms,
      backendTerms,
      spTerms,
      asinBreakdown,
    };
  }, [data, filters]);

  // ── Section component ──
  const Section = ({ icon: Icon, color, title, description, children }) => (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 border-b border-gray-100 bg-${color}-50/40`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 text-${color}-600`} />
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );

  // ── Term list item ──
  const TermRow = ({ term, extra }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-800 truncate block">
          {term.searchTerm}
        </span>
        {extra && <span className="text-xs text-gray-400">{extra}</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {term.rank !== Infinity && (
          <span className="text-xs text-gray-400">#{term.rank}</span>
        )}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${fitBadge[term.fitLevel]}`}
        >
          {term.opportunityScore}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Rocket className="h-5 w-5 text-emerald-600" />
        {t('growth.title')}
      </h2>

      {/* Top 10 Opportunities */}
      <Section
        icon={Rocket}
        color="emerald"
        title={t('growth.top10')}
      >
        {analysis.top10.length > 0 ? (
          <div>
            {analysis.top10.map((term, i) => (
              <div key={i}>
                <TermRow
                  term={term}
                  extra={`${t('growth.rationale')}: ${t(term.rationale)}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('table.noResults')}</p>
        )}
      </Section>

      {/* Competitor Strongholds */}
      <Section
        icon={Shield}
        color="red"
        title={t('growth.strongholds')}
        description={t('growth.strongholdsDesc')}
      >
        {Object.keys(analysis.strongholdMap).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(analysis.strongholdMap)
              .sort(([, a], [, b]) => b.length - a.length)
              .slice(0, 5)
              .map(([comp, terms]) => (
                <div key={comp}>
                  <h4 className="text-sm font-bold text-purple-700 mb-1">
                    {comp}{' '}
                    <span className="text-xs font-normal text-gray-400">
                      ({terms.length} terms)
                    </span>
                  </h4>
                  {terms.slice(0, 5).map((term, i) => (
                    <TermRow
                      key={i}
                      term={term}
                      extra={`${term.products[0].clickShare.toFixed(1)}% CS`}
                    />
                  ))}
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-green-600 font-medium">{t('growth.noStrongholds')}</p>
        )}
      </Section>

      {/* Quick Wins */}
      <Section
        icon={Zap}
        color="amber"
        title={t('growth.quickWins')}
        description={t('growth.quickWinsDesc')}
      >
        {analysis.quickWins.length > 0 ? (
          <div>
            {analysis.quickWins.map((term, i) => (
              <TermRow
                key={i}
                term={term}
                extra={`${t('growth.rationale')}: ${t('growth.closeToWin')} (gap: ${term.csGap.toFixed(1)}%)`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('growth.noQuickWins')}</p>
        )}
      </Section>

      {/* Content Recommendations */}
      <Section
        icon={FileText}
        color="indigo"
        title={t('growth.contentRecs')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'addToTitle', terms: analysis.titleTerms, color: 'blue' },
            { key: 'addToBullets', terms: analysis.bulletTerms, color: 'indigo' },
            { key: 'addToBackend', terms: analysis.backendTerms, color: 'gray' },
            { key: 'addToSP', terms: analysis.spTerms, color: 'purple' },
          ].map(({ key, terms, color }) => (
            <div key={key} className={`bg-${color}-50/50 rounded-lg p-4`}>
              <h4 className="text-xs font-bold text-gray-700 mb-2">
                {t(`growth.${key}`)}
              </h4>
              {terms.length > 0 ? (
                <ul className="space-y-1">
                  {terms.map((term, i) => (
                    <li key={i} className="text-xs text-gray-600 truncate">
                      &bull; {term.searchTerm}
                      <span className="text-gray-400 ml-1">
                        (#{term.rank}, score {term.opportunityScore})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">—</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ASIN-level breakdown (only when ASIN filter is active) */}
      {analysis.asinBreakdown && (
        <Section
          icon={Package}
          color="blue"
          title={`${t('growth.asinBreakdown')} — ${analysis.asinBreakdown.asin}`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('growth.termsPresent'), value: analysis.asinBreakdown.total, color: 'blue' },
              { label: t('growth.wins'), value: analysis.asinBreakdown.wins, color: 'green' },
              { label: t('growth.gaps'), value: analysis.asinBreakdown.gaps, color: 'amber' },
              { label: t('growth.opportunities'), value: analysis.asinBreakdown.opportunities, color: 'red' },
            ].map(({ label, value, color }, i) => (
              <div key={i} className={`text-center p-3 bg-${color}-50 rounded-lg`}>
                <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
