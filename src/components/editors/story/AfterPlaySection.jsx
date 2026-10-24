import { useEffect, useRef, useState } from 'react';
import { AudioField } from '../AudioField';
import { Toggle } from '../../common/Toggle';
import { Tooltip } from '../../common/Tooltip';
import { Button } from '../../common/Button';
import {
  encodeStoryNavigationTarget,
  decodeNavigationStoryId,
  isCurrentMenuNavigationTarget,
  isNextStoryNavigationTarget,
  isRootNavigationTarget,
  isStoryHomeStepNavigationTarget,
  isStoryNavigationTarget,
  isStoryPlayNavigationTarget,
} from '../../../store/navigationTargets';
import {
  getDefaultPackEntryDestination,
  getEffectiveEndBehavior,
  getPackStartReturnLabel,
} from '../../../store/generatedNavigation';
import {
  CONTROL_DEFS,
  SEQUENCE_CONTROL_DEFAULTS,
  NavigationTargetSelect,
  generatedTargetIdToSelectValue,
  getNavigationSelectHint,
  NAV_ROOT_LABEL,
  normalizeSequenceStep,
} from './storyUtils';
import { EndSequenceEditor } from './EndSequenceEditor';
import { StoryDisclosure } from './StoryDisclosure';
import { ChevronDown, ChevronUp, CircleStop, Pause, Trash2 } from '../../icons/LucideLocal';
import { NodeIcon } from '../../icons/NodeIcon.jsx';
import { hierarchicalNatureOf } from '../../../store/nodeIconVocabulary.js';
import { WORKSPACE_MODE_HIERARCHICAL } from '../../../store/projectWorkState.js';
import { useErrorDialog } from '../../common/Dialog';
import { useProjectActions } from '../../../store/ProjectActionsContext';
import { useProjectContext } from '../../../store/ProjectContext';
import { pickAudio } from '../../../hooks/useFileDialog';
import { basename } from '../../../utils/fileUtils';
import {
  createLocalEndDraft,
  getLocalEndDraftApplicability,
  materializeLocalEndDraftFields,
  selectLocalEndDraftAudio,
} from '../../../store/localEndDraft';

import { t } from '../../../i18n/index.js';
function destinationHintLabel(label) {
  if (!label) return null;
  return String(label)
    .replace(/^Retour vers /, '')
    .replace(/^Lecture de /, '')
    .trim();
}

