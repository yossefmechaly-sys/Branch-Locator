# Correctif : ouvrir une fiche depuis la carte

Le bouton Détails et le nom du magasin dans l'encadré de la carte sont des
liens vers la fiche complète dans la langue active. Le bouton est doré et
facile à toucher. Cela fonctionne sur ordinateur et dans le panneau mobile,
en hébreu, français, anglais, russe et espagnol.

Validation : compilation de production et lint réussis, 720 tests unitaires,
16 parcours navigateur et sept contrôles du déployeur réussis. Les dix
nouveaux parcours de carte effectuent vingt navigations réelles, depuis le
titre et le bouton de l'encadré. Seul le SDK Google Maps est simulé localement.

## Installation sur le VPS

Se connecter comme `franck`, puis copier ce bloc :

```bash
(
set -euo pipefail
carte_dir=$(mktemp -d /home/franck/correction-carte.XXXXXX)
cd "$carte_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-map-links.tar.gz" -o carte.tar.gz
printf '%s\n' '77f562aee9c4d5224aa1a3c4451a58ec3beb3441c539df615a23b745f960ca56  carte.tar.gz' | sha256sum --check
tar -xzf carte.tar.gz
python3 branch-locator-map-links/deploy.py
)
```

Le résultat attendu est `DEPLOIEMENT_REUSSI : https://branch-locator.tobedev.com`.

Le paquet cible seulement `/home/franck/branch-locator` et son service
`branch-locator.service`. Le script vérifie les empreintes des sources et du
paquet, prépare une compilation séparée, déclenche la sauvegarde PostgreSQL
existante et effectue les contrôles avant et après la bascule. Un échec après
bascule restaure les anciens fichiers et la version compilée précédente.

Les photos et la configuration privées restent sur le serveur. Aucune
migration ni insertion de données n'est exécutée. Les tests mis à jour sont
inclus pour garder les sources et les vérifications TypeScript compatibles.
