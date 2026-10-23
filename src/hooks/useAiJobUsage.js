import { useCallback } from 'react';
import { pathKey } from '../utils/fileUtils';
import { advancedMediaUsageForPaths } from '../store/advancedAuthoring/mediaUsage';
import { isAdvancedProject } from '../store/projectWorkState';

import { t } from '../i18n/index.js';
const samePath = (a, b) => pathKey(a) === pathKey(b);

// La réponse d'un projet graphe, pour l'audio comme pour l'image. Trois issues,
// et la troisième est la raison d'être de cette branche : sans elle, un projet
// graphe recevait « Non utilisé » — une affirmation — là où l'arbre parcouru
// était simplement vide. Un auteur supprime un fichier sur cette phrase.
function advancedJobUsage(project, advancedUsages, paths, words) {
  const found = advancedMediaUsageForPaths(project, advancedUsages, paths, samePath);
  if (!found) return { state: 'unused', label: words.unused, detail: words.noBinding };
  if (!found.bound) return { state: 'unused', label: words.unused, detail: words.noBinding };
  if (!found.known) {
    return {
      state: 'unknown',
      label: t('Usage non calculé'),
      detail: t('Le fichier est lié au document. Les écrans qui l’emploient ne sont pas encore connus : ouvre l’éditeur du projet pour les établir.'),
    };
  }
  if (found.usages.length === 0) {
    return { state: 'unused', label: words.unused, detail: words.boundUnreferenced };
  }
  const detail = found.usages
    .map((usage) => `Écran : ${usage.label} · Champ : ${usage.field === 'image' ? 'image' : 'audio'}`)
    .join(' ; ');
  return {
    state: 'used',
    label: found.usages.length === 1 ? words.used : `${words.used} ×${found.usages.length}`,
    detail,
  };
}

const AUDIO_FIELD_LABELS = {
  rootAudio: t('audio d’accueil'),
  nightModeAudio: t('audio de fin'),
  itemAudio: t('audio de sélection'),
  audio: t('audio de lecture'),
  afterPlaybackPromptAudio: t('audio après lecture'),
  afterPlaybackSequence: t('audio de fin intermédiaire'),
  afterPlaybackHomeStep: t('audio Home pendant lecture'),
  coverAudio: t('audio de couverture'),
};

function audioFieldLabel(field) {
  return AUDIO_FIELD_LABELS[field] || t('champ audio');
}

