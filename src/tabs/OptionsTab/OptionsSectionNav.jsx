import { t } from '../../i18n/index.js';
const OPTION_GROUPS = [
  {
    label: t('Général'),
    items: [
      { id: 'save', label: t('Enregistrement') },
      { id: 'interface', label: t('Interface') },
      { id: 'projects-media', label: t('Projets et médias') },
    ],
  },
  {
    label: t('Intelligence artificielle'),
    items: [
      { id: 'xtts', label: t('Voix locale') },
      { id: 'comfyui', label: t('Images IA') },
    ],
  },
  {
    label: t('Avancé'),
    items: [
      { id: 'advanced', label: t('Silences audio') },
      { id: 'youtube', label: t('YouTube (yt-dlp)') },
      { id: 'diagnostic', label: t('Diagnostic') },
    ],
  },
];

export const OPTION_SECTION_IDS = OPTION_GROUPS.flatMap((group) => group.items.map((item) => item.id));

export function OptionsSectionNav({ activeSectionId, onNavigate }) {
  return (
    <nav className="opts-nav" aria-label={t("Sections des préférences")}>
      {OPTION_GROUPS.map((group) => (
        <div className="opts-nav-group" key={group.label}>
          <div className="opts-nav-group-title">{group.label}</div>
          <div className="opts-nav-items">
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`opts-nav-item${activeSectionId === item.id ? ' is-active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
