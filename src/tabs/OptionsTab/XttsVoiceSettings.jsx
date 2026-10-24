import { Button } from '../../components/common/Button';
import { Toggle } from '../../components/common/Toggle';
import { formatFrenchCount } from '../../utils/frenchText.js';

import { t } from '../../i18n/index.js';
const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
];

export function XttsVoiceSettings({
  xttsSettings,
  xttsProbe,
  xttsVoices,
  xttsVoicesLoaded,
  xttsLogs,
  favoriteVoices,
  testXtts,
  toggleXttsFavorite,
  clearXttsFavorites,
  updateServerUrl,
  updateXttsDir,
  updateLanguage,
  updateAutoStart,
  updateForceCpu,
}) {
  return (
    <div className="xtts-settings">
      <div className="xtts-grid">
        <label className="xtts-label">
          {t('URL du serveur XTTS')}
          <input
            className="xtts-input"
            value={xttsSettings.serverUrl}
            onChange={(e) => updateServerUrl(e.target.value)}
            placeholder="http://127.0.0.1:8020"
          />
        </label>

        <label className="xtts-label">
          {t('Dossier XTTS')}
          <input
            className="xtts-input"
            value={xttsSettings.xttsDir}
            onChange={(e) => updateXttsDir(e.target.value)}
            placeholder={t("Dossier contenant server.py, venv, models et voices")}
          />
        </label>

        <label className="xtts-label">
          {t('Langue par défaut')}
          <select
            className="xtts-input"
            value={xttsSettings.language}
            onChange={(e) => updateLanguage(e.target.value)}
          >
            {LANGUAGE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{t(label)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="opts-row opts-row--pt">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Démarrer XTTS automatiquement si le serveur est arrêté')}</div>
          <div className="opts-row-sub">
            {t('Story Studio lancera server.py depuis ton dossier XTTS si besoin.')}
          </div>
        </div>
        <Toggle on={xttsSettings.autoStart} onChange={updateAutoStart} />
      </div>

      <div className="opts-row opts-row--pt">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Forcer le CPU (compatible ComfyUI simultané)')}</div>
          <div className="opts-row-sub">
            {t("XTTS s'exécute sur CPU — plus lent (~3×) mais libère le GPU pour ComfyUI.")}
          </div>
        </div>
        <Toggle on={xttsSettings.forceCpu} onChange={updateForceCpu} />
      </div>

      <div className="xtts-actions">
        <Button onClick={testXtts} disabled={xttsProbe.state === 'loading'}>
          {xttsProbe.state === 'loading' ? t('Test en cours…') : t('Tester et actualiser les voix')}
        </Button>
        <span className="opts-row-sub">
          {favoriteVoices.length > 0
            ? `${formatFrenchCount(
              favoriteVoices.length,
              t('voix favorite affichée dans la modale'),
              t('voix favorites affichées dans la modale'),
            )}.`
            : t('Aucune voix favorite : toutes les voix XTTS détectées seront proposées.')}
        </span>
      </div>

      {xttsProbe.state !== 'idle' && (
        <div className={`info-box ${xttsProbe.state === 'error' ? 'warn' : ''}`}>
          {xttsProbe.message}
        </div>
      )}

      {xttsLogs.length > 0 && (
        <div className="xtts-log-panel" aria-label={t('Journal XTTS')}>
          {xttsLogs.map((line, index) => (
            <div key={`${index}-${line}`} className="xtts-log-line">{line}</div>
          ))}
        </div>
      )}

      <div className="xtts-voices-panel">
        <div className="xtts-voices-header">
          <div>
            <div className="opts-row-label">{t('Voix favorites')}</div>
            <div className="opts-row-sub">
              {t('Coche uniquement les voix que tu veux voir dans la modale de génération.')}
            </div>
          </div>
          <Button onClick={clearXttsFavorites} disabled={favoriteVoices.length === 0}>
            {t('Tout afficher')}
          </Button>
        </div>

        {!xttsVoicesLoaded ? (
          <div className="xtts-voices-empty">
            {t('Actualise les voix XTTS pour choisir tes favorites.')}
          </div>
        ) : xttsVoices.length === 0 ? (
          <div className="xtts-voices-empty">
            {t('Aucune voix retournée par XTTS.')}
          </div>
        ) : (
          <div className="xtts-voice-list">
            {xttsVoices.map((voiceName) => (
              <label key={voiceName} className="xtts-voice-item">
                <input
                  type="checkbox"
                  checked={favoriteVoices.includes(voiceName)}
                  onChange={() => toggleXttsFavorite(voiceName)}
                />
                <span>{voiceName}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
