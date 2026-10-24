import { t } from '../../i18n/index.js';
// Retirer une option ne choisit jamais une autre destination à la place de
// l'auteur. Les transitions qui visaient cette occurrence perdent leur lien ;
// le moteur les signale ensuite comme raccords rompus.

import { AdvancedDialog } from './AdvancedDialog.jsx';
import { optionRemovalImpact } from '../../store/advancedAuthoring/authoringPlans.js';
import { advancedGestures, selectionResolution } from '../../store/projectModel/advancedGestures.js';

export function RemoveOptionDialog({ index, actionPath, ordinal, busy, onCancel, onConfirm }) {
  const entry = index.byPath.get(actionPath);
  const impact = optionRemovalImpact(index, actionPath, ordinal);

  const confirm = () => {
    onConfirm(advancedGestures.removeActionOption(
      entry.node.id,
      ordinal,
      impact.decisions.map((row) => ({
        stageUuid: row.stageUuid,
        slot: row.slot,
        resolution: selectionResolution.removeAsAbsent(),
      })),
    ));
  };

  return (
    <AdvancedDialog
      title={t("Retirer le choix {ordinal}", { ordinal: ordinal })}
      description={impact.decisions.length === 0
        ? t("Ce choix sera retiré de la liste.")
        : t("Ce choix sera retiré. {length} raccord(s) vers lui seront coupés et signalés dans « À corriger ».", { length: impact.decisions.length })}
      onCancel={onCancel}
      onConfirm={confirm}
      confirmLabel={t("Retirer")}
      confirmKind="danger"
      busy={busy}
    >
      {impact.decisions.length > 0 && (
        <ul className="advanced-decision-list">
          {impact.decisions.map((row) => (
            <li key={`${row.stagePath}#${row.slot}`} className="advanced-decision-list__row">
              <span className="advanced-decision-list__what">
                <strong>{row.stageLabel}</strong> — {row.slot === 'ok' ? t('OK') : t("Accueil")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AdvancedDialog>
  );
}
