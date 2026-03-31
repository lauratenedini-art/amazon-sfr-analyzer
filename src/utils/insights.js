/**
 * Generate a structured heuristic insight for a single term.
 * Returns { whyUse: string[], whyNot: string[], recommendation: string, placements: string[] }
 * All values are i18n keys — the UI resolves them via t().
 */
export function generateInsight(term) {
  const whyUse = [];
  const whyNot = [];
  const placements = [];

  // --- Volume signal ---
  if (term.rank !== Infinity && term.rank <= 100) {
    whyUse.push('insight.highVolume');
  } else if (term.rank <= 500) {
    whyUse.push('insight.medVolume');
  } else {
    whyNot.push('insight.highRankLowVol');
  }

  // --- CS gap signal ---
  if (term.csGap >= 15) {
    whyUse.push('insight.bigGap');
  } else if (term.csGap >= 5) {
    whyUse.push('insight.modGap');
  } else if (term.csGap > 0) {
    whyUse.push('insight.smallGap');
  }

  // --- Presence signal ---
  if (term.isAbsent) {
    whyUse.push('insight.absentSignal');
  } else if (term.isLosing) {
    whyUse.push('insight.presentLosing');
  }

  // --- Classification signal ---
  if (term.classification === 'generic') {
    whyUse.push('insight.genericSignal');
  } else if (term.classification === 'competitor') {
    whyNot.push('insight.competitorRisk');
  } else if (term.classification === 'mixed') {
    whyNot.push('insight.mixedSignal');
  }

  // --- Conversion signals ---
  const prodsWithConv = term.products.filter((p) => p.conversionShare > 0);
  const avgConv =
    prodsWithConv.length > 0
      ? prodsWithConv.reduce((s, p) => s + p.conversionShare, 0) / prodsWithConv.length
      : 0;
  if (avgConv > 0 && avgConv < 5) {
    whyNot.push('insight.lowConversion');
  }

  // Own product: high clicks but low conversion → listing mismatch
  const ownProd = term.ownProduct;
  if (ownProd && ownProd.clickShare >= 10 && ownProd.conversionShare < 3) {
    whyNot.push('insight.highClickLowConv');
  }

  // Own product: high conversion but low clicks → needs visibility
  if (ownProd && ownProd.conversionShare >= 10 && ownProd.clickShare < 5) {
    whyUse.push('insight.highConvLowClick');
  }

  // Top competitor has strong click + conversion → tough competition
  const topProd = term.products[0];
  if (!topProd.isOwn && topProd.clickShare >= 15 && topProd.conversionShare >= 10) {
    whyNot.push('insight.strongCompetitorConv');
  }

  // --- Recommendation ---
  let recommendation;
  if (term.classification === 'competitor') {
    recommendation = 'insight.avoidCompetitor';
  } else if (term.opportunityScore >= 65 && term.classification === 'generic') {
    recommendation = 'insight.prioritize';
  } else if (
    term.opportunityScore >= 35 &&
    (term.classification === 'generic' || term.classification === 'mixed')
  ) {
    recommendation = 'insight.testSP';
  } else {
    recommendation = 'insight.monitorOnly';
  }

  // --- Placement suggestions ---
  if (term.classification !== 'competitor') {
    if (term.opportunityScore >= 65 && term.rank <= 200) {
      placements.push('insight.titlePlacement');
      placements.push('insight.bulletPlacement');
    } else if (term.opportunityScore >= 40 && term.rank <= 500) {
      placements.push('insight.bulletPlacement');
      placements.push('insight.backendPlacement');
    } else if (term.opportunityScore >= 20) {
      placements.push('insight.backendPlacement');
    }
    if (
      term.classification === 'generic' &&
      term.csGap >= 10 &&
      term.opportunityScore >= 30
    ) {
      placements.push('insight.spPlacement');
    }
  }

  // Ensure we never leave arrays empty
  if (whyUse.length === 0) whyUse.push('insight.lowVolume');
  if (whyNot.length === 0) whyNot.push('insight.smallGap');

  return { whyUse, whyNot, recommendation, placements };
}
