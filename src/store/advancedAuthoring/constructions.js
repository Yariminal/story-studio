import { t } from '../../i18n/index.js';
// Les constructions sont des demandes atomiques ; aucun payload n'est édité ici.
import { advancedGestures } from '../projectModel/advancedGestures.js';

// La disponibilité de la création ne modifie pas la lecture ni l'édition
// des constructions déjà présentes dans un document.
export const DERIVED_CONSTRUCTION_CREATION_ENABLED = false;

export function CONSTRUCTION_LABELS() {
  return Object.freeze({
  scene: t('Scène'), choice: 'Choix', sequence: t('Séquence'), random: 'Tirage au sort',
});
}
// Les réglages de départ d'une construction, par rôle d'Écran. HOME est
// allumé dans les deux, comme sur la quasi-totalité des Écrans d'un pack réel :
// sans lui, l'enfant ne peut plus revenir en arrière.
export const NARRATIVE_CONTROLS = Object.freeze({
  wheel: false, ok: false, home: true, pause: true, autoplay: true,
});
export const CHOICE_CONTROLS = Object.freeze({
  wheel: true, ok: true, home: true, pause: false, autoplay: false,
});

function stageUuid(index, path) {
  if (!path) return null;
  const entry = index?.byPath.get(path);
  if (!entry || entry.kind !== 'stage' || entry.node.uniqueId === false) {
    throw new TypeError(t('Choisissez un Écran existant avec un identifiant unique.'));
  }
  return entry.node.uuid;
}

export function buildConstructionGesture(index, draft) {
  const { kind, name, items, controls, optionControls, question, sourcePath, trigger, destinationPath } = draft;
  if (!Object.hasOwn(CONSTRUCTION_LABELS(), kind)) throw new TypeError('Construction inconnue.');
  if (kind !== 'sequence' && !name.trim()) throw new TypeError(t('Donnez un nom à la construction.'));
  const rows = kind === 'scene' ? [] : items;
  const minimum = kind === 'sequence' ? 1 : 2;
  if (kind !== 'scene' && rows.length < minimum) throw new TypeError(t("Ajoutez au moins {minimum} éléments.", { minimum: minimum }));
  for (const row of rows) {
    if (!row.name.trim() && !(kind === 'random' && row.targetPath)) {
      throw new TypeError(t('Nommez chaque nouveau passage ou proposition.'));
    }
  }
  if (kind === 'random' && !sourcePath) throw new TypeError(t('Choisissez l’Écran depuis lequel tirer au sort.'));
  if (!['autoplay', 'ok', 'home'].includes(trigger)) throw new TypeError(t('Déclencheur inconnu.'));
  return advancedGestures.createConstruction({
    kind, name: kind === 'sequence' ? rows[0].name.trim() : name.trim(),
    items: rows.map((row) => ({ name: row.name.trim(), target: kind === 'sequence' ? null : stageUuid(index, row.targetPath) })),
    controls: { ...controls }, optionControls: { ...optionControls },
    question: kind === 'choice' && question,
    destination: stageUuid(index, destinationPath),
    source: sourcePath ? {
      stageUuid: stageUuid(index, sourcePath),
      slot: trigger === 'home' ? 'home' : 'ok',
      controls: { form: 'members', members: { [trigger]: { form: 'set', value: true } } },
    } : null,
  });
}
