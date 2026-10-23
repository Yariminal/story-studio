import { createContext, useContext, useEffect, useState } from 'react';
import {
  getLocale,
  initLocale,
  localeLabel,
  setLocale as setLocaleGlobal,
  subscribeLocale,
  SUPPORTED_LOCALES,
  t as tGlobal,
  tp as tpGlobal,
} from './index.js';

const LocaleContext = createContext({
  locale: 'fr',
  setLocale: () => {},
  t: tGlobal,
  tp: tpGlobal,
  locales: SUPPORTED_LOCALES,
  localeLabel,
});

export function LocaleProvider({ children, initialLocale = null }) {
  const [locale, setLocaleState] = useState(() => initLocale(initialLocale));

  useEffect(() => subscribeLocale(setLocaleState), []);

  function setLocale(next) {
    setLocaleState(setLocaleGlobal(next));
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: tGlobal,
        tp: tpGlobal,
        locales: SUPPORTED_LOCALES,
        localeLabel,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  const { t, tp, locale } = useLocale();
  // Re-bind when locale changes so memoized children refresh
  return { t, tp, locale };
}

export { getLocale, tGlobal as t, tpGlobal as tp };
