import { KEYS, read as readSetting, write as writeSetting } from './persistentSettings';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, initLocale, setLocale } from '../i18n/index.js';

// Language names stay in their own language on purpose.
export const UI_LOCALE_OPTIONS = Object.freeze([
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]);

export function loadUiLocalePreference() {
  try {
    const stored = readSetting(KEYS.UI_LOCALE);
    return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function saveUiLocalePreference(locale) {
  const next = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  try {
    writeSetting(KEYS.UI_LOCALE, next);
  } catch {
    // ignore
  }
  setLocale(next);
  return next;
}

export function applyUiLocalePreference(locale = loadUiLocalePreference()) {
  return initLocale(locale);
}
