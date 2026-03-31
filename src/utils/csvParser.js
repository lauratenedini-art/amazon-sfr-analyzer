import Papa from 'papaparse';

// ────────────────────────────────────────────────────────────────
// Header detection patterns — supports EN, PT, ES naming
// ────────────────────────────────────────────────────────────────

function getPositionNumber(header) {
  const lower = header.toLowerCase().trim();
  const hashMatch = lower.match(/#(\d)/);
  if (hashMatch) return parseInt(hashMatch[1], 10);
  const endMatch = lower.match(/(\d)\s*$/);
  if (endMatch) return parseInt(endMatch[1], 10);
  return null;
}

/**
 * Auto-detect column mapping from CSV headers.
 * Returns a mapping object like { searchTerm: 'Search Term', asin1: '#1 Clicked ASIN', ... }
 */
export function detectColumnMapping(headers) {
  const mapping = {};

  headers.forEach((h) => {
    const lower = h.toLowerCase().trim();
    const pos = getPositionNumber(h);

    // Search Term
    if (
      !mapping.searchTerm &&
      (lower.includes('search term') ||
        lower.includes('termo de busca') ||
        lower.includes('término de búsqueda') ||
        lower === 'keyword' ||
        lower === 'search query' ||
        lower === 'termo' ||
        lower === 'término')
    ) {
      mapping.searchTerm = h;
    }

    // Rank
    if (
      !mapping.searchFrequencyRank &&
      (lower.includes('search frequency rank') ||
        lower.includes('ranking de frequência') ||
        lower.includes('ranking de frecuencia') ||
        lower === 'sfr' ||
        lower === 'rank' ||
        lower === 'ranking')
    ) {
      mapping.searchFrequencyRank = h;
    }

    // Position-specific columns
    if (pos >= 1 && pos <= 3) {
      if (lower.includes('asin') && !mapping[`asin${pos}`]) {
        mapping[`asin${pos}`] = h;
      }
      if (
        (lower.includes('title') || lower.includes('título') || lower.includes('titulo') || lower.includes('product title')) &&
        !lower.includes('asin') &&
        !mapping[`title${pos}`]
      ) {
        mapping[`title${pos}`] = h;
      }
      if (
        lower.includes('click share') &&
        !lower.includes('conversion') &&
        !lower.includes('conversão') &&
        !lower.includes('conversión') &&
        !mapping[`clickShare${pos}`]
      ) {
        mapping[`clickShare${pos}`] = h;
      }
      if (
        (lower.includes('conversion') || lower.includes('conversão') || lower.includes('conversión')) &&
        !mapping[`convShare${pos}`]
      ) {
        mapping[`convShare${pos}`] = h;
      }
    }
  });

  return mapping;
}

/**
 * The list of mapping fields we look for, in display order.
 * Used by the header-mapping UI.
 */
export const MAPPING_FIELDS = [
  'searchTerm',
  'searchFrequencyRank',
  'asin1', 'title1', 'clickShare1', 'convShare1',
  'asin2', 'title2', 'clickShare2', 'convShare2',
  'asin3', 'title3', 'clickShare3', 'convShare3',
];

// ────────────────────────────────────────────────────────────────
// Value parsers
// ────────────────────────────────────────────────────────────────

function parsePercentage(val) {
  if (val == null || val === '') return 0;
  const str = String(val).trim().replace('%', '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseRank(val) {
  if (val == null || val === '') return Infinity;
  const str = String(val).trim().replace(/[.,]/g, '');
  const num = parseInt(str, 10);
  return isNaN(num) ? Infinity : num;
}

// ────────────────────────────────────────────────────────────────
// Metadata row detection & file reading
// ────────────────────────────────────────────────────────────────

/** Read a File object as plain text. */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

const HEADER_KEYWORDS = [
  'search', 'asin', 'click', 'rank', 'title', 'conversion',
  'busca', 'búsqueda', 'frequência', 'frecuencia', 'titulo', 'título',
];

/**
 * Detect and strip a metadata first row if present.
 * Amazon SFR exports start with a line like "Reporting date range: ..."
 * before the real column headers.
 * Returns { text, skipped }.
 */
function stripMetadataRow(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return { text, skipped: false };

  const firstLineFields = Papa.parse(lines[0], { header: false }).data[0] || [];
  const secondLineFields = Papa.parse(lines[1], { header: false }).data[0] || [];

  // Heuristic 1: metadata row has significantly fewer fields
  const fewFields = firstLineFields.length < secondLineFields.length * 0.5;

  // Heuristic 2: first row doesn't contain any header-like keywords
  const hasHeaderKeyword = firstLineFields.some((f) => {
    const lower = f.toLowerCase().trim();
    return HEADER_KEYWORDS.some((kw) => lower.includes(kw));
  });

  if (fewFields || !hasHeaderKeyword) {
    return { text: lines.slice(1).join('\n'), skipped: true };
  }
  return { text, skipped: false };
}

// ────────────────────────────────────────────────────────────────
// Parsing helpers
// ────────────────────────────────────────────────────────────────

/**
 * Read ONLY the headers from a File.
 * Auto-skips a metadata first row if detected.
 * Returns a Promise resolving to an array of header strings.
 */
export async function readHeaders(file) {
  const raw = await readFileAsText(file);
  const { text } = stripMetadataRow(raw);
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      preview: 1,
      skipEmptyLines: true,
      complete: (results) => resolve(results.meta.fields || []),
      error: (err) => reject(err),
    });
  });
}

/**
 * Parse one or more CSV File objects using PapaParse.
 * Auto-skips metadata first rows.
 * Returns an array of PapaParse result objects.
 */
export function parseCSVFiles(files) {
  return Promise.all(
    files.map(async (file) => {
      const raw = await readFileAsText(file);
      const { text } = stripMetadataRow(raw);
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results),
          error: (err) => reject(err),
        });
      });
    })
  );
}

/**
 * Merge parsed CSV results into a deduplicated array of structured term objects.
 * Uses the provided column mapping (from the header-mapping step).
 * Returns { terms, duplicateCount }.
 */
export function processCSVData(parsedResults, mapping) {
  const termMap = new Map();
  let duplicateCount = 0;

  parsedResults.forEach((result) => {
    result.data.forEach((row) => {
      const searchTerm = (row[mapping.searchTerm] || '').trim().toLowerCase();
      if (!searchTerm) return;

      const rank = parseRank(row[mapping.searchFrequencyRank]);

      const products = [];
      for (let pos = 1; pos <= 3; pos++) {
        products.push({
          position: pos,
          asin: (row[mapping[`asin${pos}`]] || '').trim(),
          title: (row[mapping[`title${pos}`]] || '').trim(),
          clickShare: parsePercentage(row[mapping[`clickShare${pos}`]]),
          conversionShare: parsePercentage(row[mapping[`convShare${pos}`]]),
        });
      }

      if (termMap.has(searchTerm)) {
        duplicateCount++;
        // Keep the entry with the lower (better) rank
        if (rank < termMap.get(searchTerm).rank) {
          termMap.set(searchTerm, { searchTerm, rank, products });
        }
      } else {
        termMap.set(searchTerm, { searchTerm, rank, products });
      }
    });
  });

  return {
    terms: Array.from(termMap.values()),
    duplicateCount,
  };
}