function RouteChip({ icon = null, children, destination = false }) {
  return (
    <span className={`after-play-route-chip${destination ? ' is-destination' : ''}`}>
      {icon ? <span className="after-play-route-icon">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}

function RouteArrow() {
  return <span className="after-play-route-arrow" aria-hidden="true">→</span>;
}

function RouteTargetIcon({ type, nightMode = false }) {
  // Une cible de navigation est toujours nommee a cote de son dessin. Le repli
  // est le Dossier.
  return (
    <NodeIcon
      workspaceMode={WORKSPACE_MODE_HIERARCHICAL}
      nature={hierarchicalNatureOf(type, { night: nightMode }) ?? 'menu'}
    />
  );
}

function routeTypeFromTarget(target, project) {
  if (!target) return 'menu';
  if (isStoryNavigationTarget(target) || isNextStoryNavigationTarget(target)) return 'story';
  if (isRootNavigationTarget(target)) {
    return getDefaultPackEntryDestination(project)?.type || 'root';
  }
  return 'menu';
}

function routeDestinationFromTarget(targetId, project, allMenus, allStories) {
  if (!targetId) return null;
  if (targetId === 'root') {
    const defaultDest = getDefaultPackEntryDestination(project);
    if (!defaultDest) return { name: NAV_ROOT_LABEL(), type: 'menu' };
    return { name: defaultDest.name, type: defaultDest.type };
  }
  if (isStoryNavigationTarget(targetId)) {
    const storyId = decodeNavigationStoryId(targetId);
    const story = allStories.find((s) => s.id === storyId);
    const prefix = isStoryPlayNavigationTarget(targetId)
      ? t('Lecture directe - ')
      : isStoryHomeStepNavigationTarget(targetId)
        ? t('Retour de fin - ')
        : '';
    return { name: `${prefix}${story?.name ?? 'Histoire'}`, type: 'story' };
  }
  const menu = allMenus.find((m) => m.id === targetId);
  return menu ? { name: menu.name, type: 'menu' } : null;
}

function resolvedReturnSelectValueFromTarget(targetId, project) {
  if (!targetId) return null;
  if (isRootNavigationTarget(targetId)) {
    const defaultDest = getDefaultPackEntryDestination(project);
    if (!defaultDest?.id) return null;
    if (defaultDest.type === 'story') return encodeStoryNavigationTarget(defaultDest.id);
    if (defaultDest.type === 'menu') return generatedTargetIdToSelectValue(defaultDest.id);
    return null;
  }
  return generatedTargetIdToSelectValue(targetId);
}

function getAutoNextContextText(autoNextResolution) {
  if (!autoNextResolution?.enabled) return null;
  if (autoNextResolution.applies) {
    return autoNextResolution.hasNextStory
      ? t("Auto-next est activé dans les options du pack : la sortie automatique lance directement l'histoire suivante.")
      : t("Auto-next est activé dans les options du pack : aucune histoire suivante, la sortie automatique revient au dossier.");
  }
  return null;
}

export function AfterPlaySection({
  node,
  parentMenu,
  allMenus,
  allStories,
  project,
  inheritedReturnLabel,
  onUpdate,
  afterPlayFocus = null,
  onAfterPlayFocusConsumed,
}) {
  const { showConfirmDialog } = useErrorDialog();
  const { onAttachStoryEndToGlobal } = useProjectActions();
  const { onImportFile } = useProjectContext();
  const autoNextEnabled = !!project?.globalOptions?.autoNext;
  const packStartReturnLabel = getPackStartReturnLabel(project);
  const hasEndNode = !!(!autoNextEnabled && (project?.nightModeAudio || project?.globalOptions?.nightMode || project?.globalOptions?.endNode));
  const rawHasPrompt = !!node?.afterPlaybackPromptAudio;
  const hasPrompt = rawHasPrompt && !autoNextEnabled;
  const afterPlaybackSequence = (node.afterPlaybackSequence ?? []).map(normalizeSequenceStep);
  const afterPlaybackHomeStep = node.afterPlaybackHomeStep
    ? normalizeSequenceStep(node.afterPlaybackHomeStep, 0)
    : null;

  const rawHasSequence = afterPlaybackSequence.length > 0;
  const hasSequence = rawHasSequence && !autoNextEnabled;
  const effectiveEndBehavior = node?.type === 'story'
    ? getEffectiveEndBehavior(node, parentMenu, project, project?.rootEntries ?? [])
    : null;
  const storyNavigation = effectiveEndBehavior?.navigation ?? null;
  // Même audio ne suffit pas : une histoire peut réutiliser le son global tout
  // en envoyant vers une autre destination. Le moteur de navigation est la
  // source de vérité pour qualifier un message comme global importé.
  const endMessage = storyNavigation?.endMessage ?? { presentationKind: 'none' };
  const usesGlobalEndNodeAudio = endMessage.presentationKind === 'global';
  const hasGeneratedEndNode = usesGlobalEndNodeAudio;
  const usesStorySpecificEndReturn = hasGeneratedEndNode && !project?.nightModeReturn;
  const autoNextResolution = effectiveEndBehavior?.autoNext ?? null;
  const autoNextApplies = !!autoNextResolution?.applies;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSequenceEditor, setShowSequenceEditor] = useState(false);
  const [showPromptField, setShowPromptField] = useState(false);
  const [localDraft, setLocalDraft] = useState(null);
  const afterPlayRef = useRef(null);
  const focusRequestId = afterPlayFocus?.requestId;

  useEffect(() => {
    if (!focusRequestId || afterPlayFocus?.storyId !== node.id) return;
    setShowAdvanced(true);
    setShowSequenceEditor(hasSequence);
    setShowPromptField(hasPrompt);
    requestAnimationFrame(() => {
      afterPlayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    onAfterPlayFocusConsumed?.();
  }, [afterPlayFocus?.storyId, focusRequestId, hasPrompt, hasSequence, node.id, onAfterPlayFocusConsumed]);

  const promptControls = node.afterPlaybackPromptControlSettings ?? {};
  const storyControls = node.controlSettings ?? {};
  const autoContinuationEnabled = !!effectiveEndBehavior?.autoContinuation;
  const routeFinalTargetId = effectiveEndBehavior?.finalTargetId ?? null;
  const routeFinalDestination = routeDestinationFromTarget(routeFinalTargetId, project, allMenus, allStories);
  const returnIsVirtualTarget = isRootNavigationTarget(node.returnAfterPlay)
    || isCurrentMenuNavigationTarget(node.returnAfterPlay);
  // On résout l'affichage vers la destination réelle dans deux cas : le retour par
  // défaut d'une histoire racine (elle atterrit sur sa propre vignette) et tout retour
  // « virtuel » (racine / dossier courant) qui n'a pas de ligne dédiée dans la liste.
  const resolvedReturnTargetId = ((!node.returnAfterPlay && !parentMenu) || returnIsVirtualTarget)
    ? (storyNavigation?.directReturn?.targetId ?? null)
    : null;
  const resolvedReturnDestination = resolvedReturnTargetId
    ? routeDestinationFromTarget(resolvedReturnTargetId, project, allMenus, allStories)
    : null;
  const resolvedReturnValue = resolvedReturnTargetId
    ? resolvedReturnSelectValueFromTarget(resolvedReturnTargetId, project)
    : null;
  const autoNextDestinationLabel = autoNextApplies
    ? (routeFinalDestination?.name || (autoNextResolution?.isLastStory ? (parentMenu?.name || t('ce dossier')) : t("l'histoire suivante")))
    : null;
  const returnEmptyResolvedLabel = autoNextApplies
    ? `Auto-next : ${autoNextDestinationLabel}`
    : inheritedReturnLabel;
  const returnDestinationHint = getNavigationSelectHint({
    value: node.returnAfterPlay,
    emptyResolvedLabel: returnEmptyResolvedLabel,
    entry: node,
    parentMenu,
    project,
  });
  const promptHomeSelectValue = node.afterPlaybackPromptHomeNone
    ? '__none__'
    : (node.afterPlaybackPromptHomeTarget ?? '');
  const promptAudioLabel = usesGlobalEndNodeAudio
    ? t('Audio du message de fin')
    : hasEndNode
      ? t('Audio de remplacement')
      : t('Audio de fin');
  const promptAudioDescription = usesGlobalEndNodeAudio
    ? t("Cette histoire utilise l'audio commun défini dans le message de fin du pack.")
    : hasEndNode
      ? t("Joué à la place du message de fin pour cette histoire")
      : autoNextApplies
        ? t("Joué à la fin de l'histoire, avant la destination auto-next")
        : t("Joué à la fin de l'histoire");
  const addPromptTooltip = hasEndNode
    ? t("Pour cette histoire uniquement : un seul audio joué à la fin, à la place du message de fin du pack.")
    : t("Un seul audio joué à la fin (ex : « Bravo, l'histoire est finie ! »)");
  const addSequenceTooltip = hasEndNode
    ? t("Pour cette histoire uniquement : plusieurs étapes audio enchaînées à la place du message de fin du pack.")
    : t('Plusieurs étapes audio enchaînées (ex : question → réponse → conclusion)');
  const advancedTitle = hasEndNode
    ? t('Message de fin personnalisé')
    : t('Réglages avancés');
  const advancedDescription = hasEndNode
      ? t('Par défaut, cette histoire utilise le message de fin du pack.')
      : t('Options rarement nécessaires pour personnaliser la fin de cette histoire.');
  const localDraftApplicability = localDraft
    ? getLocalEndDraftApplicability({
      draft: localDraft,
      entry: node,
      parentMenu,
      project,
    })
    : null;

  useEffect(() => {
    setShowSequenceEditor(false);
    setShowPromptField(false);
    setLocalDraft(null);
    setShowAdvanced(false);
  }, [node?.id]);

  async function clearEndAfterPlayback() {
    if (rawHasPrompt || rawHasSequence) {
      const confirmed = await showConfirmDialog({
        title: t("Confirmer la suppression"),
        message: t('Supprimer le message de fin de cette histoire ?'),
        okLabel: t('Supprimer'),
        okKind: 'danger',
      });
      if (!confirmed) return;
    }
    onUpdate({
      afterPlaybackPromptAudio: null,
      afterPlaybackPromptOkTarget: null,
      afterPlaybackPromptHomeTarget: null,
      afterPlaybackPromptHomeNone: false,
      afterPlaybackSequence: [],
      afterPlaybackHomeStep: null,
    });
    setShowSequenceEditor(false);
    setShowPromptField(false);
  }

  function startSequence() {
    const firstStep = normalizeSequenceStep({
      name: t('Étape 1'),
      controlSettings: { ...SEQUENCE_CONTROL_DEFAULTS, autoplay: true, ok: true },
    }, 0);
    onUpdate({
      afterPlaybackSequence: [firstStep],
      afterPlaybackPromptAudio: null,
      afterPlaybackPromptOkTarget: null,
      afterPlaybackPromptHomeTarget: null,
      afterPlaybackPromptHomeNone: false,
    });
    setShowSequenceEditor(true);
    setShowPromptField(false);
  }

  function startLocalDraft() {
    setLocalDraft(createLocalEndDraft(project));
  }

  async function pickLocalDraftAudio() {
    const source = await pickAudio();
    if (!source) return;
    setLocalDraft((draft) => selectLocalEndDraftAudio(draft, source));
  }

  async function applyLocalDraft() {
    if (!localDraft || !localDraftApplicability?.applicable) return;
    const fields = await materializeLocalEndDraftFields({
      draft: localDraft,
      entry: node,
      parentMenu,
      project,
      importFile: onImportFile,
    });
    if (!fields) return;
    onUpdate(fields);
    setLocalDraft(null);
  }

  function updateAutoContinuation(enabled) {
    onUpdate({
      controlSettings: {
        ...storyControls,
        autoplay: enabled,
        ok: !enabled,
      },
      ...(enabled ? {} : { returnAfterPlay: null }),
    });
  }

  const playbackEndMode = autoContinuationEnabled ? 'auto' : 'stay';
  const returnDestinationLabel = routeFinalDestination?.name
    || destinationHintLabel(returnDestinationHint)
    || inheritedReturnLabel
    || 'la destination choisie';
  const returnDestinationType = routeFinalDestination?.type || routeTypeFromTarget(node.returnAfterPlay, project);
  const nightModeActive = !!project?.globalOptions?.nightMode;
  const routeUsesEndStep = !!effectiveEndBehavior?.usesEndStep;
  const routeFinalLabel = routeFinalDestination?.name || returnDestinationLabel;
  const routeFinalType = routeFinalDestination?.type || returnDestinationType;
  const routeEndStepLabel = hasSequence
    ? t('Scénario de fin')
    : hasPrompt && !usesGlobalEndNodeAudio
      ? t('Message de fin personnalisé')
      : `${project?.endNodeName || 'Message de fin'}${nightModeActive ? ' (mode nuit)' : ''}`;
  const routeContextText = autoNextApplies
    ? t('Auto-next activé')
    : usesStorySpecificEndReturn
      ? t('Destination réglée dans cette histoire')
      : null;
  const showEndModeControls = !hasGeneratedEndNode && !autoNextApplies;
  const showReturnDestinationRow = !autoNextApplies && (
    usesStorySpecificEndReturn
    || (!hasGeneratedEndNode && autoContinuationEnabled)
  );
  const autoNextContextText = getAutoNextContextText(autoNextResolution);
  const afterPlayNotes = [
    autoNextContextText,
    autoNextApplies
      ? t('Les retours personnalisés, le message de fin et les scénarios de fin restent dans le projet, mais auto-next prend la main.')
      : null,
  ].filter(Boolean);
  const showAfterPlayIntro = afterPlayNotes.length > 0;
  const showAdvancedControls = !autoNextApplies;

  // ─── Contenu "Message de fin" ────────────────────────────────────────────────

  let endContent;
  if (endMessage.presentationKind === 'global') {
    endContent = localDraft ? (
      <div className="end-simple-settings">
        <div className="sequence-note sequence-note--spaced">{t('Brouillon de fin locale — il ne modifie pas encore cette histoire.')}</div>
        <div className="field-row end-local-audio-row">
          <div style={{ flex: 1 }}>
            <span className="field-label">{t('Audio de la fin locale')}</span>
            <div className="after-play-muted">{localDraft.audio ? basename(localDraft.audio) : t('Aucun audio choisi')}</div>
          </div>
          <Button size="sm" onClick={() => void pickLocalDraftAudio()}>{t('Choisir un audio')}</Button>
          {localDraft.audio ? <Button size="sm" onClick={() => setLocalDraft((draft) => ({ ...draft, audio: null, audioSource: null }))}>{t('Retirer')}</Button> : null}
        </div>
        <div className="sequence-targets">
          <div className="field-row field-row--flush">
            <span className="field-label">Bouton OK</span>
            <NavigationTargetSelect
              value={localDraft.okTarget ?? ''}
              onChange={(okTarget) => setLocalDraft((draft) => ({ ...draft, okTarget: okTarget || null }))}
              allMenus={allMenus}
              allStories={allStories}
              currentStoryId={node.id}
              emptyLabel={t("Comme à la fin de l'histoire")}
            />
          </div>
          <div className="field-row field-row--flush">
            <span className="field-label">{t('Bouton Accueil')}</span>
            <NavigationTargetSelect
              value={localDraft.homeNone ? '__none__' : (localDraft.homeTarget ?? '')}
              onChange={(value) => setLocalDraft((draft) => value === '__none__'
                ? { ...draft, homeNone: true, homeTarget: null }
                : { ...draft, homeNone: false, homeTarget: value || null })}
              allMenus={allMenus}
              allStories={allStories}
              currentStoryId={node.id}
              includeNone
              noneLabel={packStartReturnLabel}
              includeStoryPlay={false}
              emptyLabel={t("Identique au bouton OK")}
            />
          </div>
        </div>
        {!localDraftApplicability?.applicable ? (
          <div className="after-play-muted" role="status"> {t("Choisissez un audio ou une destination différente de la fin globale.")} </div>
        ) : null}
        <div className="end-actions-end">
          <Button size="sm" onClick={() => setLocalDraft(null)}>{t('Annuler')}</Button>
          <Button
            size="sm"
            onClick={applyLocalDraft}
            disabled={!localDraftApplicability?.applicable}
          >
            {t("Appliquer la fin locale")}
          </Button>
        </div>
      </div>
    ) : (
      <div className="end-add-actions">
        <Tooltip text={addPromptTooltip} placement="above">
          <Button size="sm" onClick={startLocalDraft}>
            {t("Ajouter un audio de fin")}
          </Button>
        </Tooltip>
        <Tooltip text={addSequenceTooltip} placement="above">
          <Button size="sm" onClick={startSequence}> {t("Ajouter un scénario de fin")} </Button>
        </Tooltip>
      </div>
    );
  } else if (hasSequence) {
    endContent = (
      <>
        <div className="end-summary">
          <div>
            <div className="end-summary-title">
              <span>{t('Scénario de fin')}</span>
              <span className="end-summary-badge">
                {afterPlaybackSequence.length > 1
                  ? t('{count} étapes', { count: afterPlaybackSequence.length })
                  : t('{count} étape', { count: afterPlaybackSequence.length })}
              </span>
            </div>
            <div className="end-summary-copy"> {t("Séquence jouée après la fin de l'histoire, avant la destination suivante.")} </div>
          </div>
          <div className="end-summary-actions">
            {hasEndNode && (
              <Button size="sm" onClick={() => onAttachStoryEndToGlobal?.(node.id)}>
                {t("Rattacher au message du pack")}
              </Button>
            )}
            <Tooltip text={showSequenceEditor ? t('Masquer le scénario') : t('Afficher le scénario')}>
              <button
                type="button"
                className="sequence-summary-icon-btn"
                onClick={() => setShowSequenceEditor((v) => !v)}
                aria-label={showSequenceEditor ? t('Masquer le scénario') : t('Afficher le scénario')}
              >
                {showSequenceEditor
                  ? <ChevronUp className="sequence-icon" />
                  : <ChevronDown className="sequence-icon" />}
              </button>
            </Tooltip>
            <Tooltip text={t("Retirer le scénario de fin")}>
              <button
                type="button"
                className="story-prompt-trash"
                onClick={clearEndAfterPlayback}
                aria-label={t("Retirer le scénario de fin")}
              >
                <Trash2 className="card-danger-icon" />
              </button>
            </Tooltip>
          </div>
        </div>
        {showSequenceEditor && (
          <EndSequenceEditor
            node={node}
            parentMenuId={parentMenu?.id ?? null}
            steps={afterPlaybackSequence}
            homeStep={afterPlaybackHomeStep}
            allMenus={allMenus}
            allStories={allStories}
            packStartReturnLabel={packStartReturnLabel}
            onUpdate={onUpdate}
          />
        )}
      </>
    );
  } else if (hasPrompt || showPromptField) {
    endContent = (
      <>
        <div className="end-field-head">
          <span className="field-label">
            Message audio de fin
          </span>
          <Tooltip text={t("Retirer le message audio de fin")}>
            <button
              type="button"
              className="story-prompt-trash"
              onClick={clearEndAfterPlayback}
              aria-label={t("Retirer le message audio de fin")}
            >
              <Trash2 className="card-danger-icon" />
            </button>
          </Tooltip>
        </div>
        {hasEndNode && !usesGlobalEndNodeAudio && (
          <div className="sequence-note sequence-note--spaced">
            {t("Cette histoire jouera ce message")} <strong>{t('à la place')}</strong> {t("du message de fin du pack.")}
          </div>
        )}
        <AudioField
          label={promptAudioLabel}
          description={promptAudioDescription}
          file={node.afterPlaybackPromptAudio}
          required={false}
          ttsFilenameHint={`fin-${node.name || 'histoire'}`}
          xttsTarget={{ kind: 'story', entryId: node.id, field: 'afterPlaybackPromptAudio' }}
          onPick={(f) => onUpdate({ afterPlaybackPromptAudio: f })}
          onClear={() => onUpdate({
            afterPlaybackPromptAudio: null,
            afterPlaybackPromptOkTarget: null,
            afterPlaybackPromptHomeTarget: null,
            afterPlaybackPromptHomeNone: false,
          })}
        />
        {hasPrompt && (
          <div className="end-simple-settings">
            {hasEndNode && (
              <div className="sequence-note sequence-note--spaced"> {t("Cette histoire utilise une fin locale à la place du message du pack.")} </div>
            )}
            <div className="sequence-controls">
              {CONTROL_DEFS().map(({ key, label, def }) => (
                <label key={key} className="sequence-control">
                  <span>{label}</span>
                  <Toggle
                    on={promptControls?.[key] ?? def}
                    onChange={(v) => onUpdate({
                      afterPlaybackPromptControlSettings: {
                        autoplay: promptControls.autoplay ?? true,
                        ok: promptControls.ok ?? true,
                        home: promptControls.home ?? true,
                        pause: promptControls.pause ?? false,
                        wheel: promptControls.wheel ?? false,
                        [key]: v,
                      },
                    })}
                  />
                </label>
              ))}
            </div>
            <div className="sequence-targets">
              <div className="field-row field-row--flush">
                <div style={{ flex: 1 }}>
                  <span className="field-label">Bouton OK</span>
                </div>
                <NavigationTargetSelect
                  value={node.afterPlaybackPromptOkTarget ?? ''}
                  onChange={(value) => onUpdate({ afterPlaybackPromptOkTarget: value })}
                  allMenus={allMenus}
                  allStories={allStories}
                  currentStoryId={node.id}
                  emptyLabel={t("Comme à la fin de l'histoire")}
                />
              </div>
              <div className="field-row field-row--flush">
                <div style={{ flex: 1 }}>
                  <span className="field-label">{t('Bouton Accueil')}</span>
                </div>
                <NavigationTargetSelect
                  value={promptHomeSelectValue}
                  onChange={(value) => {
                    if (value === '__none__') {
                      onUpdate({ afterPlaybackPromptHomeNone: true, afterPlaybackPromptHomeTarget: null });
                    } else {
                      onUpdate({ afterPlaybackPromptHomeNone: false, afterPlaybackPromptHomeTarget: value });
                    }
                  }}
                  allMenus={allMenus}
                  allStories={allStories}
                  currentStoryId={node.id}
                  includeNone
                  noneLabel={packStartReturnLabel}
                  emptyLabel={t("Identique au bouton OK")}
                  includeStoryPlay={false}
                />
              </div>
            </div>
            <div className="end-actions-end">
              {hasEndNode && (
                <Button size="sm" onClick={() => onAttachStoryEndToGlobal?.(node.id)}>
                  {t("Rattacher au message du pack")}
                </Button>
              )}
              <Button size="sm" onClick={startSequence}> {t("Convertir en scénario de fin")} </Button>
            </div>
          </div>
        )}
      </>
    );
  } else {
    endContent = (
      <div className="end-add-actions">
        <Tooltip text={addPromptTooltip} placement="above">
          <Button size="sm" onClick={() => setShowPromptField(true)}>
            {t("Ajouter un audio de fin")}
          </Button>
        </Tooltip>
        <Tooltip text={addSequenceTooltip} placement="above">
          <Button size="sm" onClick={startSequence}> {t("Ajouter un scénario de fin")} </Button>
        </Tooltip>
      </div>
    );
  }

  // ─── Rendu principal ────────────────────────────────────────────────────────

  return (
    <div className="card">
      <div className="card-title-row">
        <div className="card-title">{t('Après la lecture')}</div>
        <div className="card-copy card-copy--inline">
          {t("Que se passe-t-il quand cette histoire se termine.")}
        </div>
      </div>

      {(showAfterPlayIntro || showEndModeControls) ? (
        <div className="after-play-main-row">
          {showAfterPlayIntro ? (
            <div className="after-play-intro">
              {afterPlayNotes.map((note) => (
                <div key={note} className="after-play-context-note">{note}</div>
              ))}
            </div>
          ) : null}

          {showEndModeControls && (
            <div className="after-play-end-row">
              <span className="after-play-end-label">{t('À la fin')}</span>
              <div className="story-end-mode" role="group" aria-label={t("Comportement à la fin de l'histoire")}>
                <button
                  type="button"
                  className={`story-end-mode-btn ${playbackEndMode === 'stay' ? 'is-active' : ''}`}
                  aria-pressed={playbackEndMode === 'stay'}
                  onClick={() => updateAutoContinuation(false)}
                > {t("Rester sur l'écran")} </button>
                <button
                  type="button"
                  className={`story-end-mode-btn ${playbackEndMode === 'auto' ? 'is-active' : ''}`}
                  aria-pressed={playbackEndMode === 'auto'}
                  onClick={() => updateAutoContinuation(true)}
                > {t("Enchaîner")} </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {showReturnDestinationRow && (
        <div className="after-play-destination-row">
          <div className="after-play-destination-copy">
            <span className="field-label">
              {usesStorySpecificEndReturn
                ? t('Destination après le message de fin')
                : autoNextApplies
                  ? t('Exception à auto-next')
                  : t("Destination après l'histoire")}
            </span>
            <div className="after-play-muted">
              {usesStorySpecificEndReturn
                ? t('Utilisée lorsque le retour du message de fin est réglé sur « Selon chaque histoire ». Une valeur vide suit le dossier ou le comportement par défaut.')
                : autoNextApplies
                ? t('Laisser vide pour suivre le comportement auto-next global.')
                : t("L'écran ou le menu affiché à la sortie automatique.")}
            </div>
          </div>
          <div className="after-play-destination-select">
            <NavigationTargetSelect
              value={node.returnAfterPlay ?? ''}
              onChange={(target) => onUpdate({ returnAfterPlay: target || null })}
              allMenus={allMenus}
              allStories={allStories}
              currentStoryId={node.id}
              allowCurrentStory={!parentMenu}
              emptyLabel={autoNextApplies ? 'Suit auto-next global' : (inheritedReturnLabel || resolvedReturnDestination?.name || t('Choisir une destination'))}
              resolvedDefaultValue={resolvedReturnValue}
              resolvedDefaultLabel={resolvedReturnDestination?.name}
              resolvedDefaultKind={resolvedReturnDestination?.type}
              hideDefaultWhenResolved
            />
          </div>
        </div>
      )}

      <div className="after-play-route" ref={afterPlayRef}>
        <div className="after-play-route-head">
          <div className="after-play-route-title">{t('Résumé du parcours')}</div>
          {routeContextText ? (
            <div className="after-play-route-context">{routeContextText}</div>
          ) : null}
        </div>
        <div className="after-play-route-list">
          <RouteChip icon={<CircleStop />}>{t('Histoire terminée')}</RouteChip>
          <RouteArrow />
          {routeUsesEndStep ? (
            <>
              <RouteChip icon={<RouteTargetIcon type="end-node" nightMode={nightModeActive} />}>
                {routeEndStepLabel}
              </RouteChip>
              {routeFinalLabel ? (
                <>
                  <RouteArrow />
                  <RouteChip icon={<RouteTargetIcon type={routeFinalType} />} destination>{routeFinalLabel}</RouteChip>
                </>
              ) : null}
            </>
          ) : autoContinuationEnabled ? (
            <RouteChip icon={<RouteTargetIcon type={returnDestinationType} />} destination>{returnDestinationLabel}</RouteChip>
          ) : (
            <RouteChip icon={<Pause />}>{t("Attente sur l'écran")}</RouteChip>
          )}
        </div>
      </div>

      {showAdvancedControls ? (
        <StoryDisclosure
          open={showAdvanced}
          onToggle={() => setShowAdvanced((v) => !v)}
        >
          <div className="story-advanced-row">
            <div className="story-advanced-copy">
              <div className="story-advanced-title">{advancedTitle}</div>
              <div className="story-advanced-desc">{advancedDescription}</div>
            </div>
          </div>

          {showAdvanced && (
            <div className="story-advanced-controls">
              <div>
                {endContent}
              </div>
            </div>
          )}
        </StoryDisclosure>
      ) : null}
    </div>
  );
}
