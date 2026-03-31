import React, { useState } from 'react';
import { ArrowLeft, Layers, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { SUGGESTIONS } from '../utils/translations';

export default function ClusterStep({ levels: initialLevels, customPrompt: initialPrompt, onComplete, onBack }) {
  const { lang, t } = useLang();
  const [levels, setLevels] = useState(initialLevels);
  const [promptText, setPromptText] = useState(initialPrompt || '');
  const [error, setError] = useState('');

  const suggestions = SUGGESTIONS[lang] || SUGGESTIONS.pt;

  const addLevel = () => {
    if (levels.length >= 10) return;
    const usedNames = levels.map((l) => l.name);
    const suggestion = suggestions.find((s) => !usedNames.includes(s)) || `Level ${levels.length + 1}`;
    setLevels([...levels, { name: suggestion, description: '', options: '' }]);
  };

  const removeLevel = (index) => {
    if (levels.length <= 1) return;
    setLevels(levels.filter((_, i) => i !== index));
  };

  const updateLevel = (index, field, value) => {
    setLevels(levels.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    setError('');
  };

  const handleNext = () => {
    const names = levels.map((l) => l.name.trim());
    if (names.some((n) => !n)) { setError(t('cluster.errorEmpty')); return; }
    if (new Set(names).size !== names.length) { setError(t('cluster.errorDup')); return; }
    onComplete(levels.map((l) => ({ ...l, name: l.name.trim() })), promptText);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('cluster.title')}</h2>
        <p className="text-slate-500 mb-6">{t('cluster.description')}</p>

        <div className="space-y-3 mb-6">
          {levels.map((level, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" value={level.name} onChange={(e) => updateLevel(i, 'name', e.target.value)}
                    placeholder={t('cluster.levelName')}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  <input type="text" value={level.description} onChange={(e) => updateLevel(i, 'description', e.target.value)}
                    placeholder={t('cluster.levelDesc')}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <button onClick={() => removeLevel(i)} disabled={levels.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 ml-10">
                <input type="text" value={level.options || ''} onChange={(e) => updateLevel(i, 'options', e.target.value)}
                  placeholder={t('cluster.levelOptions')}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder:text-slate-400" />
              </div>
            </div>
          ))}
        </div>

        {levels.length < 10 && (
          <button onClick={addLevel}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-sm font-medium mb-6">
            <Plus className="w-4 h-4" /> {t('cluster.add')}
          </button>
        )}

        <div className="mb-6">
          <p className="text-xs text-slate-400 mb-2">{t('cluster.suggestions')}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.filter((s) => !levels.some((l) => l.name === s)).map((s) => (
              <button key={s} onClick={() => { if (levels.length >= 10) return; setLevels([...levels, { name: s, description: '', options: '' }]); }}
                disabled={levels.length >= 10}
                className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition disabled:opacity-30">
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">{t('cluster.promptLabel')}</label>
          <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)}
            placeholder={t('cluster.promptPlaceholder')} rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y placeholder:text-slate-400" />
          <p className="text-xs text-slate-400 mt-1.5">{t('cluster.promptHelp')}</p>
        </div>

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
            {t('cluster.submit')} <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
