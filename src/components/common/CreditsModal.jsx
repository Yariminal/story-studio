import { openUrl } from '@tauri-apps/plugin-opener';
import { AppModalPortal } from './AppModalPortal';
import { Button } from './Button';
import { useErrorDialog } from './Dialog';
import { isTauriRuntime } from '../../utils/tauriRuntime';
import './CreditsModal.css';

import { t } from '../../i18n/index.js';
const DOCUMENTATION_URL = 'https://hugs11.github.io/story-studio/docs/';

/** Modale « À propos de Story Studio » (crédits). */
export function CreditsModal({ appVersion, onClose }) {
  const { showErrorDialog } = useErrorDialog();

  async function handleDocumentationClick(event) {
    // En développement web, laisser le lien HTTPS suivre son comportement natif.
    if (!isTauriRuntime()) return;
    event.preventDefault();
    try {
      await openUrl(DOCUMENTATION_URL);
    } catch (error) {
      showErrorDialog({
        title: t('Documentation inaccessible'),
        message: t("Impossible d’ouvrir la documentation dans le navigateur : {error}", { error: error }),
      });
    }
  }

  return (
    <AppModalPortal>
      <div
        className="modal-box credits-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credits-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span id="credits-modal-title">{t('À propos de Story Studio')}</span>
          <Button variant="icon" className="modal-close" onClick={onClose} aria-label={t("Fermer")}>✕</Button>
        </div>
        <div className="credits-body">
          <div className="credits-head">
            <span className="credits-name">Story Studio</span>
            {appVersion && <span className="credits-version">v{appVersion}</span>}
          </div>
          <div className="credits-line"> {t("Né d'une envie simple : créer des histoires pour Armand.")} </div>
          <div className="credits-line"> {t("Créé par hugs11, assisté par l'IA")} </div>
          <section className="credits-help" aria-labelledby="credits-help-title">
            <span id="credits-help-title" className="credits-help-title">{t('Aide')}</span>
            <a
              className="credits-documentation-link"
              href={DOCUMENTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDocumentationClick}
            >
              Documentation
            </a>
          </section>
          <div className="credits-line credits-thanks">
            Remerciements<br />
            <strong>marian-m12l</strong> {t('(créateur de STUdio),')} <strong>Jersou</strong>,{' '}
            <strong>Dantsu</strong>, <strong>o.Daneel</strong> {t("(créateur de Lunii.QT) et")}{' '}
            <strong>LuckyTheCookie</strong>
          </div>
        </div>
      </div>
    </AppModalPortal>
  );
}
