# Nouveau design des fiches magasin

La maquette orange est appliquée aux cinq langues : bandeau avec le nom et
l'adresse, barre d'actions flottante, galerie et horaires côte à côte,
carte et résumé des avis. La disposition s'adapte au mobile.
[Description complète](../docs/branch-detail-design.md).

Validation : compilation et lint réussis, 725 tests unitaires, 16 parcours
navigateur et 25 contrôles d'affichage réussis. Le formulaire d'avis, la
modération, les promotions, la navigation et les statuts restent fonctionnels.

## Installation sur le VPS

Se connecter comme `franck`, puis copier ce bloc :

```bash
(
set -euo pipefail
fiche_dir=$(mktemp -d /home/franck/design-fiches.XXXXXX)
cd "$fiche_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-detail-design.tar.gz" -o fiches.tar.gz
printf '%s\n' 'fccdd4b9246711608cb387404d54e915f1150318c4271ef08d18d156521d6505  fiches.tar.gz' | sha256sum --check
tar -xzf fiches.tar.gz
python3 branch-locator-detail-design/deploy.py
)
```

Le résultat attendu est `DEPLOIEMENT_REUSSI : https://branch-locator.tobedev.com`.

Le paquet cible uniquement `/home/franck/branch-locator` et son service
`branch-locator.service`. Il vérifie les sources et le paquet, prépare une
compilation isolée et déclenche la sauvegarde PostgreSQL existante.
Aucune migration ni insertion de données n'est exécutée.

Les photos du VPS, le logo et les fichiers de configuration privés sont
conservés. Les ressources de l'ancienne version restent accessibles pour
les navigateurs déjà ouverts. Les contrôles vérifient les cinq listes et
les cinq fiches, les ressources JavaScript/CSS, les horaires, la galerie,
la carte, les avis et la connexion administrateur avant et après la bascule.
Un échec après bascule restaure la version précédente.

Le dossier de retour arrière est affiché dans les traces :
`/home/franck/.branch-locator-deployments/<date>/rollback`.
