const BATCH_SIZE = 30;

export async function classifyProducts(products, clusterLevels, apiKey, onProgress) {
  const batches = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE));
  }

  const allResults = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let result;
    try {
      result = await classifyBatch(batch, clusterLevels, apiKey);
    } catch (err) {
      // Retry once
      await delay(1000);
      result = await classifyBatch(batch, clusterLevels, apiKey);
    }
    allResults.push(...result);
    onProgress?.(((i + 1) / batches.length) * 100);
  }

  return allResults;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function classifyBatch(products, clusterLevels, apiKey) {
  const levelsDescription = clusterLevels
    .map((level) => `  - "${level.name}"${level.description ? `: ${level.description}` : ''}`)
    .join('\n');

  const productsList = products
    .map((p, i) => `${i + 1}. [EAN: ${p.ean}] ${p.title}`)
    .join('\n');

  const clusterFields = clusterLevels.map((l) => `"${l.name}": "classificação"`).join(', ');

  const prompt = `Você é um especialista em classificação de produtos para portfólio de varejo.

Analise os títulos dos produtos abaixo e classifique cada um nos seguintes níveis de cluster:
${levelsDescription}

Produtos:
${productsList}

REGRAS:
- Analise cuidadosamente cada título de produto para extrair a classificação correta
- Classifique cada produto em TODOS os níveis solicitados
- Use categorias consistentes e em português brasileiro
- Agrupe produtos similares sob os mesmos termos de cluster
- Se não for possível determinar algum nível, use "Não classificado"

Retorne APENAS um array JSON válido, sem markdown, sem texto extra, no formato:
[{"index": 1, "ean": "EAN", ${clusterFields}}, ...]`;

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6-latest',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Erro na API: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém JSON válido');
  }

  const classifications = JSON.parse(jsonMatch[0]);

  return products.map((product, i) => {
    const classification = classifications.find((c) => c.index === i + 1) || classifications[i] || {};
    const result = {
      EAN: product.ean,
      Titulo: product.title,
    };
    clusterLevels.forEach((level) => {
      result[level.name] = classification[level.name] || 'Não classificado';
    });
    return result;
  });
}
