import { memo, useState } from 'react';
import { AudioField } from './AudioField';
import { ImageField } from './ImageField';
import { NativeGraphEditor } from './NativeGraphEditor';
import { Toggle } from '../common/Toggle';
import { TextImagePromptModal } from '../TextImageGenerator/TextImagePromptModal';
import { Trash2 } from '../icons/LucideLocal';
import { formatFrenchCount } from '../../utils/frenchText.js';
import { getGeneratedMenuControls } from '../../store/generatedPlayback.js';
import './EditorPanel.css';

import { t } from '../../i18n/index.js';
import { useLocale } from '../../i18n/LocaleContext.jsx';
function MENU_BEHAVIOR_CONTROLS() {
  return [
  {
    key: 'wheel',
    label: t('Molette de sélection'),
    desc: t("L'enfant peut parcourir les histoires de ce dossier avec la molette."),
    def: true,
  },
  {
    key: 'autoplay',
    label: t('Lecture automatique'),
    desc: t("Après l'audio de sélection, enchaîne automatiquement vers le contenu du dossier, sans appui sur OK."),
    def: false,
  },
  {
    key: 'pause',
    label: t('Bouton Pause'),
    desc: t("L'enfant peut mettre en pause l'audio de sélection du dossier."),
    def: false,
  },
];
}

