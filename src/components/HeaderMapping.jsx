import { useLanguage } from '../contexts/LanguageContext';
import { MAPPING_FIELDS } from '../utils/csvParser';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * i18n label key for each mapping field.
 */
const FIELD_LABEL_KEY = {
  searchTerm: 'headerMapping.searchTerm',
  searchFrequencyRank: 'headerMapping.rank',
  asin1: 'headerMapping.asin1',
  title1: 'headerMapping.title1',
  clickShare1: 'headerMapping.cs1',
  convShare1: 'headerMapping.cv1',
  asin2: 'headerMapping.asin2',
  title2: 'headerMapping.title2',
  clickShare2: 'headerMapping.cs2',
  convShare2: 'headerMapping.cv2',
  asin3: 'headerMapping.asin3',
  title3: 'headerMapping.title3',
  clickShare3: 'headerMapping.cs3',
  convShare3: 'headerMapping.cv3',
};

export default function HeaderMapping({
  headers,
  mapping,
  onMappingChange,
  onConfirm,
  onBack,
  duplicateCount,
}) {
  const { t } = useLanguage();

  const handleChange = (field, value) => {
    onMappingChange({ ...mapping, [field]: value || undefined });
  };

  const requiredFields = ['searchTerm', 'searchFrequencyRank'];
  const allRequiredSet = requiredFields.every((f) => mapping[f]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {t('headerMapping.title')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('headerMapping.subtitle')}
        </p>
      </div>

      {duplicateCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {t('headerMapping.duplicatesFound')} {duplicateCount}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left font-semibold text-gray-600">
                {t('headerMapping.field')}
              </th>
              <th className="px-4 py-2.5 text-left font-semibold text-gray-600">
                {t('headerMapping.detectedColumn')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MAPPING_FIELDS.map((field) => {
              const detected = mapping[field];
              const isRequired = requiredFields.includes(field);
              return (
                <tr key={field} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-700">
                    {t(FIELD_LABEL_KEY[field])}{' '}
                    {isRequired && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={detected || ''}
                        onChange={(e) => handleChange(field, e.target.value)}
                        className={`w-full px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                          detected
                            ? 'border-green-300 bg-green-50/50'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">
                          {t('headerMapping.notDetected')}
                        </option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      {detected && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('headerMapping.back')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!allRequiredSet}
          className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all ${
            allRequiredSet
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {t('headerMapping.confirm')}
        </button>
      </div>
    </div>
  );
}
