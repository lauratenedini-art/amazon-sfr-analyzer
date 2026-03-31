import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { useLang } from './contexts/LangContext';
import UploadStep from './components/UploadStep';
import MappingStep from './components/MappingStep';
import ClusterStep from './components/ClusterStep';
import ResultsStep from './components/ResultsStep';

const LANGS = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export default function App() {
  const { lang, setLang, t } = useLang();
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({ title: '', ean: '' });
  const [clusterLevels, setClusterLevels] = useState([
    { name: 'Categoria', description: '', options: '' },
    { name: 'Subcategoria', description: '', options: '' },
    { name: 'Tipo', description: '', options: '' },
  ]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [results, setResults] = useState(null);

  const stepLabels = [
    t('step.upload'),
    t('step.mapping'),
    t('step.clusters'),
    t('step.results'),
  ];

  const handleReset = () => {
    setStep(1);
    setFileData(null);
    setColumnMapping({ title: '', ean: '' });
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{t('app.title')}</h1>
              <p className="text-xs text-slate-500">{t('app.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language selector */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 text-xs font-semibold transition ${
                    lang === l.code
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {step > 1 && (
              <button
                onClick={handleReset}
                className="text-sm text-slate-500 hover:text-slate-700 transition"
              >
                {t('app.reset')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          {stepLabels.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step > i + 1
                      ? 'bg-indigo-600 text-white'
                      : step === i + 1
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > i + 1 ? '\u2713' : i + 1}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:inline ${
                    step >= i + 1 ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-12 h-0.5 ${step > i + 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 pb-12">
        {step === 1 && (
          <UploadStep onComplete={(data) => { setFileData(data); setStep(2); }} />
        )}
        {step === 2 && (
          <MappingStep
            columns={fileData.columns}
            preview={fileData.rows.slice(0, 5)}
            onComplete={(mapping) => { setColumnMapping(mapping); setStep(3); }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ClusterStep
            levels={clusterLevels}
            customPrompt={customPrompt}
            onComplete={(levels, prompt) => { setClusterLevels(levels); setCustomPrompt(prompt); setStep(4); }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <ResultsStep
            fileData={fileData}
            columnMapping={columnMapping}
            clusterLevels={clusterLevels}
            customPrompt={customPrompt}
            results={results}
            onResults={setResults}
            onBack={() => setStep(3)}
          />
        )}
      </main>
    </div>
  );
}
