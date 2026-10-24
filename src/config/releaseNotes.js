import { t } from '../i18n/index.js';
export function RELEASE_NOTES() {
  return Object.freeze({
  version: '0.9.9',
  date: '2026-10-03',
  message: [
    t('Bienvenue dans la 0.9.9 ! Cette mise à jour introduit l’Éditeur graphe, et Story Studio se rapproche de ce que je voulais en faire.'),
    t('J’ai besoin de toi ! Signale-moi les bugs et partage tes retours. J’ai créé un serveur Discord pour que ce soit plus simple de discuter et de suivre les problèmes ensemble.'),
    t('Avec trois éditeurs, des outils audio et image, et maintenant Windows, Linux et macOS, je ne peux pas tout tester sur toutes les plateformes sans ton aide. Merci de contribuer à faire avancer Story Studio !'),
  ],
  highlights: [
    [t('Éditeur graphe'), t('Écrans, Listes de choix et raccords visibles.')],
    [t('Contrôles avant génération du ZIP'), t('Navigation, médias et archive générée vérifiés.')],
  ],
  fixes: [
    [t('UUID des packs'), t('L’identifiant choisi est conservé à la génération du ZIP.')],
    ['Imports YouTube', t('Imports plus robustes et choix de langue corrigé.')],
    [t('Navigation importée'), t('Corrections des choix imbriqués, retours et fins de parcours.')],
    [t('Éditeur simplifié'), t('Génération des packs et harmonisation audio corrigées.')],
    [t('Sauvegarde et récupération'), t('Corrections des sessions récupérées et des médias associés.')],
  ],
  chores: [],
  discordUrl: 'https://discord.gg/jztpQz5Ad',
  changelogUrl: 'https://github.com/Hugs11/story-studio/blob/main/CHANGELOG.md',
});
}

export function shouldShowReleaseNotes(appVersion, seenVersion) {
  return appVersion === RELEASE_NOTES().version && seenVersion !== appVersion;
}
