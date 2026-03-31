import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Columns, AlertCircle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function MappingStep({ columns, preview, onComplete, onBack }) {
  const { t } = useLang();
  const [titleCol, setTitleCol] = useState('');
  const [eanCol, setEanCol] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!titleCol || !eanCol) { setError(t('mapping.errorBoth')); return; }
    if (titleCol === eanCol) { setError(t('mapping.errorSame')); return; }
    onComplete({ title: titleCol, ean: eanCol });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('mapping.title')}</h2>
        <p className="text-slate-500 mb-6">{t('mapping.description')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Columns className="w-4 h-4 inline mr-1.5 text-indigo-500" />
              {t('mapping.titleCol')}
            </label>
            <select value={titleCol} onChange={(e) => { setTitleCol(e.target.value); setError(''); }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
              <option value="">{t('mapping.select')}</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Columns className="w-4 h-4 inline mr-1.5 text-indigo-500" />
              {t('mapping.eanCol')}
            </label>
            <select value={eanCol} onChange={(e) => { setEanCol(e.target.value); setError(''); }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition">
              <option value="">{t('mapping.select')}</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        </div>

        {titleCol && eanCol && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">{t('mapping.preview')}</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-600 font-semibold">EAN</th>
                    <th className="px-4 py-2 text-left text-slate-600 font-semibold">{t('mapping.titleCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-slate-600 font-mono text-xs">{row[eanCol]}</td>
                      <td className="px-4 py-2 text-slate-700">{row[titleCol]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="flex justify-between">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </button>
          <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
            {t('common.next')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
