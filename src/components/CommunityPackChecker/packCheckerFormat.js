import { t } from '../../i18n/index.js';
// Helpers purs (sans React) partages par l'UI du verificateur et l'export du
// rapport : formatteurs de mesures, construction des lignes audio/image, et
// predicats de conformite. Garde l'export texte independant de tout JSX.

function formatNumber(value, digits = 1) {
  return typeof value === 'number' ? value.toFixed(digits).replace('.', ',') : null;
}

export function formatSeconds(value) {
  const formatted = formatNumber(value, 2);
  return formatted ? `${formatted} s` : t('Non mesuré');
}

export function formatLufs(value) {
  const formatted = formatNumber(value, 1);
  return formatted ? `${formatted} LUFS` : t('Non mesuré');
}

export function formatPeak(value) {
  const formatted = formatNumber(value, 1);
  return formatted ? `${formatted} dBTP` : t('Non mesuré');
}

export function cleanLabel(label) {
  return (label || 'Fichier')
    .replace(/\.mp3 (item|Stage node)$/i, '')
    .replace(/\.png$/i, '')
    .replace(/ node$/i, '');
}

export function expectedImageOk(item) {
  return item?.width === 320 && item?.height === 240;
}

// Lignes de mesure audio. Les `key` servent aussi, cote problemes, a reperer
// quelle mesure est en defaut (voir hasMeasureIssue).
export function audioMeasureRows(item) {
  return [
    { key: 'format', label: 'Format', value: `${item?.codec || 'Inconnu'} · ${item?.channels || 'canaux ?'}` },
    { key: 'sampleRate', label: t('Échantillonnage'), value: item?.sampleRate ? `${formatNumber(item.sampleRate / 1000, 1)} kHz` : t('Non mesuré') },
    { key: 'silenceStart', label: t('Silence début'), value: formatSeconds(item?.leadingSilenceSecs) },
    { key: 'silenceEnd', label: t('Silence fin'), value: formatSeconds(item?.trailingSilenceSecs) },
    { key: 'volume', label: t("Volume"), value: formatLufs(item?.integratedLufs) },
    { key: 'peak', label: t('Crête vraie'), value: formatPeak(item?.truePeakDb) },
  ];
}

export function imageMeasureRows(item) {
  return [
    { key: 'dimensions', label: 'Dimensions', value: item?.width && item?.height ? `${item.width}×${item.height}` : t('Non mesuré') },
    { key: 'imageFormat', label: 'Format', value: item?.format || t('Non mesuré') },
  ];
}

// Un fichier est conforme s'il n'a ni erreur ni avertissement : complement
// exact de ce qui apparait dans les cartes de problemes.
export function isConforming(status) {
  return status !== 'error' && status !== 'warning';
}

export function titleConforming(report) {
  const total = report?.titleSummary?.total ?? 0;
  const ok = report?.titleSummary?.ok ?? 0;
  return total > 0 && total - ok === 0;
}

export function structureConforming(report) {
  return Boolean(report?.structureSummary?.luniiCompatible && report?.structureSummary?.storyStudioEditable);
}
