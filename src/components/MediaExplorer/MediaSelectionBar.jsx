import { t } from '../../i18n/index.js';
import { tagStyle } from './helpers';
import { Button } from '../common/Button';

export function MediaSelectionBar({
  selectedCount,
  graphMediaTarget,
  onAssignToGraph,
  selectedAudioItems,
  onCopyAudio,
  onCutAudio,
  onOpenAssembly,
  onAddMediaTag,
  bulkTag,
  onBulkTagChange,
  bulkTagOpen,
  onBulkTagOpenChange,
  allTags,
  visibleSelectedItems,
  onClear,
}) {
  const multiple = selectedCount > 1;
  if (!multiple && !(selectedCount === 1 && graphMediaTarget)) return null;

  function applyBulkTag(e) {
    e.preventDefault();
    const tag = bulkTag.trim();
    if (!tag || selectedCount === 0 || !onAddMediaTag) return;
    for (const item of visibleSelectedItems) {
      onAddMediaTag(item.path, tag);
    }
    onBulkTagChange('');
  }

  return (
    <div className="media-selection-bar">
      <span className="media-selection-count">{selectedCount > 1
        ? t('{count} sélectionnés', { count: selectedCount })
        : t('{count} sélectionné', { count: selectedCount })}</span>
      {graphMediaTarget && (
        <Button variant="primary" className="media-selection-btn" onClick={onAssignToGraph}>
          {t('Utiliser sur « {name} »', { name: graphMediaTarget.label })}
        </Button>
      )}
      {multiple && selectedAudioItems.length > 0 ? (
        <>
          <Button className="media-selection-btn" onClick={onCopyAudio}>
            {selectedAudioItems.length > 1
              ? t('Copier {count} sons', { count: selectedAudioItems.length })
              : t('Copier {count} son', { count: selectedAudioItems.length })}
          </Button>
          <Button className="media-selection-btn" onClick={onCutAudio}>
            {selectedAudioItems.length > 1
              ? t('Couper {count} sons', { count: selectedAudioItems.length })
              : t('Couper {count} son', { count: selectedAudioItems.length })}
          </Button>
          {selectedAudioItems.length >= 2 && (
            <Button variant="primary" className="media-selection-btn" onClick={onOpenAssembly}>
              {t("Assembler les audios")}
            </Button>
          )}
        </>
      ) : null}
      {multiple && onAddMediaTag ? (
        <div className="media-selection-tag-wrap">
          <form className="media-selection-tag-form" onSubmit={applyBulkTag}>
            <input
              className="media-selection-tag-input"
              value={bulkTag}
              onChange={(e) => onBulkTagChange(e.target.value)}
              onFocus={() => onBulkTagOpenChange(true)}
              onBlur={() => setTimeout(() => onBulkTagOpenChange(false), 150)}
              placeholder="+ Tag commun"
            />
            <Button type="submit" className="media-selection-btn" disabled={!bulkTag.trim()}>
              {t("Appliquer")}
            </Button>
          </form>
          {bulkTagOpen && allTags.length > 0 && (
            <div className="media-tag-suggestions">
              {allTags
                .filter((t) => !bulkTag || t.toLowerCase().includes(bulkTag.toLowerCase()))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="media-tag-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      for (const item of visibleSelectedItems) onAddMediaTag(item.path, tag);
                      onBulkTagChange('');
                      onBulkTagOpenChange(false);
                    }}
                  >
                    <span className="me-tag-chip" style={tagStyle(tag)}>{tag}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      ) : null}
      {multiple && <Button className="media-selection-btn" onClick={onClear}>{t("Effacer")}</Button>}
    </div>
  );
}
