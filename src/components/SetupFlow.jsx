import { useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import FileUpload from './FileUpload';
import HeaderMapping from './HeaderMapping';
import {
  readHeaders,
  detectColumnMapping,
  parseCSVFiles,
  processCSVData,
} from '../utils/csvParser';
import { detectCompetitors, classifyAndScore } from '../utils/scoring';
import {
  detectCategories,
  categorizeTermsDynamic,
} from '../utils/categories';

function splitComma(str) {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SetupFlow({ onComplete }) {
  const { t } = useLanguage();

  // Step 1 fields
  const [brandName, setBrandName] = useState('');
  const [asins, setAsins] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [files, setFiles] = useState([]);

  // Step 2 fields
  const [step, setStep] = useState(1);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});

  // Processing state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  const isStep1Valid = brandName.trim() && files.length > 0;

  // ─── Step 1 → Step 2 ───
  const handleNext = async () => {
    setLoading(true);
    setProgress(15);
    setProgressMsg(t('setup.detectingHeaders'));
    try {
      await new Promise((r) => setTimeout(r, 50));
      const hdrs = await readHeaders(files[0]);
      setHeaders(hdrs);
      const autoMapping = detectColumnMapping(hdrs);
      setMapping(autoMapping);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Error reading CSV headers.');
    }
    setLoading(false);
    setProgress(0);
  };

  // ─── Step 2 → Dashboard ───
  const handleConfirm = async () => {
    setLoading(true);
    try {
      setProgress(15);
      setProgressMsg(t('setup.parsingFiles'));
      await new Promise((r) => setTimeout(r, 50));
      const parsed = await parseCSVFiles(files);

      setProgress(30);
      setProgressMsg(t('setup.classifyingTerms'));
      await new Promise((r) => setTimeout(r, 50));
      const { terms, duplicateCount: dupes } = processCSVData(parsed, mapping);

      if (terms.length === 0) {
        alert('No data could be parsed. Please check the CSV format.');
        setLoading(false);
        return;
      }

      // Build brand config — first value is primary brand, rest are aliases
      const allBrandNames = splitComma(brandName);
      const primaryBrand = allBrandNames[0] || brandName.trim();
      const aliases = allBrandNames.slice(1);
      const manualCompetitors = splitComma(competitors);
      const ownIds = splitComma(asins);

      // Base config (before competitor detection)
      const baseConfig = {
        brandName: primaryBrand,
        brandAliases: aliases,
        competitorBrands: manualCompetitors,
        ownIdentifiers: ownIds,
      };

      // Auto-detect competitors from data
      setProgress(45);
      setProgressMsg(t('setup.detectingCompetitors'));
      await new Promise((r) => setTimeout(r, 50));
      const autoCompetitors = detectCompetitors(terms, baseConfig);

      // Merge: manual competitors take priority, then auto-detected
      const manualSet = new Set(manualCompetitors.map((c) => c.toLowerCase()));
      const mergedCompetitors = [
        ...manualCompetitors,
        ...autoCompetitors.filter(
          (c) => !manualSet.has(c.toLowerCase())
        ),
      ];

      const config = {
        ...baseConfig,
        competitorBrands: mergedCompetitors,
        detectedCompetitors: autoCompetitors,
      };

      // Classify and score
      setProgress(65);
      setProgressMsg(t('setup.calculatingScores'));
      await new Promise((r) => setTimeout(r, 50));
      const scored = classifyAndScore(terms, config);

      // Auto-detect categories from data
      setProgress(80);
      setProgressMsg(t('setup.buildingDashboard'));
      await new Promise((r) => setTimeout(r, 50));
      const dynamicCategories = detectCategories(scored);
      const categorized = categorizeTermsDynamic(scored, dynamicCategories);

      setProgress(100);
      onComplete(config, categorized, dupes, dynamicCategories);
    } catch (err) {
      console.error('Processing error:', err);
      alert('Error processing data. Check the console for details.');
    }
    setLoading(false);
  };

  // ─── Progress bar overlay ───
  const ProgressOverlay = () =>
    loading && progress > 0 ? (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="font-semibold text-gray-800">{progressMsg}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">{progress}%</p>
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <ProgressOverlay />

      <div className="w-full max-w-2xl">
        {/* Language selector — first element on screen */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4 shadow-lg shadow-blue-200">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {t('setup.title')}
          </h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {t('setup.subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                step === 1
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t('setup.step1')}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                step === 2
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t('setup.step2')}
            </span>
          </div>

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('setup.brandName')}{' '}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t('setup.brandNameHint')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('setup.asins')}
                </label>
                <input
                  type="text"
                  value={asins}
                  onChange={(e) => setAsins(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t('setup.asinsHint')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('setup.competitors')}
                </label>
                <input
                  type="text"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t('setup.competitorsHint')}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t('setup.competitorsAutoDetect')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('setup.uploadLabel')}{' '}
                  <span className="text-red-400">*</span>
                </label>
                <FileUpload files={files} onFilesChange={setFiles} />
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isStep1Valid || loading}
                className={`w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all ${
                  isStep1Valid && !loading
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200/50'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('setup.processing')}
                  </span>
                ) : (
                  t('setup.next')
                )}
              </button>
            </div>
          ) : (
            <HeaderMapping
              headers={headers}
              mapping={mapping}
              onMappingChange={setMapping}
              onConfirm={handleConfirm}
              onBack={() => setStep(1)}
              duplicateCount={0}
            />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {t('setup.privacy')}
        </p>
      </div>
    </div>
  );
}
