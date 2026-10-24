import { t } from '../i18n/index.js';
export function WorkspaceEmptyState({ onShowTree, onShowSettings, onShowDiagram }) {
  return (
    <div className="workspace-empty-state">
      <p>{t('Aucun panneau affiché')}</p>
      <span>{t('Réactive une vue pour reprendre l’édition.')}</span>
      <div className="workspace-empty-state-actions">
        <button type="button" onClick={onShowTree}>Arbre</button>
        <button type="button" onClick={onShowSettings}>{t('Réglages')}</button>
        <button type="button" onClick={onShowDiagram}>Diagramme</button>
      </div>
    </div>
  );
}
