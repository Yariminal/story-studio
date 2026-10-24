import { PiperVoiceSettings } from './PiperVoiceSettings';
import { XttsVoiceSettings } from './XttsVoiceSettings';
import { t } from '../../i18n/index.js';
import { usePiperVoiceOptions } from './usePiperVoiceOptions';
import { useXttsVoiceOptions } from './useXttsVoiceOptions';

export function VoiceSection({ className, sectionRef, xttsSettings, onUpdateXttsSettings }) {
  const ttsBackend = xttsSettings.backend || 'piper';
  const piperOptions = usePiperVoiceOptions({ xttsSettings, onUpdateXttsSettings });
  const xttsOptions = useXttsVoiceOptions({ xttsSettings, onUpdateXttsSettings });

  function handleTtsBackendChange(backend) {
    // Sélectionner XTTS l'active (le moteur remplace l'ancien toggle d'activation).
    onUpdateXttsSettings(backend === 'xtts' ? { backend, enabled: true } : { backend });
  }

  return (
    <section id="xtts" className={className} ref={sectionRef}>
      <div className="opts-card-title">{t('Génération de voix locale')}</div>
      <div className="opts-row">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Moteur de voix')}</div>
          <div className="opts-row-sub">
            <strong>Piper</strong> {t('fonctionne sans configuration (recommandé).')} <strong>XTTS</strong> {t('est destiné aux utilisateurs avancés (clonage de voix, serveur local).')}
          </div>
        </div>
        <select
          className="xtts-input opts-select"
          value={ttsBackend}
          onChange={(e) => handleTtsBackendChange(e.target.value)}
        >
          <option value="piper">{t('Piper (défaut)')}</option>
          <option value="xtts">{t('XTTS (avancé)')}</option>
        </select>
      </div>

      {ttsBackend === 'piper' && (
        <PiperVoiceSettings {...piperOptions} />
      )}

      {ttsBackend === 'xtts' && (
        <XttsVoiceSettings
          xttsSettings={xttsSettings}
          {...xttsOptions}
        />
      )}
    </section>
  );
}
