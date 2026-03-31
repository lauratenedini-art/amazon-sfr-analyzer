/**
 * Run the full Demand Intelligence Report from analysed terms.
 * All calculations are in-memory, no API calls.
 */

function rankWeight(rank) {
  if (rank === Infinity || rank <= 0) return 0;
  return 1 / rank;
}

// ──────────────────────────────────────────────
// Section 1 — Brand Awareness Signal
// ──────────────────────────────────────────────

export function computeBrandAwareness(allTerms) {
  const brandedTerms = allTerms.filter((t) => t.classification === 'myBrand');
  const genericTerms = allTerms.filter((t) => t.classification === 'generic');

  const brandedWeight = brandedTerms.reduce((s, t) => s + rankWeight(t.rank), 0);
  const genericWeight = genericTerms.reduce((s, t) => s + rankWeight(t.rank), 0);

  const ratio = genericWeight > 0 ? (brandedWeight / genericWeight) * 100 : 0;

  let tier, tierKey;
  if (ratio >= 60) {
    tier = 'topOfMind';
    tierKey = 'demand.topOfMindDesc';
  } else if (ratio >= 20) {
    tier = 'challenger';
    tierKey = 'demand.challengerDesc';
  } else {
    tier = 'invisible';
    tierKey = 'demand.invisibleDesc';
  }

  const topBranded = brandedTerms
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);
  const topGeneric = genericTerms
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);

  return {
    brandedWeight,
    genericWeight,
    ratio: Math.round(ratio * 10) / 10,
    tier,
    tierKey,
    topBranded,
    topGeneric,
    brandedCount: brandedTerms.length,
    genericCount: genericTerms.length,
  };
}

// ──────────────────────────────────────────────
// Section 2 — Traffic Loss from Generic Terms
// ──────────────────────────────────────────────

