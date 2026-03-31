import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('pt');

  const t = (key, params) => {
    const str = translations[key]?.[lang] || translations[key]?.pt || key;
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
