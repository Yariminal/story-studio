import { Button } from '../../components/common/Button';
import { Toggle } from '../../components/common/Toggle';
import { useSelectionOpensSettings } from '../../hooks/useSelectionOpensSettings';
import { writeSelectionOpensSettings } from '../../store/selectionOpensSettings';
import { THEME_OPTIONS } from '../../store/themePreference';
import { t } from '../../i18n/index.js';
import { UI_LOCALE_OPTIONS, saveUiLocalePreference } from '../../store/uiLocalePreference.js';
import { useLocale } from '../../i18n/LocaleContext.jsx';

export function InterfaceSection({
  className,
  sectionRef,
  themePreference,
  onThemePreferenceChange,
  onOpenShortcuts,
}) {
  const selectionOpensSettings = useSelectionOpensSettings();
  const { locale, setLocale } = useLocale();
  return (
    <section id="interface" className={className} ref={sectionRef}>
      <div className="opts-card-title">{t('Interface')}</div>
      <div className="opts-row">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Langue')}</div>
          <div className="opts-row-sub">{t("Langue de l'interface Story Studio")}</div>
        </div>
        <select
          className="xtts-input opts-select"
          value={locale}
          onChange={(event) => {
            const next = saveUiLocalePreference(event.target.value);
            setLocale(next);
          }}
        >
          {UI_LOCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="opts-row">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Thème')}</div>
          <div className="opts-row-sub">{t("Système suit l'apparence configurée dans Windows/macOS")}</div>
        </div>
        <select
          className="xtts-input opts-select"
          value={themePreference}
          onChange={(event) => onThemePreferenceChange?.(event.target.value)}
        >
          {THEME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{t(option.label)}</option>
          ))}
        </select>
      </div>
      <div className="opts-row">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Ouvrir les réglages quand on sélectionne un nœud')}</div>
          <div className="opts-row-sub">{t("Dans les deux éditeurs : un clic dans l'arbre, le diagramme, la liste ou le graphe rouvre les Réglages ou l'Inspecteur s'ils sont fermés.")}</div>
        </div>
        <Toggle
          on={selectionOpensSettings}
          onChange={writeSelectionOpensSettings}
          ariaLabel={t('Ouvrir les réglages quand on sélectionne un nœud')}
        />
      </div>
      <div className="opts-row">
        <div className="opts-row-info">
          <div className="opts-row-label">{t('Raccourcis clavier')}</div>
          <div className="opts-row-sub">{t("Voir et modifier les raccourcis de l'application")}</div>
        </div>
        <Button onClick={onOpenShortcuts}>
          {t('Modifier')}
        </Button>
      </div>
    </section>
  );
}
