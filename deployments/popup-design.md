# Encadré de carte — nouvelle présentation

L'encadré reprend la palette orange du site, avec photo principale ou icône,
titre plus lisible, note publique lorsqu'elle existe, adresse et statut
regroupés, contacts alignés et bouton orange vers la fiche sur toute la largeur.
La grande zone vide de l'en-tête Google est supprimée avec l'option officielle
`headerDisabled`. La fermeture reste disponible dans les cinq langues.

Validation : compilation et lint réussis, 30 tests unitaires ciblés, dix
parcours navigateur, trente variantes visuelles et sept contrôles du
déployeur réussis. Les contrôles navigateur utilisent un SDK Maps simulé et
la véritable application pour les interactions et les liens.

## Installation sur le VPS

Depuis le compte `franck`, après le nouveau design des fiches :

```bash
(
set -euo pipefail
popup_dir=$(mktemp -d /home/franck/design-encadre.XXXXXX)
cd "$popup_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-popup-design.tar.gz" -o encadre.tar.gz
printf '%s\n' '565167b456a3af83c61c1048529cd0a7bf4a8f10eae2a5b47bf20e80bdce1d56  encadre.tar.gz' | sha256sum --check
tar -xzf encadre.tar.gz
python3 branch-locator-popup-design/deploy.py
)
```

Le résultat attendu est `DEPLOIEMENT_REUSSI : https://branch-locator.tobedev.com`.

Le script cible uniquement `branch-locator.service`, vérifie les empreintes,
prépare une compilation isolée et conserve les photos et la configuration
privées. Les cinq listes et les cinq fiches, les nouveaux styles et les
ressources sont contrôlés avant et après la bascule. Un échec après bascule
restaure la version précédente. Aucune migration ni insertion en base n'est exécutée.
