# Sauvegarde GitHub — 26 octobre 2026

Cette version contient le code complet reçu depuis le VPS, les avis clients avec
modération et la modification qui affiche des étoiles jaunes sur les fiches
magasin. Elle inclut les migrations Prisma, tests, ressources publiques et
documents du projet.

Les paquets et leurs empreintes SHA256 sont conservés dans `deployments/`.
Le paquet `branch-locator-review-stars.tar.gz` contient la dernière correction
d'affichage. Le déploiement des avis avec modération a été confirmé sur le VPS ;
celui des étoiles jaunes reste à confirmer.

## Éléments conservés séparément sur le VPS

- Données PostgreSQL et sauvegardes du service `branch-locator-backup.service`.
- Variables privées de configuration et secrets (`.env*`).
- Fichiers ajoutés en production après l'archive source fournie.
- Configuration système du VPS, du reverse proxy et des services systemd.

`node_modules`, `.next`, caches et rapports de tests sont exclus du dépôt et
peuvent être régénérés. Les paquets de déploiement utilisent les paramètres
existants du VPS et conservent la version précédente pour le retour arrière.
