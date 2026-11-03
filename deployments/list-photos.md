# Petites photos dans la liste des magasins

La mise à jour affiche la photo principale de chaque magasin dans une vignette
arrondie et cliquable, adaptée aux écrans mobiles et à l'hébreu. Une icône
remplace une photo absente ou indisponible. Aucune photo fictive n'est ajoutée.

Le paquet inclut aussi les moyennes et étoiles de la liste. Il accepte la version
avec avis modérés ainsi que la version avec moyennes déjà installées : il n'est
pas nécessaire d'exécuter l'ancien paquet des moyennes avant celui-ci.

Le script utilise la sauvegarde PostgreSQL existante, compile séparément,
contrôle les cartes et conserve la version précédente pour le retour arrière.
Les photos téléversées et les paramètres privés restent sur le VPS.

## Déploiement

Se connecter au VPS avec le compte `franck`, puis exécuter :

```bash
(
set -euo pipefail
photos_dir=$(mktemp -d /home/franck/deploiement-photos.XXXXXX)
cd "$photos_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-list-photos.tar.gz" -o photos.tar.gz
printf '%s\n' '598ed938f32d59a199ba41aed0c970dbe5b243bf9c43dc1944e52f1b89f23a51  photos.tar.gz' | sha256sum --check
tar -xzf photos.tar.gz
python3 branch-locator-list-photos/deploy.py
)
```

Attendre `DEPLOIEMENT_REUSSI`, puis recharger `/he/branches`. Les photos se
configurent dans les fiches magasin, champ « Image principale ».
