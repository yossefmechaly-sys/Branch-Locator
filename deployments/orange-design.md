# Branch Locator — présentation orange

Après cette installation, appliquer la [correction de l'illustration et du
titre hébreu](mockup-correction.md) pour retrouver le rendu de la maquette.

Mise à jour de la liste des magasins dans les cinq langues : hébreu, français,
anglais, russe et espagnol. Les avis modérés, moyennes, photos, recherches,
filtres et itinéraires sont conservés. [Détails du design](../docs/orange-locator-design.md).

## Installation sur le VPS

Se connecter comme `franck` et copier ce bloc :

```bash
(
set -euo pipefail
orange_dir=$(mktemp -d /home/franck/deploiement-orange.XXXXXX)
cd "$orange_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-orange-design.tar.gz" -o orange.tar.gz
printf '%s\n' '159333553898b79de9106f6b9911b45de43b2cc532b90bcbbe526592eb6de43c  orange.tar.gz' | sha256sum --check
tar -xzf orange.tar.gz
python3 branch-locator-orange-design/deploy.py
)
```

Le résultat attendu est `DEPLOIEMENT_REUSSI : https://branch-locator.tobedev.com`.

Le paquet cible uniquement `/home/franck/branch-locator` et
`branch-locator.service`. Il exige la version précédente comprenant les
photos dans la liste et refuse les fichiers source modifiés sur le serveur.
Il vérifie la configuration du service et les empreintes du paquet, prépare
une compilation isolée et déclenche la sauvegarde PostgreSQL existante.
Aucune migration ni insertion de données n'est exécutée.

Les fichiers de configuration privés, la clé Google Maps et les photos
téléversées restent sur le serveur. Les ressources de l'ancienne version
sont conservées pour les navigateurs déjà ouverts. Les contrôles vérifient les
cinq pages traduites, le sens de lecture, les ressources JavaScript/CSS, les
magasins, les avis, les moyennes, les vignettes et la connexion administrateur.
Ils tournent avant la bascule, après celle-ci en local, puis sur le domaine
public. Un échec après bascule restaure la version précédente.

Le dossier de retour arrière est affiché en fin d'exécution :
`/home/franck/.branch-locator-deployments/<date>/rollback`.

Sept tests du déployeur couvrent la restauration après échec partiel, les
fichiers altérés, les changements inattendus du code, les photos et ressources
conservées, ainsi que le refus d'une traduction ou d'une ressource manquante.
Ils sont inclus dans le paquet : `python3 branch-locator-orange-design/test_deploy.py`.
