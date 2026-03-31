// ────────────────────────────────────────────────────────────────
// Text normalisation helpers
// ────────────────────────────────────────────────────────────────

/** Strip accents and lowercase. */
function normalise(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Check if `text` contains `word` as a substring (case-insensitive, accent-stripped). */
function containsWord(text, word) {
  if (!word) return false;
  const nText = normalise(text);
  const nWord = normalise(word);
  return nText.includes(nWord);
}

// ────────────────────────────────────────────────────────────────
// Auto-detect competitors from data
// ────────────────────────────────────────────────────────────────

/**
 * Scan all product titles across all terms and extract competitor brand names.
 * STRICT: only considers brands from search terms where the user's own
 * brand/ASINs also appear (direct overlap = true competitors).
 * Groups by ASIN first, then uses weighted frequency analysis.
 *
 * Returns an array of brand name strings, sorted by frequency.
 */
export function detectCompetitors(terms, config) {
  const { brandName, brandAliases, ownIdentifiers } = config;
  const ownBrands = [brandName, ...brandAliases]
    .filter(Boolean)
    .map((b) => normalise(b));
  const ownIds = (ownIdentifiers || []).map((id) => id.trim().toUpperCase());

  // Helper: check if a product belongs to the user
  const isOwnProd = (p) => {
    const asin = p.asin.toUpperCase();
    if (ownIds.some((id) => id && asin === id)) return true;
    const nTitle = normalise(p.title);
    return ownBrands.some((b) => nTitle.includes(b));
  };

  // Step 0: Only consider terms where our brand/ASINs appear (direct overlap)
  const overlappingTerms = terms.filter((term) =>
    term.products.some((p) => isOwnProd(p))
  );

  // If our brand doesn't appear anywhere, fall back to all terms
  const sourceTerms = overlappingTerms.length > 0 ? overlappingTerms : terms;

  // Step 1: Group unique ASINs → title, and count how many terms each ASIN appears in
  const asinData = new Map(); // ASIN → { title, termCount }
  sourceTerms.forEach((term) => {
    term.products.forEach((p) => {
      if (!p.asin || !p.title) return;
      const key = p.asin.toUpperCase();
      if (asinData.has(key)) {
        asinData.get(key).termCount++;
      } else {
        asinData.set(key, { title: p.title, termCount: 1 });
      }
    });
  });

  // Step 2: For each unique ASIN, extract candidate brand names from title
  // Try first 1, 2, and 3 words
  const candidateFreq = new Map(); // candidate → { weight, asinCount }

  asinData.forEach(({ title, termCount }, asin) => {
    // Skip our own ASINs
    if (ownIds.includes(asin)) return;
    // Skip if title contains our own brand
    const nTitle = normalise(title);
    if (ownBrands.some((b) => nTitle.includes(b))) return;

    const words = title.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const candidates = [];
    if (words[0] && words[0].length > 1) candidates.push(words[0]);
    if (words.length >= 2) candidates.push(`${words[0]} ${words[1]}`);
    if (words.length >= 3) candidates.push(`${words[0]} ${words[1]} ${words[2]}`);

    candidates.forEach((raw) => {
      const c = normalise(raw);
      // Skip very short, numeric-only, or own-brand candidates
      if (c.length < 2 || /^\d+$/.test(c)) return;
      if (ownBrands.some((b) => c.includes(b) || b.includes(c))) return;

      if (!candidateFreq.has(c)) {
        candidateFreq.set(c, { weight: 0, asins: new Set() });
      }
      const entry = candidateFreq.get(c);
      entry.weight += termCount;
      entry.asins.add(asin);
    });
  });

  // Step 3: Filter — need 2+ unique ASINs to qualify as a real brand
  const viable = [...candidateFreq.entries()]
    .filter(([, v]) => v.asins.size >= 2)
    .map(([name, v]) => ({
      name,
      weight: v.weight,
      asinCount: v.asins.size,
    }))
    .sort((a, b) => b.weight - a.weight);

  // Step 4: Deduplicate — if "sony" and "sony wh" both exist and "sony" has
  // similar or higher weight, prefer the shorter (cleaner) form
  const deduped = [];
  const used = new Set();
  for (const item of viable) {
    // Skip if a shorter prefix of this candidate is already selected
    const dominated = deduped.some(
      (d) => item.name.startsWith(d.name + ' ') && item.weight <= d.weight * 1.3
    );
    if (dominated) continue;

    // Skip if this is a substring of an already-selected longer candidate
    // with a much higher weight
    const dominates = deduped.findIndex(
      (d) => d.name.startsWith(item.name + ' ') && d.weight > item.weight * 0.7
    );
    if (dominates >= 0) continue;

    if (!used.has(item.name)) {
      deduped.push(item);
      used.add(item.name);
    }
  }

  // Step 5: Return top 20 brand names, title-cased for display
  return deduped.slice(0, 20).map((d) => {
    // Title-case: capitalize first letter of each word
    return d.name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  });
}

// ────────────────────────────────────────────────────────────────
// Classification
// ────────────────────────────────────────────────────────────────

/**
 * Classify a search term into one of four buckets:
 *   'generic' | 'myBrand' | 'competitor' | 'mixed'
 *
 * Rules:
 *   - myBrand: contains my brand name, aliases, or product names
 *   - competitor: contains a competitor brand name
 *   - mixed: contains both my brand AND a competitor
 *   - generic: contains no brand or product name from anyone
 */
export function classifyTerm(searchTerm, config) {
  const { brandName, brandAliases, competitorBrands, ownIdentifiers } = config;

  const allMyBrands = [brandName, ...brandAliases].filter(Boolean);
  // Also check own product identifiers (product names, not ASINs)
  const ownProductNames = (ownIdentifiers || []).filter(
    (id) => id && id.trim().length > 2 && !/^B0[A-Z0-9]{8,}$/i.test(id.trim())
  );
  const allMyIdentifiers = [...allMyBrands, ...ownProductNames].filter(Boolean);

  const containsMyBrand = allMyIdentifiers.some((b) =>
    containsWord(searchTerm, b)
  );
  const containsCompetitor = competitorBrands.some((b) =>
    containsWord(searchTerm, b)
  );

  if (containsMyBrand && containsCompetitor) return 'mixed';
  if (containsCompetitor) return 'competitor';
  if (containsMyBrand) return 'myBrand';
  return 'generic';
}

// ────────────────────────────────────────────────────────────────
// Brand identification for product positions
// ────────────────────────────────────────────────────────────────

export function identifyBrand(product, config) {
  const { brandName, brandAliases, competitorBrands } = config;
  const title = product.title.toLowerCase();

  const allUserBrands = [brandName, ...brandAliases].filter(Boolean);
  if (allUserBrands.some((b) => b && title.includes(normalise(b)))) {
    return { type: 'own', name: brandName };
  }

  for (const comp of competitorBrands) {
    if (comp && title.includes(normalise(comp))) {
      return { type: 'competitor', name: comp };
    }
  }

  const words = product.title.split(/\s+/).filter(Boolean);
  return { type: 'other', name: words.slice(0, 2).join(' ') || 'Unknown' };
}

export function isOwnProduct(product, config) {
  const { brandName, brandAliases, ownIdentifiers } = config;
  const title = normalise(product.title);
  const asin = product.asin.toUpperCase();

  if (ownIdentifiers) {
    for (const id of ownIdentifiers) {
      const trimmed = id.trim();
      if (!trimmed) continue;
      if (asin === trimmed.toUpperCase()) return true;
      if (trimmed.length > 2 && title.includes(normalise(trimmed))) return true;
    }
  }

  const allBrands = [brandName, ...brandAliases].filter(Boolean);
  return allBrands.some((b) => b && title.includes(normalise(b)));
}

// ────────────────────────────────────────────────────────────────
// Main analysis pipeline — processes ALL terms (no filtering)
// ────────────────────────────────────────────────────────────────

export function classifyAndScore(rawTerms, config) {
  // --- Pass 1: enrich every term ---
  const enriched = rawTerms.map((term) => {
    const classification = classifyTerm(term.searchTerm, config);

    const products = term.products.map((p) => ({
      ...p,
      brand: identifyBrand(p, config),
      isOwn: isOwnProduct(p, config),
    }));

    const ownProduct = products.find((p) => p.isOwn) || null;
    const topProduct = products[0];
    const isTopOwn = topProduct.isOwn;
    const ownClickShare = ownProduct ? ownProduct.clickShare : 0;
    const csGap = Math.max(topProduct.clickShare - ownClickShare, 0);
    const isAbsent = !ownProduct;
    const isLosing = !isAbsent && !isTopOwn;
    const isLeading = !isAbsent && isTopOwn;

    return {
      ...term,
      products,
      classification,
      ownProduct,
      ownPosition: ownProduct ? ownProduct.position : null,
      ownClickShare,
      topCompetitor: isTopOwn ? products[1] : topProduct,
      csGap,
      isAbsent,
      isLosing,
      isLeading,
    };
  });

  // --- Pass 2: normalize and score ---
  const ranks = enriched.map((d) => d.rank).filter((r) => r !== Infinity);
  const maxRank = Math.max(...ranks, 1);
  const gaps = enriched.map((d) => d.csGap).filter((g) => g > 0);
  const maxGap = Math.max(...gaps, 1);

  return enriched
    .map((term) => {
      const normalizedRank =
        term.rank === Infinity ? 0 : ((maxRank - term.rank) / maxRank) * 100;
      const normalizedGap = term.csGap > 0 ? (term.csGap / maxGap) * 100 : 0;
      const absenceScore = term.isAbsent ? 100 : 0;

      let opportunityScore = Math.round(
        normalizedRank * 0.3 + normalizedGap * 0.4 + absenceScore * 0.3
      );

      // Penalty for competitor-branded terms (less actionable)
      if (term.classification === 'competitor') {
        opportunityScore = Math.round(opportunityScore * 0.5);
      } else if (term.classification === 'mixed') {
        opportunityScore = Math.round(opportunityScore * 0.7);
      }
      // Boost if my brand leads
      if (term.isLeading) {
        opportunityScore = Math.max(opportunityScore, 5);
      }

      // Conversion bonus/penalty
      if (term.ownProduct) {
        const ownConv = term.ownProduct.conversionShare;
        if (ownConv >= 10) {
          opportunityScore = Math.min(100, opportunityScore + 5);
        }
        if (term.ownProduct.clickShare >= 10 && ownConv < 2) {
          opportunityScore = Math.max(0, opportunityScore - 3);
        }
      }

      opportunityScore = Math.min(100, Math.max(0, opportunityScore));

      let fitLevel;
      if (opportunityScore >= 65) fitLevel = 'highest';
      else if (opportunityScore >= 40) fitLevel = 'high';
      else if (opportunityScore >= 20) fitLevel = 'medium';
      else fitLevel = 'monitor';

      return { ...term, opportunityScore, fitLevel };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}
