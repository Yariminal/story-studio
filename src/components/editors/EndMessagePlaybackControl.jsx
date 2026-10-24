import { Toggle } from '../common/Toggle';

import { t } from '../../i18n/index.js';
function playbackSummaryText(summary) {
  if (summary.total === 0) {
    return t('Le réglage s’appliquera aux histoires du pack.');
  }
  if (summary.mode === 'mixed') {
    const stays = summary.stays ? t(" · {stays} restent sur le message", { stays: summary.stays }) : '';
    return t("{waitingOk} histoires attendent un appui sur OK · {autoPlay} continuent automatiquement{stays}", { waitingOk: summary.waitingOk, autoPlay: summary.autoPlay, stays: stays });
  }
  if (summary.mode === 'wait') {
    return summary.total > 1
      ? t('{count} histoires attendent un appui sur OK.', { count: summary.total })
      : t('{count} histoire attend un appui sur OK.', { count: summary.total });
  }
  return summary.total > 1
    ? t('{count} histoires continuent automatiquement.', { count: summary.total })
    : t('{count} histoire continue automatiquement.', { count: summary.total });
}

function playbackExplanationText(mode) {
  if (mode === 'mixed') {
    return t('Certaines histoires continuent automatiquement, d’autres attendent un appui sur OK.');
  }
  if (mode === 'wait') {
    return t('L’enfant reste sur le message de fin tant qu’il n’a pas appuyé sur OK.');
  }
  return t('La destination suivante s’ouvre dès la fin du message.');
}

export function EndMessagePlaybackControl({ summary, onChange }) {
  const waitForOk = summary.mode === 'wait';
  const mixed = summary.mode === 'mixed';

  return (
    <div className="end-message-playback-control">
      <div className="end-message-playback-choice">
        <button
          type="button"
          className={`end-message-playback-label${summary.mode === 'auto' ? ' is-active' : ''}`}
          onClick={() => onChange?.(true)}
        >
          Automatiquement
        </button>
        <Toggle
          on={waitForOk}
          mixed={mixed}
          onChange={(nextWaitForOk) => onChange?.(!nextWaitForOk)}
          ariaLabel={mixed
            ? t('Réglage mixte importé ; cliquer pour faire attendre un appui sur OK à toutes les histoires')
            : t('Attendre un appui sur OK après le message de fin')}
        />
        <button
          type="button"
          className={`end-message-playback-label${summary.mode === 'wait' ? ' is-active' : ''}`}
          onClick={() => onChange?.(false)}
        > {t("Après appui sur OK")} </button>
      </div>
      <div className="end-message-playback-explanation">
        {playbackExplanationText(summary.mode)}
      </div>
      <div className={`end-message-playback-summary${mixed ? ' is-mixed' : ''}`}>
        {mixed ? <strong>{t('Réglage mixte importé')}</strong> : null}
        <span>{playbackSummaryText(summary)}</span>
      </div>
    </div>
  );
}
