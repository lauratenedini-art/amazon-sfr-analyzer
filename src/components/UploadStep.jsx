import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { parseFile } from '../utils/fileParser';

export default function UploadStep({ onComplete }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setLoading(true);
      setError('');
      try {
        const data = await parseFile(file);
        if (data.rows.length === 0) throw new Error(t('upload.empty'));
        onComplete({ ...data, fileName: file.name });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [onComplete, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('upload.title')}</h2>
        <p className="text-slate-500 mb-6">{t('upload.description')}</p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
          } ${loading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-600">{t('upload.processing')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                {isDragActive ? <FileSpreadsheet className="w-8 h-8 text-indigo-600" /> : <Upload className="w-8 h-8 text-indigo-400" />}
              </div>
              <div>
                <p className="text-slate-700 font-medium">{isDragActive ? t('upload.dropActive') : t('upload.dropIdle')}</p>
                <p className="text-sm text-slate-400 mt-1">{t('upload.click')}</p>
              </div>
              <p className="text-xs text-slate-400">{t('upload.formats')}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
