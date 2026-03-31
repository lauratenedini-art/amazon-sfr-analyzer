const API_BASES = [
  'https://world.openfoodfacts.org',
  'https://world.openbeautyfacts.org',
  'https://world.openproductsfacts.org',
];

export async function lookupEANs(eans, onProgress) {
  const results = {};
  const CONCURRENT = 5;

  for (let i = 0; i < eans.length; i += CONCURRENT) {
    const chunk = eans.slice(i, i + CONCURRENT);
    const promises = chunk.map(async (ean) => {
      const info = await lookupSingleEAN(ean);
      if (info) results[ean] = info;
    });
    await Promise.all(promises);
    onProgress?.((i + chunk.length) / eans.length);
  }

  return results;
}

async function lookupSingleEAN(ean) {
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}/api/v2/product/${ean}.json`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name || p.product_name_pt || p.product_name_en || p.product_name_es || '';
        const brand = p.brands || '';
        const categories = p.categories || '';
        if (name || brand || categories) {
          return { name, brand, categories };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}
