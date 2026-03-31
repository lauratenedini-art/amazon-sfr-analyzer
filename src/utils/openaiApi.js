import { lookupEANs } from './eanLookup';

const BATCH_SIZE = 30;
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const NOT_CLASSIFIED = 'Nao classificado';

export async function classifyProducts(products, clusterLevels, customPrompt, onProgress, langLabel) {
  // Phase 1: Initial classification (0% - 60%)
  const results = await runBatches(
    products, clusterLevels, customPrompt, langLabel,
    (p) => onProgress?.(p * 60)
  );

  // Find unclassified products
  const unclassified = [];
  results.forEach((r, i) => {
    if (clusterLevels.some((l) => r[l.name] === NOT_CLASSIFIED)) {
      unclassified.push({ ...r, _idx: i });
    }
  });

  if (unclassified.length === 0) {
    onProgress?.(100);
    return results;
  }

  // Phase 2: EAN lookup (60% - 80%)
  onProgress?.(62);
  const eanList = unclassified.map((r) => r.EAN).filter(Boolean);
  const eanInfo = await lookupEANs(eanList, (p) => onProgress?.(62 + p * 18));

  // Build enriched products for re-classification
  const toReclassify = unclassified
    .filter((r) => eanInfo[r.EAN])
    .map((r) => {
      const info = eanInfo[r.EAN];
      const extra = [info.name, info.brand, info.categories].filter(Boolean).join(' | ');
      return {
        title: `${r.Titulo} [Info adicional: ${extra}]`,
        ean: r.EAN,
        _idx: r._idx,
      };
    });

  if (toReclassify.length === 0) {
    onProgress?.(100);
    return results;
  }

  // Phase 3: Re-classify enriched products (80% - 100%)
  onProgress?.(82);
  const enrichedPrompt = (customPrompt || '') +
    '\n\nATENCAO: Os produtos abaixo foram enriquecidos com informacoes encontradas online pelo EAN. Use essas informacoes adicionais (entre colchetes) para classificar corretamente.';

  const reClassified = await runBatches(
    toReclassify.map((r) => ({ title: r.title, ean: r.ean })),
    clusterLevels, enrichedPrompt, langLabel,
    (p) => onProgress?.(82 + p * 18)
  );

  // Merge back keeping original title
  toReclassify.forEach((item, i) => {
    const rc = reClassified[i];
    if (rc) {
      results[item._idx] = { ...rc, Titulo: results[item._idx].Titulo };
    }
  });

  onProgress?.(100);
  return results;
}

// --- Internal helpers ---

async function runBatches(products, clusterLevels, customPrompt, langLabel, onProgress) {
  const batches = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE));
  }

  const allResults = [];

  for (let i = 0; i < batches.length; i++) {
    let result;
    try {
      result = await classifyBatch(batches[i], clusterLevels, customPrompt, langLabel);
    } catch (err) {
      await delay(1000);
      result = await classifyBatch(batches[i], clusterLevels, customPrompt, langLabel);
    }
    allResults.push(...result);
    onProgress?.((i + 1) / batches.length);
  }

  return allResults;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function classifyBatch(products, clusterLevels, customPrompt, langLabel) {
  const levelsDescription = clusterLevels
    .map((level) => {
      let line = `  - "${level.name}"`;
      if (level.description) line += `: ${level.description}`;
      if (level.options && level.options.trim()) {
        line += ` [SOMENTE estas opcoes: ${level.options.trim()}]`;
      }
      return line;
    })
    .join('\n');

  const productsList = products
    .map((p, i) => `${i + 1}. [EAN: ${p.ean}] ${p.title}`)
    .join('\n');

  const clusterFields = clusterLevels.map((l) => `"${l.name}": "classificacao"`).join(', ');

  let prompt = `Voce e um especialista em classificacao de produtos para portfolio de varejo.

Analise os titulos dos produtos abaixo e classifique cada um nos seguintes niveis de cluster:
${levelsDescription}

Produtos:
${productsList}

REGRAS:
- Analise cuidadosamente cada titulo de produto para extrair a classificacao correta
- Classifique cada produto em TODOS os niveis solicitados
- Use categorias consistentes ${langLabel || 'em portugues brasileiro'}
- Agrupe produtos similares sob os mesmos termos de cluster
- Quando um nivel tiver opcoes definidas (marcadas com [SOMENTE estas opcoes:]), use EXCLUSIVAMENTE uma das opcoes listadas. Nao invente opcoes fora da lista
- Se o titulo nao for suficiente, use o codigo EAN para tentar identificar o produto com base no seu conhecimento
- Se houver informacoes adicionais entre colchetes [Info adicional: ...], use-as para classificar
- SOMENTE se realmente nao for possivel determinar algum nivel, use "Nao classificado"`;

  if (customPrompt && customPrompt.trim()) {
    prompt += `

INSTRUCOES ADICIONAIS DO USUARIO:
${customPrompt.trim()}`;
  }

  prompt += `

Retorne APENAS um array JSON valido, sem markdown, sem texto extra, no formato:
[{"index": 1, "ean": "EAN", ${clusterFields}}, ...]`;

  const response = await fetch('/api/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = error.error?.message || `Erro na API OpenAI: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Resposta vazia da API OpenAI.');
  }

  const text = data.choices[0].message.content;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA nao contem JSON valido');
  }

  const classifications = JSON.parse(jsonMatch[0]);

  return products.map((product, i) => {
    const classification = classifications.find((c) => c.index === i + 1) || classifications[i] || {};
    const result = {
      EAN: product.ean,
      Titulo: product.title,
    };
    clusterLevels.forEach((level) => {
      result[level.name] = classification[level.name] || NOT_CLASSIFIED;
    });
    return result;
  });
}
