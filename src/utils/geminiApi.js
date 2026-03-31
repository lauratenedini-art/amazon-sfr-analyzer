const BATCH_SIZE = 30;
const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function classifyProducts(products, clusterLevels, apiKey, customPrompt, onProgress) {
  const batches = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE));
  }

  const allResults = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let result;
    try {
      result = await classifyBatch(batch, clusterLevels, apiKey, customPrompt);
    } catch (err) {
      // Retry once after 1s
      await delay(1000);
      result = await classifyBatch(batch, clusterLevels, apiKey, customPrompt);
    }
    allResults.push(...result);
    onProgress?.(((i + 1) / batches.length) * 100);
  }

  return allResults;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function classifyBatch(products, clusterLevels, apiKey, customPrompt) {
  const levelsDescription = clusterLevels
    .map((level) => `  - "${level.name}"${level.description ? `: ${level.description}` : ''}`)
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
- Use categorias consistentes e em portugues brasileiro
- Agrupe produtos similares sob os mesmos termos de cluster
- Se nao for possivel determinar algum nivel, use "Nao classificado"`;

  if (customPrompt && customPrompt.trim()) {
    prompt += `

INSTRUCOES ADICIONAIS DO USUARIO:
${customPrompt.trim()}`;
  }

  prompt += `

Retorne APENAS um array JSON valido, sem markdown, sem texto extra, no formato:
[{"index": 1, "ean": "EAN", ${clusterFields}}, ...]`;

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = error.error?.message || `Erro na API Google: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Resposta vazia da API Google.');
  }

  const text = data.candidates[0].content.parts[0].text;

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
      result[level.name] = classification[level.name] || 'Nao classificado';
    });
    return result;
  });
}
