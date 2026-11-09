# Correctif des filtres sur mobile

Les filtres Ville et Services sont entièrement lisibles et faciles à ouvrir
sur petit écran. Les menus suivent le sens de lecture de la langue et les
libellés longs reviennent à la ligne. [Détails](../docs/mobile-filters.md).

Validation : 40 cas navigateur au toucher couvrant les cinq langues, quatre
largeurs d'écran (320, 393, 600, 1280 pixels) et deux tailles de texte.
Les contrôles vérifient aussi les flèches, les options longues, la position
des listes dans l'écran, le résultat des filtres et leur réinitialisation.
La compilation, le lint, les 18 tests unitaires des filtres et distances ainsi
que les sept tests du déployeur passent.

## Installation sur le VPS

Depuis le compte `franck`, après la correction de la maquette et de la police :

```bash
(
set -euo pipefail
mobile_dir=$(mktemp -d /home/franck/correction-mobile.XXXXXX)
cd "$mobile_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-mobile-filters.tar.gz" -o mobile.tar.gz
printf '%s\n' '298e1c2ab9dd7be0ea25b923ddb8145eba706f999b5afa802545e39121e05268  mobile.tar.gz' | sha256sum --check
tar -xzf mobile.tar.gz
python3 branch-locator-mobile-filters/deploy.py
)
```

Le résultat attendu est `DEPLOIEMENT_REUSSI : https://branch-locator.tobedev.com`.

Le script cible uniquement `branch-locator.service`, vérifie les empreintes,
prépare une compilation isolée et conserve les photos, la police, l'image de
la maquette et la configuration privée. Les contrôles des cinq langues et
des ressources sont exécutés avant et après la bascule. Un échec restaure la
version précédente. Aucune migration ni insertion en base n'est exécutée.
