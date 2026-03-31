// ────────────────────────────────────────────────────────────────
// Stop words (EN + PT + ES) — filtered out during category detection
// ────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // English
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'are', 'was',
  'be', 'have', 'has', 'had', 'not', 'no', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'can', 'so', 'if', 'my', 'your',
  'his', 'her', 'its', 'our', 'up', 'as', 'de', 'best', 'top', 'new',
  // Portuguese
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'e', 'ou', 'mas',
  'em', 'no', 'na', 'nos', 'nas', 'ao', 'aos', 'do', 'da', 'dos', 'das',
  'por', 'para', 'com', 'sem', 'que', 'se', 'mais', 'muito',
  // Spanish
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'pero',
  'en', 'con', 'sin', 'por', 'para', 'al', 'del', 'es', 'son', 'que',
  'su', 'sus', 'mas', 'muy',
]);

// ────────────────────────────────────────────────────────────────
// Dynamic category detection from search term data
// ────────────────────────────────────────────────────────────────

/**
 * Analyze word frequency across all search terms and return the top N
 * most common meaningful words as dynamic category labels.
 *
 * @param {Array} terms - Analysed term objects (must have .searchTerm)
 * @param {number} maxCategories - Max number of categories to return
 * @returns {Array<{key: string, label: string, keyword: string, count: number}>}
 */
export function detectCategories(terms, maxCategories = 12) {
  const wordFreq = new Map();

  terms.forEach((term) => {
    const words = term.searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    // Count each word once per term to avoid bias from repeated words
    const unique = new Set(words);
    unique.forEach((word) => {
      if (word.length < 3 || STOP_WORDS.has(word)) return;
      // Skip purely numeric words
      if (/^\d+$/.test(word)) return;
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
  });

  // Sort by frequency, filter minimum threshold, take top N
  const minCount = Math.max(5, Math.floor(terms.length * 0.01));
  const sorted = [...wordFreq.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCategories);

  return sorted.map(([word, count]) => ({
    key: `auto_${word}`,
    label: word.charAt(0).toUpperCase() + word.slice(1),
    keyword: word,
    count,
  }));
}

// ────────────────────────────────────────────────────────────────
// Term categorization using dynamic categories
// ────────────────────────────────────────────────────────────────

/**
 * Assign category tags to each term based on dynamic keyword matching.
 */
export function categorizeTermsDynamic(terms, dynamicCategories) {
  return terms.map((term) => {
    const lower = term.searchTerm.toLowerCase();
    const cats = [];
    for (const cat of dynamicCategories) {
      if (lower.includes(cat.keyword)) {
        cats.push(cat.key);
      }
    }
    return { ...term, categories: cats };
  });
}

// ────────────────────────────────────────────────────────────────
// Hidden KW detection
// ────────────────────────────────────────────────────────────────

/**
 * A term qualifies as "Hidden KW" if:
 *   - rank > 500 (low volume)
 *   - AND either: competitor-branded OR matches no product-category keyword
 */
export function isHiddenKW(term) {
  if (term.rank <= 500 && term.rank !== Infinity) return false;
  if (term.classification === 'competitor') return true;
  return term.categories.length === 0;
}

// ────────────────────────────────────────────────────────────────
// Tab key list for the UI
// ────────────────────────────────────────────────────────────────

/**
 * Return the ordered list of tab keys.
 * Fixed classification tabs + dynamic product-category tabs + special tabs.
 */
export function getAllTabKeysDynamic(dynamicCategories) {
  return [
    'all',
    'generic',
    'myBrand',
    'competitorBranded',
    ...dynamicCategories.map((c) => c.key),
    'hiddenKw',
    'whereWeCanGrow',
  ];
}
