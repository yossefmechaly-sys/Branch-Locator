# Sélection d'un magasin depuis toute sa carte

Un clic dans l'espace blanc, sur l'adresse ou sur le statut sélectionne le
magasin comme son titre : cadre orange et localisation sur la carte.
Les boutons et les liens gardent leur action propre.

Validation : compilation de production et lint réussis, 28 tests unitaires
sur les cartes et leurs actions, dix parcours navigateur couvrant les cinq
langues sur ordinateur et mobile, et sept contrôles du déployeur réussis.
Les parcours vérifient la sélection unique, le recentrage, le zoom, l'encadré
du magasin et les liens vers ses fiches. Le SDK Google Maps est simulé.

## Installation sur le VPS

Depuis le compte `franck`, après le correctif des liens dans la carte :

```bash
(
set -euo pipefail
selection_dir=$(mktemp -d /home/franck/selection-magasin.XXXXXX)
cd "$selection_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-card-selection.tar.gz" -o selection.tar.gz
printf '%s\n' 'a136794dc2eba41045fc572feb2445f34b48c787d9caead3e63364481e2bbe57  selection.tar.gz' | sha256sum --check
tar -xzf selection.tar.gz
python3 branch-locator-card-selection/deploy.py
)
```

Le résultat attendu est `DEPLOIEMENT_REUSSI : https://branch-locator.tobedev.com`.

Le paquet cible uniquement `branch-locator.service`. Il vérifie les sources,
prépare une compilation isolée et conserve les photos et la configuration
privées. Les contrôles fonctionnels sont exécutés avant et après la bascule.
Un échec après bascule restaure la version précédente. Aucune migration ni
insertion de données n'est exécutée.
