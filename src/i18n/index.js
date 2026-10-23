// Lightweight UI i18n for Story Studio.
// French remains the source language in code (msgid). English (and later
// locales) live in JSON catalogs keyed by the French string.
// Prefer `t('Texte français')` so existing hard-coded French stays readable
// while English can be selected at runtime.

import fr from './locales/fr.json';
import en from './locales/en.json';

export const SUPPORTED_LOCALES = Object.freeze(['fr', 'en']);
export const DEFAULT_LOCALE = 'fr';

const catalogs = Object.freeze({
  fr,
  en,
});

let currentLocale = DEFAULT_LOCALE;
let localeReady = false;
const listeners = new Set();

function ensureLocale() {
  if (localeReady) return;
  currentLocale = readStoredLocale();
  localeReady = true;
}

function readStoredLocale() {
  try {
    const stored = localStorage.getItem('storyStudio.uiLocale');
    if (SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch {
    // localStorage may be unavailable in some test harnesses
  }
  return DEFAULT_LOCALE;
}

export function getLocale() {
  ensureLocale();
  return currentLocale;
}

export function setLocale(locale) {
  ensureLocale();
  const next = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  if (next === currentLocale) return currentLocale;
  currentLocale = next;
  localeReady = true;
  try {
    localStorage.setItem('storyStudio.uiLocale', next);
  } catch {
    // ignore persistence failures
  }
  listeners.forEach((listener) => listener(currentLocale));
  return currentLocale;
}

export function subscribeLocale(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initLocale(preferred = null) {
  currentLocale = preferred && SUPPORTED_LOCALES.includes(preferred)
    ? preferred
    : readStoredLocale();
  localeReady = true;
  return currentLocale;
}

/**
 * Translate a French source string.
 * @param {string} message French UI string (msgid)
 * @param {Record<string, string|number>} [vars] `{name}` placeholders
 */
export function t(message, vars) {
  if (message == null) return '';
  ensureLocale();
  const key = String(message);
  const catalog = catalogs[currentLocale] || catalogs.fr;
  let out = catalog[key];
  if (out == null) {
    // Fallback: French catalog, then the msgid itself
    out = catalogs.fr[key] ?? key;
  }
  if (vars && typeof out === 'string') {
    out = out.replace(/\{(\w+)\}/g, (_, name) => (
      vars[name] == null ? `{${name}}` : String(vars[name])
    ));
  }
  return out;
}

/** Plural helper: `tp(count, 'fichier', 'fichiers')` */
export function tp(count, singular, plural, vars) {
  const n = Number(count);
  const message = n === 1 ? singular : plural;
  return t(message, { count: n, ...(vars || {}) });
}

export function localeLabel(locale) {
  if (locale === 'en') return 'English';
  if (locale === 'fr') return 'Français';
  return locale;
}
