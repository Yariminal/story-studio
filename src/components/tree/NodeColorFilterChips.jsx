import { t } from '../../i18n/index.js';
import './NodeColorFilterChips.css';

export function NodeColorFilterChips({ colors, selectedColors, onToggle }) {
  if (!colors?.length) return null;

  return (
    <div className="node-color-filter-row" role="group" aria-label={t("Filtrer par couleur")}>
      {colors.map(({ color, count, label }) => (
        <button
          key={color}
          type="button"
          className={`node-color-filter-chip${selectedColors.has(color) ? ' is-active' : ''}`}
          style={{ '--node-filter-color': color }}
          aria-label={count > 1
            ? t('{label}, {count} éléments', { label, count })
            : t('{label}, {count} élément', { label, count })}
          aria-pressed={selectedColors.has(color)}
          title={count > 1
            ? t('{label} · {count} éléments', { label, count })
            : t('{label} · {count} élément', { label, count })}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onToggle(color)}
        />
      ))}
    </div>
  );
}
