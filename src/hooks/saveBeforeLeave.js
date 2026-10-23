import { hasUnsavedWork } from '../store/projectHelpers';

import { t } from '../i18n/index.js';
// Garde commune de départ : fermeture de fenêtre, nouveau projet ou funnel,
// ouverture, récents, copie vers graphe. Rend true si on peut jeter la mémoire
// (tout est dans le fichier, ou l'auteur a choisi de ne pas enregistrer), false
// s'il a annulé ou si la sauvegarde n'a pas abouti.
//
// `readWork` relit l'état courant à chaque appel : projet, catalogue Médias,
// tags, `savedSnapshot` (signature au dernier save/load, null si jamais
// enregistré) et `pristine`. Une sauvegarde peut rendre un chemin tout en étant
// périmée — un travail a modifié le projet pendant l'écriture, et le fichier ne
// porte pas cette modification. Le chemin rendu ne suffit donc pas : on relit
// l'état, et tant qu'il reste du travail hors du fichier, on redemande.
//
// Deux variantes de question, selon que le projet a déjà un fichier : `savePath`
// et `projectName` (le nom que montre la barre de titre) sont lus avec le reste
// de l'état ; `hasUnsavedWork` les ignore.
const NEVER_SAVED_DIALOG = {
  title: t('Projet non enregistré'),
  message: t("Ton travail n'est pas enregistré et sera définitivement perdu."),
  discardLabel: t('Quitter sans enregistrer'),
  saveLabel: t('Enregistrer comme projet'),
};

function leaveDialog(work) {
  if (!work.savePath) return NEVER_SAVED_DIALOG;
  const name = String(work.projectName ?? '').trim() || t('Nouveau projet');
  return {
    title: t('Modifications non enregistrées'),
    message: `Les modifications de « ${name} » depuis le dernier enregistrement seront perdues.`,
    discardLabel: t('Ne pas enregistrer'),
    saveLabel: t('Enregistrer'),
  };
}

export async function askSaveBeforeLeave(readWork, onSave, showChoiceDialog) {
  const work = readWork();
  if (!hasUnsavedWork(work)) return true;
  const dialog = leaveDialog(work);
  const choice = await showChoiceDialog({
    title: dialog.title,
    message: dialog.message,
    variant: 'warning',
    cancelValue: 'cancel',
    actions: [
      { value: 'cancel', label: t('Annuler'), autoFocus: true },
      { value: 'discard', label: dialog.discardLabel, kind: 'danger-outline' },
      { value: 'save', label: dialog.saveLabel, kind: 'primary' },
    ],
  });
  if (choice === 'save') {
    let savedPath;
    try {
      savedPath = await onSave?.();
    } catch {
      return false;
    }
    if (!savedPath) return false;
    return askSaveBeforeLeave(readWork, onSave, showChoiceDialog);
  }
  return choice === 'discard';
}