export function computeGenericTrafficLoss(allTerms) {
  const losses = allTerms
    .filter((t) => {
      if (t.classification !== 'generic') return false;
      if (t.rank > 500 && t.rank !== Infinity) return false;
      if (t.rank === Infinity) return false;
      // Competitor outperforms or brand is absent
      return t.isAbsent || t.isLosing;
    })
    .map((t) => {
      const leadComp = t.products[0];
      const gap = t.isAbsent
        ? leadComp.clickShare
        : leadComp.clickShare - t.ownClickShare;
      let lossTier;
      if (gap >= 15) lossTier = 'high';
      else if (gap >= 5) lossTier = 'medium';
      else lossTier = 'low';
      return {
        searchTerm: t.searchTerm,
        rank: t.rank,
        myCS: t.ownClickShare,
        leadingComp: leadComp.brand.name,
        theirCS: leadComp.clickShare,
        gap: Math.round(gap * 10) / 10,
        lossTier,
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const totalGap =
    losses.length > 0
      ? Math.round(
          (losses.reduce((s, l) => s + l.gap, 0) / losses.length) * 10
        ) / 10
      : 0;

  return { losses, avgLossPct: totalGap };
}

// ──────────────────────────────────────────────
// Section 3 — Traffic Loss from Branded Terms
// ──────────────────────────────────────────────

export function computeBrandedTrafficLoss(allTerms) {
  const losses = allTerms
    .filter((t) => {
      if (t.classification !== 'myBrand') return false;
      // A competitor has higher CS, or my brand term but none of my ASINs in top 3
      return t.isAbsent || t.isLosing;
    })
    .map((t) => {
      const stealingComp = t.products.find(
        (p) => !p.isOwn && p.clickShare > t.ownClickShare
      ) || t.products[0];

      const gap = stealingComp.clickShare - t.ownClickShare;
      const severity = gap >= 10 ? 'critical' : 'warning';
      return {
        searchTerm: t.searchTerm,
        rank: t.rank,
        myCS: t.ownClickShare,
        compName: stealingComp.brand.name,
        theirCS: stealingComp.clickShare,
        gap: Math.round(gap * 10) / 10,
        severity,
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const totalBrandedTerms = allTerms.filter(
    (t) => t.classification === 'myBrand'
  ).length;
  const capturedPct =
    totalBrandedTerms > 0
      ? Math.round((losses.length / totalBrandedTerms) * 1000) / 10
      : 0;

  return { losses, capturedPct };
}

// ──────────────────────────────────────────────
// Section 4 — Demand Health Score (0-100)
// ──────────────────────────────────────────────

export function computeHealthScore(awareness, genericLoss, brandedLoss, allTerms) {
  // Awareness component (40 pts)
  let awarenessPoints;
  if (awareness.tier === 'topOfMind') awarenessPoints = 40;
  else if (awareness.tier === 'challenger') awarenessPoints = 25;
  else awarenessPoints = 10;

  // Generic retention (30 pts)
  const genericTerms = allTerms.filter((t) => t.classification === 'generic');
  const genericLeading = genericTerms.filter((t) => t.isLeading).length;
  const genericRetention =
    genericTerms.length > 0 ? genericLeading / genericTerms.length : 0;
  const genericPoints = Math.round(genericRetention * 30);

  // Branded retention (30 pts)
  const brandedTerms = allTerms.filter((t) => t.classification === 'myBrand');
  const brandedLeading = brandedTerms.filter((t) => t.isLeading).length;
  const brandedRetention =
    brandedTerms.length > 0 ? brandedLeading / brandedTerms.length : 0;
  const brandedPoints = Math.round(brandedRetention * 30);

  const score = awarenessPoints + genericPoints + brandedPoints;

  return {
    score: Math.min(100, score),
    awarenessPoints,
    genericPoints,
    brandedPoints,
    genericRetention: Math.round(genericRetention * 100),
    brandedRetention: Math.round(brandedRetention * 100),
  };
}

/**
 * Generate 3 prioritised action items based on analysis results.
 */
export function generateActions(awareness, genericLoss, brandedLoss, lang) {
  const actions = [];

  // Action based on branded traffic loss
  if (brandedLoss.losses.length > 0) {
    const top = brandedLoss.losses[0];
    actions.push({
      en: `Urgent: Protect branded search traffic. "${top.searchTerm}" is losing ${top.gap}% CS to ${top.compName}. Optimize listing content and run Sponsored Brand ads.`,
      pt: `Urgente: Proteja o tráfego de busca da marca. "${top.searchTerm}" está perdendo ${top.gap}% CS para ${top.compName}. Otimize o conteúdo da listagem e rode anúncios de Marca Patrocinada.`,
      es: `Urgente: Protege el tráfico de búsqueda de marca. "${top.searchTerm}" está perdiendo ${top.gap}% CS ante ${top.compName}. Optimiza el contenido del listing y activa anuncios de Marca Patrocinada.`,
    });
  }

  // Action based on generic traffic loss
  if (genericLoss.losses.length > 0) {
    const count = genericLoss.losses.length;
    actions.push({
      en: `Content gap: ${count} generic high-volume terms where competitors lead. Add top terms to product titles and bullet points.`,
      pt: `Gap de conteúdo: ${count} termos genéricos de alto volume onde concorrentes lideram. Adicione os principais termos aos títulos e bullet points.`,
      es: `Brecha de contenido: ${count} términos genéricos de alto volumen donde competidores lideran. Agrega los principales términos a títulos y bullet points.`,
    });
  }

  // Action based on awareness tier
  if (awareness.tier === 'invisible') {
    actions.push({
      en: 'Brand awareness is low. Invest in Sponsored Brand campaigns and video ads to build category recognition.',
      pt: 'Reconhecimento de marca está baixo. Invista em campanhas de Marca Patrocinada e anúncios em vídeo para construir reconhecimento na categoria.',
      es: 'El reconocimiento de marca es bajo. Invierte en campañas de Marca Patrocinada y anuncios en video para construir reconocimiento en la categoría.',
    });
  } else if (awareness.tier === 'challenger') {
    actions.push({
      en: 'Brand is growing — double down on generic term optimization to capture more unbranded demand.',
      pt: 'A marca está crescendo — intensifique a otimização de termos genéricos para capturar mais demanda sem marca.',
      es: 'La marca está creciendo — intensifica la optimización de términos genéricos para capturar más demanda sin marca.',
    });
  } else {
    actions.push({
      en: 'Strong brand presence. Focus on defending branded terms and expanding into adjacent generic keywords.',
      pt: 'Presença de marca forte. Foque em defender termos de marca e expandir para palavras-chave genéricas adjacentes.',
      es: 'Fuerte presencia de marca. Enfócate en defender términos de marca y expandir hacia palabras clave genéricas adyacentes.',
    });
  }

  return actions.slice(0, 3).map((a) => a[lang] || a.en);
}

/**
 * Generate a one-paragraph diagnosis based on the health score.
 */
export function generateDiagnosis(healthScore, awareness, lang) {
  const s = healthScore.score;

  const diagnoses = {
    en:
      s >= 75
        ? `Your demand health is strong (${s}/100). Your brand has good category presence and retains most branded traffic. Focus on incremental gains in generic terms and defending your position.`
        : s >= 50
          ? `Your demand health is moderate (${s}/100). There are significant opportunities to capture more generic traffic and some branded terms are leaking to competitors. Prioritize content optimization and brand defense.`
          : s >= 25
            ? `Your demand health needs attention (${s}/100). Competitors are outperforming you on most generic terms and some branded traffic is being captured. A comprehensive content overhaul and advertising push are recommended.`
            : `Your demand health is critical (${s}/100). Your brand has minimal visibility in search results. Immediate action is needed: optimize all product listings, launch aggressive Sponsored Products campaigns, and invest in brand awareness.`,
    pt:
      s >= 75
        ? `A saúde da sua demanda é forte (${s}/100). Sua marca tem boa presença na categoria e retém a maior parte do tráfego de marca. Foque em ganhos incrementais em termos genéricos e defesa da sua posição.`
        : s >= 50
          ? `A saúde da sua demanda é moderada (${s}/100). Existem oportunidades significativas para capturar mais tráfego genérico e alguns termos de marca estão vazando para concorrentes. Priorize otimização de conteúdo e defesa da marca.`
          : s >= 25
            ? `A saúde da sua demanda precisa de atenção (${s}/100). Concorrentes estão superando você na maioria dos termos genéricos e parte do tráfego de marca está sendo capturado. Uma revisão completa de conteúdo e impulso publicitário são recomendados.`
            : `A saúde da sua demanda é crítica (${s}/100). Sua marca tem visibilidade mínima nos resultados de busca. Ação imediata é necessária: otimize todas as listagens, lance campanhas agressivas de Produtos Patrocinados e invista em reconhecimento de marca.`,
    es:
      s >= 75
        ? `La salud de tu demanda es fuerte (${s}/100). Tu marca tiene buena presencia en la categoría y retiene la mayoría del tráfico de marca. Enfócate en ganancias incrementales en términos genéricos y defender tu posición.`
        : s >= 50
          ? `La salud de tu demanda es moderada (${s}/100). Hay oportunidades significativas para capturar más tráfico genérico y algunos términos de marca están filtrándose a competidores. Prioriza la optimización de contenido y defensa de marca.`
          : s >= 25
            ? `La salud de tu demanda necesita atención (${s}/100). Los competidores te superan en la mayoría de términos genéricos y parte del tráfico de marca está siendo capturado. Se recomienda una revisión completa de contenido e impulso publicitario.`
            : `La salud de tu demanda es crítica (${s}/100). Tu marca tiene visibilidad mínima en los resultados de búsqueda. Se necesita acción inmediata: optimiza todos los listings, lanza campañas agresivas de Productos Patrocinados e invierte en reconocimiento de marca.`,
  };

  return diagnoses[lang] || diagnoses.en;
}
