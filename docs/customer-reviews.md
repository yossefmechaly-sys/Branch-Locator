# Avis et satisfaction client

Chaque fiche magasin propose un formulaire d'avis (note de 1 à 5, prénom ou
pseudonyme et commentaire de 10 à 2 000 caractères). L'interface publique est
disponible en hébreu, français, anglais, russe et espagnol. Les commentaires
restent dans leur langue d'origine ; ils ne sont pas traduits automatiquement.

Un nouvel avis est toujours **en attente**. Il n'est visible publiquement et
n'entre dans les statistiques qu'après publication dans `/admin/reviews`.
La page propose des filtres par magasin et statut, une moyenne pondérée,
la répartition des notes et le taux de satisfaction : pourcentage des avis
**publiés** ayant une note de 4 ou 5. Sans avis, aucune moyenne ni taux fictif
n'est affiché. Les listes sont paginées par dix avis.

La liste des magasins affiche aussi une moyenne sur 5, des étoiles jaunes avec
remplissage partiel et le nombre d'avis publiés. Le lien mène à la section des
avis de ce magasin. Sans avis publié, la carte affiche « Pas encore d'avis »
(dans la langue du site). Les moyennes sont calculées en une seule requête
groupée pour toute la liste, sans charger les commentaires ni les informations
privées. Une publication ou un refus actualise également les notes de la liste.

Les administrateurs et super-administrateurs peuvent publier, refuser ou
remettre en attente un avis. Les éditeurs peuvent consulter mais pas modérer.
Les notes et textes ne peuvent pas être modifiés par le modérateur. Les avis
négatifs peuvent être publiés comme les positifs : la modération vise les
contenus abusifs, hors sujet ou contenant des données personnelles, pas le
retrait des critiques. Chaque décision est journalisée dans la même transaction
que le changement de statut. Une modification concurrente est refusée et les
pages publiques des cinq langues sont invalidées après modération.

Le formulaire ne demande ni compte ni email et ne certifie pas un achat.
Le serveur impose trois soumissions par heure et par origine réseau, tous
magasins confondus, y compris les avis refusés ou en attente. La limitation
est stockée dans PostgreSQL et sérialisée pour résister aux requêtes
concurrentes et aux redémarrages. Les visiteurs partageant une adresse réseau
partagent cette limite. Un champ piège et des limites de taille complètent ce
dispositif ; il ne remplace pas une protection anti-bot dédiée à fort trafic.

Seul un HMAC de l'adresse réseau est conservé, jamais l'adresse brute.
`AUTH_SECRET` doit être configurée. Le reverse proxy du VPS doit **écraser**
`X-Forwarded-For` avec l'adresse de son client, et le serveur Next.js ne doit
pas être accessible en contournant ce proxy. Exemple pour un Nginx directement
exposé : `proxy_set_header X-Forwarded-For $remote_addr;`. En présence d'un CDN,
configurer les adresses des proxies de confiance avant d'utiliser leur IP réelle.
Les requêtes de soumission doivent provenir de l'origine du site, avec un corps
JSON de 16 Kio maximum. Les avis sont rendus comme texte, jamais comme HTML.

## Installation / déploiement

Sauvegarder la base selon la procédure habituelle avant toute migration sur le
VPS. La migration est additive et conserve les magasins existants :

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

Redémarrer ensuite le service applicatif suivant la procédure du VPS. Ne pas
exécuter `prisma db seed` sur la base de production : les données de démonstration
sont réservées à une base locale/CI. Un magasin avec des avis ne peut pas être
supprimé définitivement ; il peut être désactivé pour préserver l'historique.

## Vérification

`npm test -- --maxWorkers=2` couvre validation, calculs, permissions, modération,
API et formulaire. Le parcours Playwright `tests/e2e/branch-reviews.spec.ts`
exerce soumission, confidentialité avant modération, publication d'un avis positif
et d'un avis négatif, calculs, refus et isolation entre magasins sur une base de
démonstration. Il exige la base migrée/seedée et le serveur démarré.
