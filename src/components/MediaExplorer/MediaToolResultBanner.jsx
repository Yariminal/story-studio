import { Button } from '../common/Button';

import { t } from '../../i18n/index.js';
export function MediaToolResultBanner({
  result,
  unavailableReason = '',
  onFinish,
}) {
  if (!result) return null;
  const createdCount = result.createdPaths?.length ?? 0;
  const defaultMessage = createdCount === 1
    ? t('Le fichier créé est sélectionné dans Médias.')
    : `${createdCount} fichiers créés sont sélectionnés dans Médias.`;

  return (
    <div className="media-tool-result" role="status" aria-live="polite">
      <Button
        variant="icon"
        className="media-tool-result-close"
        onClick={onFinish}
        aria-label={t("Fermer la notification")}
        title={t("Fermer")}
      >×</Button>
      <div className="media-tool-result-copy">
        <strong>{result.projectApplied ? t('Projet mis à jour') : t('Fichiers créés dans Médias')}</strong>
        <span>{result.message || defaultMessage}</span>
        {unavailableReason ? (
          <small>{unavailableReason}{result.projectApplied ? '' : ' Les fichiers créés restent disponibles dans Médias.'}</small>
        ) : null}
      </div>
    </div>
  );
}
