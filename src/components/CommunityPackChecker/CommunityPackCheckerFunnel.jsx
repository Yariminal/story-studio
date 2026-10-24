import { useMemo, useState } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import {
  FunnelDoneState,
  FunnelDropZone,
  FunnelFooter,
  FunnelGenerationState,
  FunnelSectionHeader,
  FunnelShell,
  FunnelStepper,
  FunnelToolButton,
} from '../funnels';
import { CommunityPackMetadataModal } from './CommunityPackMetadataModal';
import {
  FixableCorrectionsList,
  ProcessLog,
  ReportView,
  TechnicalLog,
  titleNeedsCorrection,
} from './CommunityPackChecker';
import { useCommunityPackChecker } from './useCommunityPackChecker';
import { Download, FolderOpen, House, Package, TriangleAlert, Wrench } from '../icons/LucideLocal';
import { getLastExportDir, saveLastExportDir } from '../../hooks/useFileDialog';
import { basename } from '../../utils/fileUtils';
import {
  optionalSilenceSelectionKey,
  packCorrectionCounts,
  serializeOptionalSilenceSelection,
} from './packCheckerIssueClassification';
import './CommunityPackChecker.css';
import './CommunityPackCheckerFunnel.css';

import { t } from '../../i18n/index.js';
const STEPS = [
  { key: 'pack', label: 'Pack' },
  { key: 'report', label: 'Rapport' },
  { key: 'output', label: 'Correction' },
];

function latestLine(lines) {
  return lines?.length ? lines[lines.length - 1] : '';
}

function correctionCount(result) {
  if (!result) return '';
  const parts = [];
  if (result.audioFixed) parts.push(`${result.audioFixed} audio`);
  if (result.imageFixed) parts.push(result.imageFixed > 1
    ? t('{count} images', { count: result.imageFixed })
    : t('{count} image', { count: result.imageFixed }));
  if (result.metadataFixed) parts.push(t('métadonnées'));
  return parts.length ? parts.join(' · ') : t('Pack corrigé');
}