export function useAiJobUsage({ project, projectIndex, advancedMediaUsages = null }) {
  const getAudioJobUsage = useCallback((job) => {
    if (!job || job.kind !== 'audio' || job.status !== 'done' || !job.resultPath) return null;
    if (isAdvancedProject(project)) {
      return advancedJobUsage(project, advancedMediaUsages, [job.resultPath], {
        used: t('Utilisé'),
        unused: t('Non utilisé'),
        noBinding: t('Aucune liaison du document ne pointe vers ce fichier.'),
        boundUnreferenced: t('Le fichier est lié au document, mais aucun écran ne l’emploie.'),
      });
    }
    const resultPath = pathKey(job.resultPath);
    const usages = [];

    function addUsage(path, nodeName, field) {
      if (path && pathKey(path) === resultPath) {
        usages.push(`Nœud : ${nodeName} · Champ : ${audioFieldLabel(field)}`);
      }
    }

    addUsage(project?.rootAudio, project?.name || 'Accueil', 'rootAudio');
    addUsage(project?.nightModeAudio, 'Fin', 'nightModeAudio');

    for (const flatEntry of projectIndex.flatEntries ?? []) {
      const entry = flatEntry.entry ?? flatEntry;
      const nodeName = entry.name || (entry.type === 'menu' ? t('Menu sans titre') : entry.type === 'zip' ? t('ZIP sans titre') : t('Histoire sans titre'));
      if (entry.type === 'menu') {
        addUsage(entry.audio, nodeName, 'audio');
      } else if (entry.type === 'story') {
        addUsage(entry.itemAudio, nodeName, 'itemAudio');
        addUsage(entry.audio, nodeName, 'audio');
        addUsage(entry.afterPlaybackPromptAudio, nodeName, 'afterPlaybackPromptAudio');
        for (const step of entry.afterPlaybackSequence ?? []) {
          addUsage(step.audio, nodeName, 'afterPlaybackSequence');
        }
        addUsage(entry.afterPlaybackHomeStep?.audio, nodeName, 'afterPlaybackHomeStep');
      } else if (entry.type === 'zip') {
        addUsage(entry.coverAudio, nodeName, 'coverAudio');
      }
    }

    if (usages.length > 0) {
      return {
        state: 'used',
        label: usages.length === 1 ? t('Utilisé') : `Utilisé ×${usages.length}`,
        detail: usages.join(' ; '),
      };
    }

    const target = job.target;
    let currentPath = null;
    let targetExists = true;
    let nodeName = null;
    let fieldLabel = audioFieldLabel(target?.field);

    switch (target?.kind) {
      case 'root':
        currentPath = project?.[target.field] ?? null;
        nodeName = project?.name || 'Accueil';
        break;
      case 'rootStory':
        currentPath = project?.rootEntries?.[0]?.[target.field] ?? null;
        nodeName = project?.rootEntries?.[0]?.name || t('Histoire principale');
        break;
      case 'menu': {
        const entry = projectIndex.entryById.get(target.entryId);
        targetExists = !!entry;
        currentPath = entry?.[target.field] ?? null;
        nodeName = entry?.name || t('Menu sans titre');
        break;
      }
      case 'story': {
        const entry = projectIndex.entryById.get(target.entryId);
        targetExists = !!entry;
        currentPath = entry?.[target.field] ?? null;
        nodeName = entry?.name || t('Histoire sans titre');
        break;
      }
      case 'storySequence': {
        const entry = projectIndex.entryById.get(target.entryId);
        const step = entry?.afterPlaybackSequence?.find((item) => item.id === target.stepId);
        targetExists = !!entry && !!step;
        currentPath = step?.[target.field] ?? null;
        nodeName = `${entry?.name || t('Histoire sans titre')} · ${step?.name || 'Sequence de fin'}`;
        fieldLabel = audioFieldLabel('afterPlaybackSequence');
        break;
      }
      case 'storyHomeStep': {
        const entry = projectIndex.entryById.get(target.entryId);
        targetExists = !!entry && !!entry.afterPlaybackHomeStep;
        currentPath = entry?.afterPlaybackHomeStep?.[target.field] ?? null;
        nodeName = `${entry?.name || t('Histoire sans titre')} · Home pendant lecture`;
        fieldLabel = audioFieldLabel('afterPlaybackHomeStep');
        break;
      }
      default:
        targetExists = false;
        break;
    }

    if (!targetExists) {
      return { state: 'unused', label: t('Non utilisé'), detail: `${fieldLabel} n’existe plus` };
    }
    if (pathKey(currentPath) === resultPath) {
      return { state: 'used', label: t('Utilisé'), detail: `Nœud : ${nodeName} · Champ : ${fieldLabel}` };
    }
    return { state: 'unused', label: t('Non utilisé'), detail: `Nœud : ${nodeName} · Champ modifié : ${fieldLabel}` };
  }, [project, projectIndex, advancedMediaUsages]);

  const getImageJobUsage = useCallback((job) => {
    if (!job || job.kind === 'audio' || job.status !== 'done' || !job.resultPaths?.length) return null;
    if (isAdvancedProject(project)) {
      return advancedJobUsage(project, advancedMediaUsages, job.resultPaths, {
        used: t('Utilisée'),
        unused: t('Non utilisée'),
        noBinding: t('Aucune liaison du document ne pointe vers ces fichiers.'),
        boundUnreferenced: t('Le fichier est lié au document, mais aucun écran ne l’emploie.'),
      });
    }
    const resultSet = new Set(job.resultPaths.map(pathKey));
    const usages = [];

    function addUsage(path, nodeName, fieldLabel) {
      if (path && resultSet.has(pathKey(path))) {
        usages.push(`${nodeName} · ${fieldLabel}`);
      }
    }

    const rootLabel = project?.projectName || project?.packMetadata?.title || 'Accueil';
    addUsage(project?.rootImage, rootLabel, t('image d’accueil'));
    addUsage(project?.thumbnailImage, rootLabel, 'vignette');

    for (const flatEntry of projectIndex.flatEntries ?? []) {
      const entry = flatEntry.entry ?? flatEntry;
      const nodeName = entry.name || (entry.type === 'menu' ? t('Menu sans titre') : t('Histoire sans titre'));
      addUsage(entry.image, nodeName, entry.type === 'menu' ? t('image du menu') : t('image de l’histoire'));
      addUsage(entry.itemImage, nodeName, t('image de sélection'));
      addUsage(entry.coverImage, nodeName, 'couverture');
    }

    if (usages.length > 0) {
      return {
        state: 'used',
        label: usages.length === 1 ? t('Utilisée') : `Utilisées ×${usages.length}`,
        detail: usages.join(' ; '),
      };
    }
    return { state: 'unused', label: t('Non utilisée'), detail: t('Aucune image de cette génération n’est assignée au projet.') };
  }, [project, projectIndex, advancedMediaUsages]);

  return { getAudioJobUsage, getImageJobUsage };
}
