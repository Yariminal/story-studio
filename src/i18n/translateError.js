import { t } from './index.js';

/**
 * Map a backend (often French) error string through the UI catalog.
 * Unknown messages pass through unchanged so new Rust errors still show.
 */
export function translateError(message) {
  if (message == null) return '';
  const text = String(message);
  const translated = t(text);
  if (translated !== text) return translated;
  // Try stripping trailing punctuation variants
  const trimmed = text.trim();
  if (trimmed !== text) {
    const again = t(trimmed);
    if (again !== trimmed) return again;
  }
  return text;
}