export function CommunityPackCheckerFunnel({ onClose }) {
  const checker = useCommunityPackChecker();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('collect');
  const [outputDir, setOutputDir] = useState(() => getLastExportDir() || '');
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [localError, setLocalError] = useState('');
  const [selectedOptionalSilences, setSelectedOptionalSilences] = useState(() => new Set());

  const busy = phase === 'analyzing' || phase === 'fixing' || checker.status === 'analyzing' || checker.status === 'fixing';
  const correctionCounts = useMemo(() => packCorrectionCounts(checker.report), [checker.report]);
  const canCreateFixedPack = useMemo(() => (
    (correctionCounts.automatic > 0 || titleNeedsCorrection(checker.report) || selectedOptionalSilences.size > 0)
    && !busy
  ), [checker.report, correctionCounts.automatic, selectedOptionalSilences, busy]);
  const canOpenReport = !!checker.report;
  const canOpenCorrection = canOpenReport && (canCreateFixedPack || correctionCounts.optional > 0);
  const error = localError || checker.error;

  async function analyzePath(path) {
    const selected = String(path || '').trim();
    if (!selected) return;
    setLocalError('');
    setResult(null);
    setSelectedOptionalSilences(new Set());
    setPhase('analyzing');
    const report = await checker.analyzePath(selected);
    setPhase('collect');
    if (report) setStep(1);
  }

  async function pickPack() {
    const selected = await openDialog({
      multiple: false,
      title: t('Pack à vérifier'),
      filters: [{ name: t('Pack Lunii'), extensions: ['zip', '7z'] }],
    });
    if (selected) await analyzePath(Array.isArray(selected) ? selected[0] : selected);
  }

  async function chooseOutputDir() {
    const selected = await openDialog({
      directory: true,
      multiple: false,
      title: t('Dossier du pack corrigé'),
      defaultPath: outputDir || getLastExportDir() || undefined,
    });
    const nextOutputDir = Array.isArray(selected) ? selected[0] : selected;
    if (!nextOutputDir) return null;
    setOutputDir(nextOutputDir);
    saveLastExportDir(nextOutputDir);
    return nextOutputDir;
  }

  async function fixPack(metadataPatch = null) {
    setMetadataOpen(false);
    setLocalError('');
    const selectedOutputDir = await chooseOutputDir();
    if (!selectedOutputDir) {
      return;
    }
    setPhase('fixing');
    const fixed = await checker.fixPack(metadataPatch, {
      outputDir: selectedOutputDir,
      correctionSelection: {
        optionalAudioSilences: serializeOptionalSilenceSelection(
          checker.report,
          selectedOptionalSilences,
        ),
      },
    });
    setPhase(fixed ? 'done' : 'collect');
    if (fixed) setResult(fixed);
  }

  function handlePrimary() {
    if (step === 0) {
      // CTA actif seulement quand un pack est déjà choisi (zone de dépôt ou
      // bouton « Choisir un pack ») : le footer ne duplique plus le picker.
      if (checker.zipPath) void analyzePath(checker.zipPath);
      return;
    }
    if (step === 1) {
      if (!canOpenCorrection) {
        onClose();
        return;
      }
      setStep(2);
      return;
    }
    // La fenêtre des métadonnées s'ouvre toujours avant de créer le ZIP
    // corrigé : l'identité du pack s'y garde ou s'y renouvelle, comme au Libre.
    setMetadataOpen(true);
  }

  function handleStepClick(index) {
    if (index === 0) setStep(0);
    if (index === 1 && canOpenReport) setStep(1);
    if (index === 2 && canOpenCorrection) setStep(2);
  }

  const primaryLabel = step === 0
    ? 'Analyser'
    : step === 1
      ? (canCreateFixedPack ? t('Corriger le pack') : (correctionCounts.optional > 0 ? t("Voir les suggestions") : t("Terminer")))
      : t('Créer le pack corrigé');

  function toggleOptionalSilence(issue) {
    const key = optionalSilenceSelectionKey(issue);
    if (!key) return;
    setSelectedOptionalSilences((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <FunnelShell
      icon={<Wrench />}
      title={t("Vérifier / corriger un pack")}
      subtitle={t("Analyse un ZIP et crée une version corrigée si besoin.")}
      size="wide"
      onClose={busy ? () => {} : onClose}
      showChrome={phase === 'collect'}
      ariaLabel={t("Vérifier ou corriger un pack")}
      stepper={(
        <FunnelStepper
          steps={STEPS}
          current={step}
          onStepClick={handleStepClick}
        />
      )}
      footer={(
        <FunnelFooter
          onBack={() => setStep(Math.max(0, step - 1))}
          backDisabled={step === 0}
          stepLabel={t('Étape {current} / {count}', { current: step + 1, count: STEPS.length })}
          onPrimary={handlePrimary}
          primaryLabel={primaryLabel}
          primaryDisabled={busy || (step === 0 && !checker.zipPath) || (step === 2 && !canCreateFixedPack)}
        />
      )}
    >
      {phase === 'analyzing' ? (
        <FunnelGenerationState
          title={t("Analyse du pack…")}
          hint={latestLine(checker.liveLog) || t('Lecture du ZIP, des médias et de la structure.')}
        />
      ) : phase === 'fixing' ? (
        <FunnelGenerationState
          title={t("Correction du pack…")}
          hint={latestLine(checker.liveLog) || t('Création du nouveau ZIP corrigé.')}
        />
      ) : phase === 'done' ? (
        <FunnelDoneState
          title={t("Pack corrigé créé")}
          fileName={basename(result?.fixedZipPath) || result?.fixedZipPath}
          meta={correctionCount(result)}
        >
          <button type="button" className="funnel-btn" onClick={() => outputDir && openPath(outputDir)}>
            <FolderOpen />
            {t("Ouvrir le dossier")}
          </button>
          <button type="button" className="funnel-btn" onClick={() => checker.exportReport('report')}>
            <Download />
            {t("Exporter le rapport")}
          </button>
          <button type="button" className="funnel-btn funnel-btn-primary" onClick={onClose}>
            <House />
            {t("Terminer")}
          </button>
        </FunnelDoneState>
      ) : (
        <div className="checker-root pack-checker-funnel">
          {step === 0 ? (
            <div className="funnel-step-content pack-checker-step">
              <FunnelSectionHeader
                icon={<Package />}
                title={t("Pack à vérifier")}
                description={t("Choisis ou dépose un fichier ZIP ou 7z. Le fichier source reste intact.")}
              />
              <FunnelDropZone
                icon={<Package />}
                title={t("Déposer un pack .zip ou .7z")}
                hint={t("L'analyse vérifie l'audio, les images, le nom, la structure et le mode nuit.")}
                disabled={busy}
                onFiles={(paths) => analyzePath(paths?.[0])}
              >
                <button type="button" className="funnel-btn" onClick={pickPack} disabled={busy}>
                  {t("Choisir un pack")}
                </button>
              </FunnelDropZone>
              {checker.zipPath ? (
                <div className="pack-checker-selected" title={checker.zipPath}>
                  <Package />
                  <span>{checker.zipPath}</span>
                </div>
              ) : null}
              <ProcessLog status={checker.status} lines={checker.liveLog} />
              {error ? <div className="funnel-error" role="alert">{error}</div> : null}
            </div>
          ) : step === 1 ? (
            <div className="funnel-step-content pack-checker-step pack-checker-step--report">
              <FunnelSectionHeader
                icon={<TriangleAlert />}
                title="Rapport"
                description={t("Lis les points conformes, les corrections possibles et les vérifications manuelles.")}
              />
              {error ? <div className="funnel-error" role="alert">{error}</div> : null}
              <ReportView
                report={checker.report}
                busy={busy}
                canFix={canCreateFixedPack}
                onExportReport={checker.exportReport}
                onFixPack={(metadataPatch) => fixPack(metadataPatch)}
                onStartFix={() => setStep(2)}
                showFixButton={false}
                selectedOptionalSilences={selectedOptionalSilences}
                onToggleOptionalSilence={toggleOptionalSilence}
              />
              <TechnicalLog
                report={checker.report}
                onCopyLog={checker.copyLog}
                onExportLog={checker.exportReport}
                onExportJson={checker.exportReport}
              />
            </div>
          ) : (
            <div className="funnel-step-content pack-checker-step">
              <FunnelSectionHeader
                icon={<Wrench />}
                title={t("Voici ce qui va être corrigé")}
                description={t("Le clic final ouvrira le choix du dossier de sortie, puis créera le ZIP corrigé.")}
              />
              <FixableCorrectionsList
                report={checker.report}
                selectedOptionalSilences={selectedOptionalSilences}
                onToggleOptionalSilence={toggleOptionalSilence}
              />
              {checker.exportNotice ? <div className="info-box">{checker.exportNotice}</div> : null}
              {error ? <div className="funnel-error" role="alert">{error}</div> : null}
              <div className="pack-checker-inline-actions">
                <FunnelToolButton icon={<Download />} accent="neutral" onClick={() => checker.exportReport('report')}>
                  {t("Exporter le rapport")}
                </FunnelToolButton>
              </div>
              {metadataOpen ? (
                <CommunityPackMetadataModal
                  report={checker.report}
                  busy={busy}
                  onCancel={() => setMetadataOpen(false)}
                  onSubmit={(metadataPatch) => fixPack(metadataPatch)}
                />
              ) : null}
            </div>
          )}
        </div>
      )}
    </FunnelShell>
  );
}
