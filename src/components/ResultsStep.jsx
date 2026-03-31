import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Download, Loader, AlertCircle, CheckCircle2,
  FileDown, RotateCcw, FlaskConical, ThumbsUp, MessageSquare, Send,
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { classifyProducts } from '../utils/openaiApi';
import { exportToXLSX, exportToCSV } from '../utils/exportUtils';

const ROWS_PER_PAGE = 25;
const SAMPLE_SIZE = 20;

function pickSample(products) {
  if (products.length <= SAMPLE_SIZE) return products;
  const step = Math.floor(products.length / SAMPLE_SIZE);
  const sample = [];
  for (let i = 0; i < products.length && sample.length < SAMPLE_SIZE; i += step) {
    sample.push(products[i]);
  }
  return sample;
}

export default function ResultsStep({ fileData, columnMapping, clusterLevels, customPrompt, results, onResults, onBack }) {
  const { t } = useLang();
  const langLabel = t('api.lang');
  const [phase, setPhase] = useState(results ? 'done' : 'sampling');
  const [sampleResults, setSampleResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const hasStarted = useRef(false);

  const allProducts = fileData.rows
    .map((row) => ({ title: String(row[columnMapping.title] || '').trim(), ean: String(row[columnMapping.ean] || '').trim() }))
    .filter((p) => p.title);
  const productCount = allProducts.length;

  const buildFullPrompt = () => {
    let full = customPrompt || '';
    if (feedbackHistory.length > 0) {
      full += (full ? '\n\n' : '') + 'CORRECOES DO USUARIO:\n' + feedbackHistory.map((f, i) => `${i + 1}. ${f}`).join('\n');
    }
    return full;
  };

  const runSample = async () => {
    setPhase('sampling');
    setShowFeedback(false);
    setError('');
    try {
      const sample = pickSample(allProducts);
      const classified = await classifyProducts(sample, clusterLevels, buildFullPrompt(), () => {}, langLabel);
      setSampleResults(classified);
      setPhase('validation');
    } catch (err) {
      setError(err.message || 'Error');
      setPhase('error');
    }
  };

  const runFullProcessing = async () => {
    setPhase('processing');
    setProgress(0);
    setError('');
    try {
      const classified = await classifyProducts(allProducts, clusterLevels, buildFullPrompt(), setProgress, langLabel);
      onResults(classified);
      setPhase('done');
    } catch (err) {
      setError(err.message || 'Error');
      setPhase('error');
    }
  };

  useEffect(() => {
    if (!results && !hasStarted.current) { hasStarted.current = true; runSample(); }
  }, []);

  const sampleColumns = sampleResults?.length > 0 ? Object.keys(sampleResults[0]) : [];

  // === SAMPLING ===
  if (phase === 'sampling') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Loader className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t('results.samplingTitle')}</h3>
            <p className="text-slate-500 text-sm">{t('results.samplingText', { count: SAMPLE_SIZE, total: productCount })}</p>
          </div>
        </div>
      </div>
    );
  }

  // === VALIDATION ===
  if (phase === 'validation' && sampleResults) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{t('results.validTitle')}</h3>
              <p className="text-sm text-slate-600">{t('results.validText', { count: sampleResults.length, total: productCount })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium text-xs w-10">#</th>
                  {sampleColumns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-slate-600 font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleResults.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                    {sampleColumns.map((col) => (
                      <td key={col} className={`px-4 py-2.5 whitespace-nowrap ${col === 'Titulo' ? 'max-w-xs truncate text-slate-700' : col === 'EAN' ? 'font-mono text-xs text-slate-500' : 'text-slate-700'}`} title={String(row[col] || '')}>
                        {col !== 'EAN' && col !== 'Titulo' ? (
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{row[col]}</span>
                        ) : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showFeedback && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-slate-700">{t('results.feedbackTitle')}</h4>
            </div>
            <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t('results.feedbackPlaceholder')} rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y placeholder:text-slate-400 mb-3" />
            {feedbackHistory.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-1.5">{t('results.feedbackHistory')}</p>
                <div className="space-y-1">
                  {feedbackHistory.map((f, i) => (
                    <p key={i} className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded">{i + 1}. {f}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => {
                if (feedbackText.trim()) setFeedbackHistory([...feedbackHistory, feedbackText.trim()]);
                setFeedbackText('');
                hasStarted.current = false;
                setSampleResults(null);
                runSample();
              }} disabled={!feedbackText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50">
                <Send className="w-4 h-4" /> {t('results.reclassifyFeedback')}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4" /> {t('results.backAdjust')}
          </button>
          <div className="flex gap-3">
            {!showFeedback && (
              <button onClick={() => setShowFeedback(true)}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium text-sm">
                <RotateCcw className="w-4 h-4" /> {t('results.reclassify')}
              </button>
            )}
            <button onClick={runFullProcessing}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm">
              <ThumbsUp className="w-4 h-4" /> {t('results.approve')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === PROCESSING ===
  if (phase === 'processing') {
    const phaseLabel = progress <= 60
      ? t('results.procPhase1')
      : progress <= 80
      ? t('results.procPhase2')
      : progress < 100
      ? t('results.procPhase3')
      : t('results.procPhase1');

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t('results.procTitle')}</h3>
            <p className="text-slate-500 text-sm mb-2">{t('results.procText', { count: productCount, levels: clusterLevels.length })}</p>
            <p className="text-indigo-600 text-xs font-medium mb-4">{phaseLabel}</p>
            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
              <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-slate-500">{t('results.progress', { pct: Math.round(progress) })}</p>
          </div>
        </div>
      </div>
    );
  }

  // === ERROR ===
  if (phase === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t('results.errorTitle')}</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <div className="flex justify-between">
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition">
              <ArrowLeft className="w-4 h-4" /> {t('common.back')}
            </button>
            <button onClick={() => { hasStarted.current = false; setSampleResults(null); runSample(); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
              <RotateCcw className="w-4 h-4" /> {t('results.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === DONE ===
  if (phase === 'done' && results) {
    const totalPages = Math.ceil(results.length / ROWS_PER_PAGE);
    const paginatedResults = results.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    const allColumns = results.length > 0 ? Object.keys(results[0]) : [];

    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{t('results.doneTitle')}</h3>
                <p className="text-sm text-slate-500">{t('results.doneText', { count: results.length, levels: clusterLevels.length })}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportToCSV(results)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium">
                <FileDown className="w-4 h-4" /> CSV
              </button>
              <button onClick={() => exportToXLSX(results)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
                <Download className="w-4 h-4" /> XLSX
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-500 font-medium text-xs w-10">#</th>
                  {allColumns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-slate-600 font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{(currentPage - 1) * ROWS_PER_PAGE + i + 1}</td>
                    {allColumns.map((col) => (
                      <td key={col} className={`px-4 py-2.5 whitespace-nowrap ${col === 'Titulo' ? 'max-w-xs truncate text-slate-700' : col === 'EAN' ? 'font-mono text-xs text-slate-500' : 'text-slate-700'}`} title={String(row[col] || '')}>
                        {col !== 'EAN' && col !== 'Titulo' ? (
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{row[col]}</span>
                        ) : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                {t('results.showing', { start: (currentPage - 1) * ROWS_PER_PAGE + 1, end: Math.min(currentPage * ROWS_PER_PAGE, results.length), total: results.length })}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 transition">{t('results.prev')}</button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 transition">{t('results.nextPage')}</button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 text-center">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 transition">{t('results.reconfigure')}</button>
        </div>
      </div>
    );
  }

  return null;
}
