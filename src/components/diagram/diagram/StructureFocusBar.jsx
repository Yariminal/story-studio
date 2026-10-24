import { t } from '../../../i18n/index.js';
export function StructureFocusBar({ focus, pinned, onClear }) {
  if (!focus) return null;
  return (
    <div className={`fd-structure-focus-bar ${pinned ? 'is-pinned' : ''}`} role="status">
      <div className="fd-structure-focus-main">
        <span className="fd-structure-focus-depth">{`N${focus.targetDepth}`}</span>
        <span className="fd-structure-focus-relation">
          {focus.parentLabel}
          <span aria-hidden="true">→</span>
          {focus.targetLabel}
        </span>
      </div>
      <div className="fd-structure-focus-breadcrumb" title={focus.breadcrumb.join(' › ')}>
        {focus.breadcrumb.join(' › ')}
      </div>
      {pinned ? (
        <button type="button" className="fd-structure-focus-clear" onClick={onClear} title={t("Libérer la structure (Échap)")}>
          ×
        </button>
      ) : (
        <span className="fd-structure-focus-hint">{t('Cliquer pour épingler')}</span>
      )}
    </div>
  );
}
