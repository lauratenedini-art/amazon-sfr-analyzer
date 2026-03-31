import { useLanguage } from '../contexts/LanguageContext';

const FLAGS = { en: 'EN', pt: 'PT', es: 'ES' };

export default function LanguageSelector({ className = '' }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Object.keys(FLAGS).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 rounded text-xs font-bold tracking-wide transition-all ${
            lang === code
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white/80 text-gray-500 hover:bg-gray-100 border border-gray-200'
          }`}
          title={t(`lang.${code}`)}
        >
          {FLAGS[code]}
        </button>
      ))}
    </div>
  );
}
