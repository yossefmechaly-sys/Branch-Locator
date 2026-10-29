# Moyenne des avis dans la liste des magasins

Cette mise à jour ajoute les étoiles jaunes, la moyenne sur 5 et le nombre
d'avis publiés sur les cartes des magasins, dans les cinq langues du site.
Les avis en attente ou refusés sont exclus. Aucun changement du schéma de base
n'est nécessaire. Le paquet cible uniquement `branch-locator.service`.

Le script prépare et compile la mise à jour séparément, lance la sauvegarde
PostgreSQL existante, vérifie les nouvelles moyennes et conserve la version
précédente. La configuration privée reste sur le VPS.

## Déploiement

Se connecter au VPS comme `franck`, puis exécuter ce bloc :

```bash
(
set -euo pipefail
notes_dir=$(mktemp -d /home/franck/deploiement-notes.XXXXXX)
cd "$notes_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-list-ratings.tar.gz" -o notes.tar.gz
printf '%s\n' 'ba3fd2926140d712603007e1f19b8d54b51d978da5b1a9034bec23f795c049e1  notes.tar.gz' | sha256sum --check
tar -xzf notes.tar.gz
python3 branch-locator-list-ratings/deploy.py
)
```

Attendre `DEPLOIEMENT_REUSSI`, puis recharger `/he/branches`. Un magasin doit
avoir au moins un avis publié pour afficher une moyenne. La note est cliquable
et mène à la section des avis du magasin.