export const MenuEditor = memo(function MenuEditor({ node, project, parentMenu, onUpdate, onDelete }) {
  useLocale();
  const isImportedContinuation = !!node.importedContinuation;
  const nativeGraph = node.nativeGraph ?? null;
  const nativeGraphStageCount = nativeGraph?.stageCount ?? nativeGraph?.document?.stageNodes?.length ?? 0;
  const nativeGraphActionCount = nativeGraph?.actionCount ?? nativeGraph?.document?.actionNodes?.length ?? 0;
  const generatedControls = getGeneratedMenuControls(node, parentMenu, project);
  const hasForcedLinearRootControls = generatedControls.forceAutoplay;
  const [textImgModal, setTextImgModal] = useState(null);

  function handleRegenerate() {
    setTextImgModal({
      defaultText: node.name || '',
      onConfirm: (path) => { onUpdate({ image: path, autoGenerateImage: false }); },
    });
  }

  return (
    <>
      <div className="card">
        <div className="card-title-row">
          <div className="card-title">{t("Dossier")}</div>
          <div className="card-copy card-copy--inline">{t("Page de choix où l'enfant sélectionne une histoire à la molette. Configure ici son nom, son visuel et l'audio d'invitation.")}</div>
        </div>

        <div className="field-row field-row--flush">
          <span className="field-label">{t('Nom')}</span>
          <input
            className="field-input"
            value={node.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t("Nom du dossier")}
          />
          <span className="menu-count">
            {formatFrenchCount(
              node.children?.length ?? node.items?.length ?? 0,
              t('élément'),
              t('éléments'),
            )}
          </span>
        </div>
        <div className="card-sep" />

        {node.importedContinuation && (
          <div className="sequence-note sequence-note--spaced"> {t("Continuation native importée depuis")} {node.importedContinuation.sourceStoryName || t('une histoire')}
            {node.importedContinuation.sourceStepName ? t(" · étape {sourceStepName}", { sourceStepName: node.importedContinuation.sourceStepName }) : ''}.
          </div>
        )}
        {nativeGraph ? (
          <div className="sequence-note sequence-note--spaced"> {t("Graphe interactif natif attaché à ce pack extrait :")} {nativeGraphStageCount} stages, {nativeGraphActionCount} actions.
          </div>
        ) : null}
        {node.autoBlackImage ? (
          <>
            <AudioField
              label={t("Audio de sélection")}
              description={isImportedContinuation ? t("Optionnel pour cette continuation") : t("Invite l'enfant à choisir une histoire")}
              file={node.audio}
              required={!isImportedContinuation}
              ttsTextSuggestion={node.name || ''}
              ttsFilenameHint={`selection-${node.name || 'dossier'}`}
              xttsTarget={{ kind: 'menu', entryId: node.id, field: 'audio' }}
              onPick={(f) => onUpdate({ audio: f })}
              onClear={() => onUpdate({ audio: null })}
            />
          </>
        ) : (
          <div className="media-split">
            <div className="media-split-left">
              <div className="media-col-header">
                {t("Image")}
                <span className="media-col-subtitle">{t('Image de menu (320×240)')}</span>
              </div>
              <ImageField
                fieldId={`${node.id}:image`}
                file={node.image}
                extraActions={[
                  {
                    key: 'generate-text',
                    label: t('Générer une image-titre'),
                    onClick: handleRegenerate,
                    title: t('Créer une image-titre à partir du nom du dossier'),
                  },
                ]}
                onPick={(f) => onUpdate({ image: f, autoGenerateImage: false })}
                onClear={() => onUpdate({ image: null, autoGenerateImage: false })}
              />
            </div>
            <div className="media-split-divider" />
            <div className="media-split-right">
              <div className="media-col-header">
                Son
                <span className="media-col-subtitle">
                  {isImportedContinuation ? t('Audio de sélection — optionnel pour cette continuation') : t("Audio de sélection — invite l'enfant à choisir une histoire")}
                </span>
              </div>
                <AudioField
                  label={t("Audio de sélection")}
                description={isImportedContinuation ? t("Optionnel pour cette continuation") : t("Invite l'enfant à choisir une histoire")}
                file={node.audio}
                required={!isImportedContinuation}
                ttsTextSuggestion={node.name || ''}
                ttsFilenameHint={`selection-${node.name || 'dossier'}`}
                xttsTarget={{ kind: 'menu', entryId: node.id, field: 'audio' }}
                onPick={(f) => onUpdate({ audio: f })}
                onClear={() => onUpdate({ audio: null })}
              />
            </div>
          </div>
        )}
      </div>

      {nativeGraph ? (
        <div className="card">
          <div className="card-title-row">
            <div className="card-title">{t('Graphe interactif importé')}</div>
            <div className="card-copy card-copy--inline">{nativeGraphStageCount} stages · {nativeGraphActionCount} actions</div>
          </div>
          <NativeGraphEditor
            graph={nativeGraph}
            onChange={(nextGraph) => onUpdate({ nativeGraph: nextGraph })}
          />
        </div>
      ) : null}

      <div className="card menu-behavior-card">
        <div className="card-title-row">
          <div className="card-title">{t('Réglages du dossier')}</div>
          <div className="card-copy card-copy--inline"> {t("Règle ce que l'enfant peut faire sur cet écran de choix.")} </div>
        </div>

        {hasForcedLinearRootControls ? (
          <div className="info-box menu-behavior-info"> {t("Tant que ce Dossier reste l’unique élément du Menu racine et ne contient pas plusieurs éléments, le pack généré impose la Lecture automatique et désactive la Molette. Place au moins deux éléments dans ce Dossier, ou ajoute un autre élément au Menu racine, pour modifier ces deux réglages.")} </div>
        ) : null}

        <div className="menu-behavior-stack">
          <label className="sequence-control menu-behavior-control">
          <Toggle
            on={node.autoBlackImage || false}
            onChange={(v) => onUpdate({ autoBlackImage: v })}
            ariaLabel={t("Écran sans image")}
          />
            <div className="menu-behavior-copy">
              <span className="during-play-control-title">{t('Écran transparent')}</span>
              <span className="menu-behavior-desc"> {t("Aucune image ne sera affichée pendant la lecture de l'audio de sélection.")} </span>
            </div>
          </label>
          {MENU_BEHAVIOR_CONTROLS().map(({ key, label, desc, def }) => {
            const isForced = hasForcedLinearRootControls && (key === 'wheel' || key === 'autoplay');
            return (
              <label
                key={key}
                className={`sequence-control menu-behavior-control${isForced ? ' menu-behavior-control--forced' : ''}`}
              >
                <Toggle
                  on={isForced ? generatedControls[key] : (node.controlSettings?.[key] ?? def)}
                  onChange={(v) => onUpdate({ controlSettings: { ...node.controlSettings, [key]: v } })}
                  disabled={isForced}
                  ariaLabel={`${label}${isForced ? t(' — imposé par la structure') : ''}`}
                />
                <div className="menu-behavior-copy">
                  <span className="during-play-control-title">{label}</span>
                  {isForced ? <span className="menu-behavior-state">{t('Imposé')}</span> : null}
                  <span className="menu-behavior-desc">{desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="card card--danger card--danger-compact">
        <div className="card-danger-row">
          <button
            className="card-danger-trash"
            type="button"
            onClick={onDelete}
            aria-label={t("Supprimer ce dossier")}
          >
            <Trash2 className="card-danger-icon" />
          </button>
          <span className="card-danger-title">{t('Supprimer ce dossier')}</span>
          <p className="card-danger-desc">
            {(() => {
              const count = node.children?.length ?? node.items?.length ?? 0;
              return count > 0
                ? (count > 1
                  ? t('Le dossier et les {count} éléments qu’il contient seront retirés du projet. Leurs médias resteront dans la médiathèque.', { count })
                  : t('Le dossier et les {count} élément qu’il contient seront retirés du projet. Leurs médias resteront dans la médiathèque.', { count }))
                : t('Le dossier sera retiré du projet.');
            })()}
          </p>
        </div>
      </div>

      {textImgModal && (
        <TextImagePromptModal
          defaultText={textImgModal.defaultText}
          onConfirm={(path) => { textImgModal.onConfirm(path); setTextImgModal(null); }}
          onCancel={() => setTextImgModal(null)}
        />
      )}
    </>
  );
});
