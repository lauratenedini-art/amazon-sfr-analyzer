export const translations = {
  // App
  'app.title': { pt: 'Clusterizador de Portfolio', en: 'Portfolio Clusterer', es: 'Clusterizador de Portafolio' },
  'app.subtitle': { pt: 'Classificacao inteligente de produtos via IA', en: 'AI-powered intelligent product classification', es: 'Clasificacion inteligente de productos via IA' },
  'app.reset': { pt: 'Recomecar', en: 'Start over', es: 'Reiniciar' },

  // Steps
  'step.upload': { pt: 'Upload', en: 'Upload', es: 'Subir' },
  'step.mapping': { pt: 'Mapeamento', en: 'Mapping', es: 'Mapeo' },
  'step.clusters': { pt: 'Clusters', en: 'Clusters', es: 'Clusters' },
  'step.results': { pt: 'Resultados', en: 'Results', es: 'Resultados' },

  // Upload
  'upload.title': { pt: 'Upload do Arquivo', en: 'File Upload', es: 'Subir Archivo' },
  'upload.description': {
    pt: 'Envie um arquivo .csv ou .xlsx com seus produtos.',
    en: 'Upload a .csv or .xlsx file with your products.',
    es: 'Suba un archivo .csv o .xlsx con sus productos.',
  },
  'upload.processing': { pt: 'Processando arquivo...', en: 'Processing file...', es: 'Procesando archivo...' },
  'upload.dropActive': { pt: 'Solte o arquivo aqui', en: 'Drop the file here', es: 'Suelte el archivo aqui' },
  'upload.dropIdle': { pt: 'Arraste e solte seu arquivo aqui', en: 'Drag and drop your file here', es: 'Arrastre y suelte su archivo aqui' },
  'upload.click': { pt: 'ou clique para selecionar', en: 'or click to select', es: 'o haga clic para seleccionar' },
  'upload.formats': { pt: 'Formatos aceitos: CSV, XLSX', en: 'Accepted formats: CSV, XLSX', es: 'Formatos aceptados: CSV, XLSX' },
  'upload.empty': { pt: 'O arquivo nao contem dados.', en: 'The file contains no data.', es: 'El archivo no contiene datos.' },

  // Mapping
  'mapping.title': { pt: 'Mapeamento de Colunas', en: 'Column Mapping', es: 'Mapeo de Columnas' },
  'mapping.description': {
    pt: 'Indique quais colunas do seu arquivo correspondem ao titulo e ao EAN dos produtos.',
    en: 'Select which columns correspond to the product title and EAN.',
    es: 'Indique que columnas corresponden al titulo y al EAN de los productos.',
  },
  'mapping.titleCol': { pt: 'Coluna do Titulo', en: 'Title Column', es: 'Columna del Titulo' },
  'mapping.eanCol': { pt: 'Coluna do EAN', en: 'EAN Column', es: 'Columna del EAN' },
  'mapping.select': { pt: 'Selecione...', en: 'Select...', es: 'Seleccione...' },
  'mapping.preview': { pt: 'Pre-visualizacao (5 primeiros registros)', en: 'Preview (first 5 records)', es: 'Vista previa (5 primeros registros)' },
  'mapping.errorBoth': { pt: 'Selecione ambas as colunas antes de continuar.', en: 'Select both columns before continuing.', es: 'Seleccione ambas columnas antes de continuar.' },
  'mapping.errorSame': { pt: 'As colunas de Titulo e EAN devem ser diferentes.', en: 'Title and EAN columns must be different.', es: 'Las columnas de Titulo y EAN deben ser diferentes.' },

  // Cluster
  'cluster.title': { pt: 'Configuracao de Clusters', en: 'Cluster Configuration', es: 'Configuracion de Clusters' },
  'cluster.description': {
    pt: 'Defina entre 1 e 10 niveis de classificacao para organizar seu portfolio.',
    en: 'Define between 1 and 10 classification levels to organize your portfolio.',
    es: 'Defina entre 1 y 10 niveles de clasificacion para organizar su portafolio.',
  },
  'cluster.levelName': { pt: 'Nome do nivel', en: 'Level name', es: 'Nombre del nivel' },
  'cluster.levelDesc': { pt: 'Descricao (opcional)', en: 'Description (optional)', es: 'Descripcion (opcional)' },
  'cluster.levelOptions': {
    pt: 'Opcoes possiveis separadas por virgula (ex: Higiene, Alimentos, Bebidas)',
    en: 'Possible options separated by comma (e.g.: Hygiene, Food, Beverages)',
    es: 'Opciones posibles separadas por coma (ej: Higiene, Alimentos, Bebidas)',
  },
  'cluster.add': { pt: 'Adicionar nivel', en: 'Add level', es: 'Agregar nivel' },
  'cluster.suggestions': { pt: 'Sugestoes rapidas:', en: 'Quick suggestions:', es: 'Sugerencias rapidas:' },
  'cluster.promptLabel': {
    pt: 'Instrucoes adicionais para o prompt (opcional)',
    en: 'Additional prompt instructions (optional)',
    es: 'Instrucciones adicionales para el prompt (opcional)',
  },
  'cluster.promptPlaceholder': {
    pt: "Ex: Produtos com 'organico' devem ser classificados como 'Natural'.\nProdutos importados devem ter o segmento 'Importado'.",
    en: "E.g.: Products with 'organic' should be classified as 'Natural'.\nImported products should have the segment 'Imported'.",
    es: "Ej: Productos con 'organico' deben clasificarse como 'Natural'.\nProductos importados deben tener el segmento 'Importado'.",
  },
  'cluster.promptHelp': {
    pt: 'Use este campo para dar instrucoes especificas de como a IA deve classificar seus produtos.',
    en: 'Use this field to give specific instructions on how the AI should classify your products.',
    es: 'Use este campo para dar instrucciones especificas de como la IA debe clasificar sus productos.',
  },
  'cluster.errorEmpty': { pt: 'Todos os niveis devem ter um nome.', en: 'All levels must have a name.', es: 'Todos los niveles deben tener un nombre.' },
  'cluster.errorDup': { pt: 'Os nomes dos niveis devem ser unicos.', en: 'Level names must be unique.', es: 'Los nombres de niveles deben ser unicos.' },
  'cluster.submit': { pt: 'Classificar com IA', en: 'Classify with AI', es: 'Clasificar con IA' },

  // Common
  'common.back': { pt: 'Voltar', en: 'Back', es: 'Volver' },
  'common.next': { pt: 'Proximo', en: 'Next', es: 'Siguiente' },

  // Results - Sampling
  'results.samplingTitle': { pt: 'Gerando amostragem...', en: 'Generating sample...', es: 'Generando muestreo...' },
  'results.samplingText': {
    pt: 'Classificando ate {count} produtos para validacao antes de processar os {total} registros.',
    en: 'Classifying up to {count} products for validation before processing all {total} records.',
    es: 'Clasificando hasta {count} productos para validacion antes de procesar los {total} registros.',
  },

  // Results - Validation
  'results.validTitle': { pt: 'Validacao de amostragem', en: 'Sample validation', es: 'Validacion de muestreo' },
  'results.validText': {
    pt: 'Confira a classificacao de {count} produtos abaixo. Se estiver correto, aprove para processar todos os {total} produtos.',
    en: 'Review the classification of {count} products below. If correct, approve to process all {total} products.',
    es: 'Revise la clasificacion de {count} productos. Si es correcto, apruebe para procesar todos los {total} productos.',
  },
  'results.feedbackTitle': { pt: 'O que precisa ser corrigido?', en: 'What needs to be corrected?', es: 'Que necesita ser corregido?' },
  'results.feedbackPlaceholder': {
    pt: "Ex: 'Shampoo Dove' foi classificado como 'Higiene' mas deveria ser 'Cuidados Capilares'.\nProdutos com 'Kit' devem ter tipo 'Combo/Kit'.",
    en: "E.g.: 'Dove Shampoo' was classified as 'Hygiene' but should be 'Hair Care'.\nProducts with 'Kit' should have type 'Combo/Kit'.",
    es: "Ej: 'Shampoo Dove' fue clasificado como 'Higiene' pero deberia ser 'Cuidado Capilar'.\nProductos con 'Kit' deben tener tipo 'Combo/Kit'.",
  },
  'results.feedbackHistory': { pt: 'Correcoes anteriores ja aplicadas:', en: 'Previous corrections already applied:', es: 'Correcciones anteriores ya aplicadas:' },
  'results.reclassifyFeedback': { pt: 'Reclassificar com correcoes', en: 'Reclassify with corrections', es: 'Reclasificar con correcciones' },
  'results.backAdjust': { pt: 'Voltar e ajustar', en: 'Back and adjust', es: 'Volver y ajustar' },
  'results.reclassify': { pt: 'Reclassificar amostra', en: 'Reclassify sample', es: 'Reclasificar muestra' },
  'results.loadMore': { pt: 'Carregar mais {count}', en: 'Load {count} more', es: 'Cargar {count} mas' },
  'results.loadingMore': { pt: 'Carregando...', en: 'Loading...', es: 'Cargando...' },
  'results.noMore': { pt: 'Todos os produtos ja foram amostrados', en: 'All products have been sampled', es: 'Todos los productos ya fueron muestreados' },
  'results.approve': { pt: 'Aprovar e classificar tudo', en: 'Approve and classify all', es: 'Aprobar y clasificar todo' },

  // Results - Processing
  'results.procTitle': { pt: 'Classificando todos os produtos...', en: 'Classifying all products...', es: 'Clasificando todos los productos...' },
  'results.procText': {
    pt: 'Processando {count} produtos nos {levels} niveis configurados.',
    en: 'Processing {count} products across {levels} configured levels.',
    es: 'Procesando {count} productos en los {levels} niveles configurados.',
  },
  'results.procPhase1': {
    pt: 'Classificando produtos...',
    en: 'Classifying products...',
    es: 'Clasificando productos...',
  },
  'results.procPhase2': {
    pt: 'Buscando informacoes de produtos nao classificados pelo EAN...',
    en: 'Searching for unclassified product info by EAN...',
    es: 'Buscando informacion de productos no clasificados por EAN...',
  },
  'results.procPhase3': {
    pt: 'Reclassificando produtos enriquecidos...',
    en: 'Reclassifying enriched products...',
    es: 'Reclasificando productos enriquecidos...',
  },
  'results.progress': { pt: '{pct}% concluido', en: '{pct}% complete', es: '{pct}% completado' },

  // Results - Error
  'results.errorTitle': { pt: 'Erro no processamento', en: 'Processing error', es: 'Error en el procesamiento' },
  'results.retry': { pt: 'Tentar novamente', en: 'Try again', es: 'Intentar nuevamente' },

  // Results - Done
  'results.doneTitle': { pt: 'Classificacao concluida', en: 'Classification complete', es: 'Clasificacion completada' },
  'results.doneText': {
    pt: '{count} produtos classificados em {levels} niveis',
    en: '{count} products classified across {levels} levels',
    es: '{count} productos clasificados en {levels} niveles',
  },
  'results.showing': { pt: 'Mostrando {start}\u2013{end} de {total}', en: 'Showing {start}\u2013{end} of {total}', es: 'Mostrando {start}\u2013{end} de {total}' },
  'results.prev': { pt: 'Anterior', en: 'Previous', es: 'Anterior' },
  'results.nextPage': { pt: 'Proximo', en: 'Next', es: 'Siguiente' },
  'results.reconfigure': { pt: 'Voltar e reconfigurar', en: 'Back and reconfigure', es: 'Volver y reconfigurar' },

  // API prompt language
  'api.lang': { pt: 'em portugues brasileiro', en: 'in English', es: 'en espanol' },
  'api.notClassified': { pt: 'Nao classificado', en: 'Not classified', es: 'No clasificado' },
};

export const SUGGESTIONS = {
  pt: ['Categoria', 'Subcategoria', 'Tipo de Produto', 'Marca', 'Segmento', 'Faixa de Preco', 'Publico-Alvo', 'Ocasiao de Uso', 'Material', 'Tamanho'],
  en: ['Category', 'Subcategory', 'Product Type', 'Brand', 'Segment', 'Price Range', 'Target Audience', 'Use Occasion', 'Material', 'Size'],
  es: ['Categoria', 'Subcategoria', 'Tipo de Producto', 'Marca', 'Segmento', 'Rango de Precio', 'Publico Objetivo', 'Ocasion de Uso', 'Material', 'Tamano'],
};
