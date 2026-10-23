import { t } from '../i18n/index.js';
// Validation shown in the React UI is an early, user-friendly warning layer.
// Rust remains the final generation contract and may reject additional cases.
// French strings below are i18n msgids; English comes from the locale catalog.

const FIELD_LABELS = Object.freeze({
  audio: () => t('Audio'),
  'audio intro': () => t("Audio d'accueil"),
  'audio titre': () => t('Audio de sélection'),
  histoire: () => t('Histoire'),
  image: () => t('Image'),
  'image de couverture': () => t('Image de couverture'),
  'image bibliothèque': () => t('Image bibliothèque'),
  zip: () => t('Archive ZIP'),
});

function fieldLabel(field) {
  const resolver = FIELD_LABELS[field];
  if (resolver) return resolver();
  return String(field || t('Élément'));
}

export function missingField(label, field, { feminine = false } = {}) {
  void feminine;
  return t('{label} — {field} à ajouter', { label, field: fieldLabel(field) });
}

export function brokenField(label, field) {
  return t('{label} — Fichier {field} introuvable', { label, field: fieldLabel(field).toLowerCase() });
}

export function missingTarget(label, what) {
  return t('{label} — destination {what} introuvable', { label, what });
}

export function emptyTarget(label, what) {
  return t('{label} — destination {what} vide', { label, what });
}

export const VALIDATION_MESSAGES = Object.freeze({
  noProjectType: () => t('Type de projet à choisir.'),
  importedTransitionUnmodeled: () => t('Transition importée à vérifier.'),
  rootReservedId: () => t("Identifiant réservé à corriger — aucun élément ne doit porter l'id root"),
  missingInternalId: (label) => t('{label} — Identifiant interne à corriger', { label }),
  unsupportedEntryType: (label) => t("{label} — Type d'élément non pris en charge", { label }),
  refTargetMissing: (label) => t('{label} — Référence sans cible', { label }),
  reservedIdInvalid: (label) => t('{label} — Identifiant réservé à corriger', { label }),
  duplicateId: (count, entryId) => t("Identifiant dupliqué — {count} éléments partagent l'id {entryId}", { count, entryId }),
  storyReturnLost: (label) => t('{label} — Retour de fin introuvable', { label }),
  storyWithoutExit: (label) => t("{label} — Fin sans sortie : activez le bouton Accueil de cette histoire, ou choisissez « Enchaîner » dans « Après la lecture »", { label }),
  emptyMenu: (label) => t('{label} — Histoire à ajouter', { label }),
  emptyPack: () => t('Histoire à ajouter dans le pack.'),
});
