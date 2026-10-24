import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Toggle } from '../../components/common/Toggle';
import { t } from '../../i18n/index.js';

export function DiagnosticSection({
  className,
  sectionRef,
  verboseLogging,
  onVerboseLoggingChange,
  onCopyLogPath,
  onResolveLogPath,
}) {
  const [copiedLogPath, setCopiedLogPath] = useState(null);
  const [resolvedLogPath, setResolvedLogPath] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!onResolveLogPath) return undefined;
    onResolveLogPath().then((path) => {
      if (!cancelled && path) setResolvedLogPath(path);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [onResolveLogPath]);

  async function handleCopyLogPathClick() {
    if (!onCopyLogPath) return;
    const file = await onCopyLogPath();
    if (file) {
      setCopiedLogPath(file);
      setTimeout(() => setCopiedLogPath(null), 2200);
    }
  }

  return (
    <section id="diagnostic" className={className} ref={sectionRef}>
      <div className="opts-card-title">{t('Diagnostic')}</div>
      <div className="opts-row">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Journalisation détaillée')}</div>
          <div className="opts-row-sub">
            {t("Enregistre les événements normaux (chargements, enregistrements, générations) dans le fichier de log, en plus des erreurs. Utile pour partager le contexte d'un bug dans une issue GitHub. Désactivé : seuls les avertissements et erreurs sont enregistrés.")}
          </div>
        </div>
        <Toggle on={!!verboseLogging} onChange={onVerboseLoggingChange} />
      </div>
      <div className="opts-row">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Dossier des logs')}</div>
          <div className="opts-row-sub">
            {resolvedLogPath ? (
              <><code>{resolvedLogPath}</code> — {t('fichier courant :')} <code>story-studio.log</code></>
            ) : (
              <>{t('Dans le dossier de données de Story Studio. Fichier courant :')} <code>story-studio.log</code>.</>
            )}
            {copiedLogPath ? (
              <span style={{ color: 'var(--accent-2-text)', marginLeft: 6 }}>{t('(copié)')}</span>
            ) : null}
          </div>
        </div>
        <Button onClick={handleCopyLogPathClick} disabled={!onCopyLogPath} style={{ flexShrink: 0 }}>
          {t('Copier le chemin')}
        </Button>
      </div>
      <div className="opts-help">
        {t('Le fichier peut contenir des chemins locaux (noms de fichiers, dossier utilisateur). Vérifie son contenu avant de le partager publiquement.')}
      </div>
    </section>
  );
}
