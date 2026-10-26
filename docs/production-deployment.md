# Déploiement en production — Maayan 2000 Store Locator

Ce document couvre l'ensemble Phase 11 : checklist d'environnement, architecture
de déploiement recommandée, Docker, CI, procédure de déploiement (runbook),
stratégie de rollback, sauvegarde/restauration, et observabilité. Voir
`PHASE_11_RAPPORT.md` pour le verdict final et la distinction explicite entre
ce qui a été **vérifié dans ce bac à sable** et ce qui **reste à vérifier dans
un environnement réel** (Prisma Client généré, PostgreSQL réel, Playwright).

---

## 1. Checklist d'environnement de production

### 1.1 Runtime

| Composant | Version requise | Remarque |
|---|---|---|
| Node.js | ≥ 20.9.0 (recommandé : 22 LTS) | Contrainte de `next@16` elle-même (`package.json#engines`). Ce projet a été développé et testé avec Node 22. |
| PostgreSQL | 14+ (recommandé : 16) | Aucune fonctionnalité Postgres récente exotique n'est utilisée par le schéma ; 16 est la version utilisée en développement. |
| npm | 10+ | Fourni avec Node 22. |

### 1.2 Variables d'environnement obligatoires

Toutes déclarées dans `.env.example` — **aucune valeur par défaut de secours
en production** pour celles marquées « obligatoire » ci-dessous (contrairement
à `NEXT_PUBLIC_SITE_URL` qui a un repli `localhost` réservé au développement,
voir `lib/seo/site.ts`).

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | Oui | Chaîne de connexion PostgreSQL (`postgresql://user:pass@host:5432/db?schema=public`). Consommée par `prisma.config.ts` et `lib/prisma.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Oui en production | Domaine canonique **sans slash final** (ex. `https://maayan2000.co.il`). Utilisé pour `metadataBase`, hreflang, sitemap, JSON-LD, Open Graph. Un oubli en production ne casse rien visuellement mais dégrade silencieusement le SEO (URLs canoniques pointant vers `localhost`) — donc vérifié explicitement au déploiement (§4). |
| `AUTH_SECRET` | Oui | Secret de signature JWT Auth.js (`/admin`). Générer avec `npx auth secret` ou `openssl rand -base64 32`. **Rotation = déconnexion immédiate de toutes les sessions admin actives** — à planifier, jamais en pleine journée de travail admin sans prévenir. |
| `NEXTAUTH_URL` | Oui | URL absolue du site (même domaine que `NEXT_PUBLIC_SITE_URL`), requise par Auth.js pour construire les redirections OAuth/callback même en mode Credentials-only. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Oui pour la carte | Clé **côté navigateur** — restreinte par domaine référent ET par API (Maps JavaScript API uniquement) dans Google Cloud Console. Voir le README pour la procédure complète. |
| `GOOGLE_GEOCODING_API_KEY` | Oui pour l'import magasins avec géocodage | Clé **strictement serveur**, jamais préfixée `NEXT_PUBLIC_`, jamais envoyée au client. |

Secrets à gérer via le mécanisme de secrets de la plateforme cible (variables
d'environnement chiffrées du orchestrateur/PaaS), **jamais commités** — `.env*`
est exclu de git (`.gitignore`), seul `.env.example` (sans valeurs) est versionné.

### 1.3 Accès réseau sortant requis au moment du build

**Point bloquant documenté explicitement** (voir aussi §14 de
`PHASE_9_RAPPORT.md`, revérifié à l'identique cette phase) : `npx prisma
generate`/`format`/`validate` téléchargent les binaires du moteur Prisma
(`schema-engine`) depuis `binaries.prisma.sh`. Dans le bac à sable utilisé
pour développer ce projet, cet hôte est bloqué par une politique d'égress
organisationnelle délibérée (`403 Forbidden` sur le fichier de checksum
lui-même, jamais contourné — voir §26 de `PHASE_9_RAPPORT.md`).

**Un environnement de build de production doit donc explicitement autoriser
`binaries.prisma.sh` en sortie**, ou utiliser une image contenant déjà les
moteurs pré-téléchargés (voir §3, Dockerfile multi-étapes). C'est une
exigence d'infrastructure, pas un défaut du code — aucune tentative de
contournement (variable `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING`, miroir non
officiel, etc.) n'a été faite ni ne doit être faite pour masquer ce blocage
dans le bac à sable de développement.

### 1.4 Checklist avant premier déploiement

- [ ] Toutes les variables du §1.2 définies dans l'environnement cible.
- [ ] `DATABASE_URL` pointe vers l'instance PostgreSQL de **production**, jamais
      vers une base de développement/test (voir la règle absolue : ne jamais
      réinitialiser automatiquement une base de production).
- [ ] Egress réseau vers `binaries.prisma.sh` autorisé au moment du build (§1.3),
      ou image Docker pré-construite avec les moteurs déjà présents.
- [ ] Clé Google Maps restreinte par domaine + API avant mise en ligne (une clé
      non restreinte exposée côté client est immédiatement exploitable).
- [ ] Au moins un compte `AdminUser` `SUPER_ADMIN` créé (aucune route de
      signup public n'existe — §1 Phase 9 — la création initiale se fait par
      script serveur, voir `prisma/seed.ts` pour le mot de passe DEMO
      **jamais utilisé en production**, ou un script dédié one-shot).
- [ ] Sauvegarde automatisée de la base configurée **avant** la première mise
      en trafic réel (§7).
- [ ] Domaine + certificat TLS provisionnés (voir §2 — TLS terminé en amont de
      l'application, jamais géré par Next.js lui-même).

---

## 2. Architecture de déploiement recommandée

Le projet est explicitement conçu pour un **hébergement autogéré** (Node.js /
Docker), pas Vercel — voir le commentaire de `lib/auth/config.ts`
(`trustHost: true` : « déploiement auto-hébergé, jamais Vercel »). Cette
section documente une topologie cohérente avec ce choix déjà fait dans le
code, sans imposer un fournisseur cloud précis : n'importe quel hôte capable
de faire tourner un conteneur Docker + une base PostgreSQL managée convient
(VPS avec Docker Compose, ECS/Fargate, Cloud Run, un cluster Kubernetes
existant, etc.).

```
                        ┌─────────────────────────┐
                        │   Reverse proxy / CDN     │
                        │  (TLS, HSTS, compression, │
                        │   cache statique, WAF)    │
                        └────────────┬─────────────┘
                                     │ HTTP interne
                        ┌────────────▼─────────────┐
                        │   Conteneur Next.js       │
                        │   (next start, standalone)│
                        │   1..N instances           │
                        │   stateless (JWT session)  │
                        └────────────┬─────────────┘
                                     │ DATABASE_URL (TLS)
                        ┌────────────▼─────────────┐
                        │   PostgreSQL managé        │
                        │   (RDS / Cloud SQL /       │
                        │    instance dédiée)        │
                        │   + sauvegardes auto (§7)  │
                        └────────────────────────────┘
```

Points de conception :

- **TLS terminé en amont** (reverse proxy/CDN — nginx, Caddy, ou le load
  balancer managé de la plateforme), jamais dans le processus Next.js
  lui-même. C'est aussi la bonne couche pour l'en-tête `Strict-Transport-Security`
  (HSTS) : ajouté au niveau TLS, pas dans `next.config.ts`, puisque l'app
  elle-même ne sait pas si elle est effectivement servie en HTTPS derrière le
  proxy (voir §9.3, notes de sécurité).
- **Sans état applicatif** : les sessions admin sont des JWT signés
  (`session: { strategy: "jwt" }`, `lib/auth/config.ts`) — aucune session
  serveur en mémoire, donc plusieurs instances Next.js derrière un
  load-balancer sont directement compatibles (pas d'affinité de session
  requise). Le seul état partagé est PostgreSQL.
- **Une seule base PostgreSQL** — pas de réplica en lecture nécessaire à ce
  volume de données (12 magasins DEMO en développement ; un déploiement réel
  avec quelques centaines de magasins reste très en dessous du seuil où une
  lecture répliquée devient utile).
- **Migrations exécutées comme une étape distincte du déploiement**, jamais au
  démarrage de l'application (voir le runbook §5) — évite que N instances
  démarrant en parallèle n'exécutent `migrate deploy` en concurrence.
- **Photos de magasins** (`BranchImage.imageUrl`) : actuellement des URLs
  simples (aucune intégration de stockage objet dédiée dans le code de cette
  phase). En production, héberger ces images sur un stockage objet
  (S3-compatible) plutôt que sur le disque local du conteneur — un conteneur
  est éphémère par nature, un disque local y perdrait son contenu à chaque
  redéploiement. `next.config.ts#images.remotePatterns` doit alors lister le
  domaine réel de ce stockage (actuellement vide, à compléter au moment où un
  fournisseur est choisi — non fait dans cette phase, aucune décision de
  fournisseur n'ayant été demandée).

---

## 3. Docker

Voir `Dockerfile` à la racine du projet — build multi-étapes standard pour
Next.js en sortie `output: "standalone"` : `deps` (installation des
dépendances + `prisma generate`, nécessite l'egress du §1.3), `builder`
(`next build`), `runner` (image finale minimale, utilisateur non-root,
n'embarque que `.next/standalone` + `.next/static` + `public`).

**Résultat de la validation dans ce bac à sable** : Docker (29.4.3) est bien
présent, et son démon a pu être démarré (conteneur imbriqué, cgroup v1) — mais
`docker build .` échoue **avant même** d'atteindre l'étape `prisma generate` :

```
ERROR: failed to do request: Head "https://registry-1.docker.io/v2/library/node/manifests/22-slim": Forbidden
```

C'est exactement la même politique d'égress organisationnelle déjà documentée
pour `binaries.prisma.sh` (§1.3), appliquée cette fois à Docker Hub
(`registry-1.docker.io`) — confirmé en inspectant les variables d'environnement
du bac à sable : un proxy sortant filtrant (`https_proxy=http://127.0.0.1:…`)
n'autorise explicitement qu'une liste d'hôtes précise (`registry.npmjs.org`,
`pypi.org`, `proxy.golang.org`, etc. — la même liste qui permet déjà à `npm
ci`/`npm install` de fonctionner normalement dans ce bac à sable), sans que
`registry-1.docker.io` ni `binaries.prisma.sh` n'en fassent partie. Conforme à
la consigne : aucun miroir alternatif, registre non officiel, ni option
`--insecure-registry` n'a été tenté pour contourner ce blocage — documenté ici
tel quel.

**Le `Dockerfile` lui-même n'a donc pas pu être validé de bout en bout dans ce
bac à sable** (ni l'étape `prisma generate`, déjà connue comme bloquée, ni
même le simple `docker pull node:22-slim` qui la précède). Il a été relu
attentivement (étapes, ordre de copie, utilisateur non-root, `output:
"standalone"` déjà activé dans `next.config.ts`) mais reste, comme le reste de
cette phase touchant Prisma, dans la catégorie « à vérifier dans un
environnement réel » plutôt que « vérifié ici » — voir le verdict de
`PHASE_11_RAPPORT.md`. Un environnement de build CI/CD avec un accès réseau
normal (voir §4) ne rencontrera ni l'un ni l'autre blocage.

`next.config.ts` ne déclare pas encore `output: "standalone"` — ajouté
spécifiquement pour ce Dockerfile (voir le diff), sans changer aucun autre
comportement de build.

---

## 4. CI (Intégration continue)

Voir `.github/workflows/ci.yml` — exécute, sur chaque push/PR, dans un
environnement GitHub Actions avec un accès réseau normal (donc SANS le
blocage §1.3) :

1. `npm ci`
2. `npx prisma generate` (résout enfin réellement le Prisma Client — ce que ce
   bac à sable ne peut jamais faire)
3. `npm run lint`
4. `npx tsc --noEmit`
5. `npm test` (Vitest — 646 tests au moment de cette phase)
6. `npm run build`

Un second job (`e2e`) déclare un service PostgreSQL réel
(`services: postgres:`), applique les migrations (`prisma migrate deploy`),
seed les données de démonstration, puis exécute la suite Playwright
**permanente** (`npm run test:e2e`, Phase 9 §28) contre l'application
réellement démarrée (`E2E_START_SERVER=1`, voir `playwright.config.ts`). Ce
job est actif dans le workflow committé (pas un squelette commenté) — c'est
lui, sur un runner GitHub Actions avec un accès réseau normal, qui doit
constituer la toute première exécution réelle de bout en bout (`prisma
generate` → `migrate deploy` → `db seed` → `next build` → `next start` →
Playwright) que ce projet ait jamais eue, aucune de ces étapes n'ayant pu
être tentée dans le bac à sable de développement (§14).

**C'est cette CI, pas ce bac à sable, qui doit être le premier endroit où
`prisma generate`/`build`/`test:e2e` sont réellement exécutés avec succès**
avant tout déploiement — voir le verdict de `PHASE_11_RAPPORT.md`.

---

## 5. Runbook de déploiement

### 5.1 Premier déploiement (base vide)

Une base tout juste créée n'a par définition rien à perdre — l'étape de
sauvegarde ci-dessous devient réellement significative à partir du premier
déploiement de mise à jour (§5.2), mais est listée ici aussi pour que la
séquence des deux sous-sections reste identique et jamais improvisée au cas
par cas.

```bash
# 1. Construire l'image (ou installer + build directement sur l'hôte cible)
docker build -t maayan2000-store-locator:<tag> .

# 2. Appliquer TOUTES les migrations sur la base vide, dans l'ordre
#    chronologique du dossier prisma/migrations/ — jamais `migrate dev`
#    en production (celle-ci peut générer des migrations interactives/
#    destructives, réservée au développement local).
DATABASE_URL=... npx prisma migrate deploy

# 3. Seed INITIAL uniquement si un jeu de données de démarrage est voulu.
#    Le seed fourni (`prisma/seed.ts`) crée des données DE DÉMONSTRATION
#    (magasins DEMO, compte admin DEMO) — NE JAMAIS l'exécuter tel quel
#    contre une base de production réelle destinée à de vraies données
#    magasin. Écrire un script d'amorçage dédié (au minimum : un compte
#    SUPER_ADMIN réel) si un jeu de données de démarrage est nécessaire.
# DATABASE_URL=... npx prisma db seed   # (à adapter, voir avertissement ci-dessus)

# 4. Démarrer l'application
docker run -e DATABASE_URL=... -e AUTH_SECRET=... [...autres variables §1.2] \
  -p 3000:3000 maayan2000-store-locator:<tag>

# 5. Vérifier la santé de l'application AVANT de router du trafic réel
curl -f https://<domaine>/api/health
# → {"status":"ok","timestamp":"..."} avec code 200 : succès.
# → {"status":"degraded","timestamp":"..."} avec code 503 : la connexion DB
#   a échoué (voir app/api/health/route.ts) — NE PAS router de trafic,
#   diagnostiquer DATABASE_URL/réseau avant de continuer.

# 6. Tests de fumée manuels (voir la checklist Gate I/K de la validation
#    Production Gate) : Store Locator he/en/fr, une fiche magasin, recherche,
#    connexion admin, tableau de bord — AVANT d'annoncer le déploiement
#    terminé.
```

### 5.2 Déploiements suivants (mise à jour) — séquence complète

```bash
# 1. Préparation : geler les migrations à appliquer, choisir la fenêtre de
#    déploiement, s'assurer qu'aucune migration destructive n'est dans le lot
#    (voir §6.2 — toutes les migrations existantes de ce projet sont
#    additives, à revérifier pour toute NOUVELLE migration avant de continuer).

# 2. SAUVEGARDE — voir §7 — avant toute modification de schéma en
#    production, JAMAIS sautée même quand la migration semble triviale.
#    Un `pg_dump`/snapshot pris ici est ce qui rend l'étape 4 réellement sûre.
pg_dump "$DATABASE_URL" -Fc -f "backup-$(date +%Y%m%dT%H%M%S).dump"

# 3. Construire la nouvelle image
docker build -t maayan2000-store-locator:<nouveau-tag> .

# 4. Appliquer UNIQUEMENT les migrations non encore appliquées — `migrate
#    deploy` est idempotent et ne rejoue jamais une migration déjà appliquée
#    (suivi via la table `_prisma_migrations`).
DATABASE_URL=... npx prisma migrate deploy

# 5. Démarrer la nouvelle version (rolling update — au moins une instance de
#    l'ancienne version reste disponible pendant que la nouvelle démarre et
#    passe son health check ci-dessous, AVANT de couper l'ancienne).
#    Sans état de session serveur (§2), plusieurs versions peuvent
#    techniquement cohabiter brièvement pendant la bascule.

# 6. Vérifier /api/health sur les nouvelles instances avant de couper les
#    anciennes.

# 7. Tests de fumée (même liste qu'à l'étape 6 de §5.1) sur les nouvelles
#    instances avant de considérer le déploiement terminé — un `/api/health`
#    au vert ne prouve que la connexion DB, jamais qu'une page ou un
#    formulaire admin fonctionne réellement.
```

**Résumé de la séquence attendue** (préparation → sauvegarde → migration →
déploiement applicatif → health check → tests de fumée) — les deux
sous-sections ci-dessus l'appliquent explicitement, jamais une étape sautée
par habitude ou par urgence perçue.

**Commandes explicitement INTERDITES contre une base de production**, quelle
que soit l'urgence perçue : `prisma migrate reset` (réinitialise
intégralement la base — perte de données totale) et `prisma migrate dev`
(conçue pour un cycle de développement interactif, peut générer et appliquer
une migration à la volée sans revue). Seul `prisma migrate deploy` — déjà la
seule commande utilisée dans ce runbook — est conçu pour un environnement de
production : il n'applique que des migrations déjà écrites et committées,
jamais n'en génère une nouvelle.

**Ordre migrations → déploiement, jamais l'inverse** : toutes les migrations
de ce projet sont additives et rétrocompatibles (voir §6 — aucune migration
ne supprime ni ne renomme de colonne consommée par l'ancienne version), donc
appliquer les migrations avant de démarrer le nouveau code est toujours sûr,
y compris pendant la fenêtre où l'ancienne version tourne encore contre le
nouveau schéma.

---

## 6. Stratégie de rollback

### 6.1 Rollback applicatif (code)

Sans état côté serveur (§2), revenir à l'image/au build précédent suffit :
redéployer le tag d'image précédent, aucune étape de nettoyage d'état
supplémentaire nécessaire côté application.

### 6.2 Rollback de schéma (migrations)

**Aucune migration de ce projet n'a de `down` destructif fourni ou exécuté**
(convention Prisma standard : `migrate deploy` ne rejoue jamais en arrière).
La stratégie retenue, cohérente avec la contrainte déjà posée pendant le
durcissement de la concurrence (« additive et non destructive, jamais de
perte de données ») :

- **Toutes les migrations existantes sont additives** (nouvelle colonne avec
  valeur par défaut, nouvel index, nouvelle table) — revenir à une version de
  code antérieure pendant qu'une migration plus récente est déjà appliquée
  reste sûr : l'ancien code ignore simplement les colonnes qu'il ne connaît
  pas encore (ex. `version`, `Service.updatedAt`).
- **Si une migration future s'avérait réellement problématique après
  application**, la réparation se fait par une **nouvelle migration
  correctrice** (forward-only), jamais par une suppression manuelle de ligne
  dans `_prisma_migrations` ni par un `DROP COLUMN` improvisé en production —
  exactement la même discipline que celle déjà appliquée cette phase pour
  `Service.updatedAt`/`version` (migrations correctives, jamais de
  modification rétroactive d'une migration déjà committée).
- **Destructive rollback testing interdit sur une base partagée** (contrainte
  explicite déjà respectée cette phase) — toute répétition/validation d'un
  scénario de rollback se fait sur une base jetable dédiée, jamais sur
  `maayan2000`/`maayan2000_test`.

### 6.3 Ce qui NE PEUT PAS être annulé automatiquement

Une mutation de données métier (ex. une promotion supprimée par erreur via
`hardDeletePromotion`) n'est pas couverte par un rollback de déploiement — la
protection contre ce cas est la sauvegarde régulière (§7), pas un mécanisme
de rollback applicatif.

---

## 7. Sauvegarde et restauration

### 7.1 Ce qu'il faut sauvegarder

- **PostgreSQL** (obligatoire, source de vérité unique de toute donnée
  métier : magasins, promotions, traductions, utilisateurs admin, journal
  d'audit, événements analytics).
- **Photos de magasins**, si stockées sur un volume/stockage objet distinct de
  la base (voir §2) — la base ne contient que l'URL, pas le binaire de
  l'image ; un plan de sauvegarde qui ne couvre que PostgreSQL perdrait les
  images sans perdre leur référence, laissant des liens cassés.
- **PAS** l'image Docker elle-même (reconstruite depuis le code source
  versionné, jamais une source de vérité de données).

### 7.2 Méthode recommandée

- **`pg_dump` planifié** (au minimum quotidien, idéalement toutes les
  quelques heures vu le rythme d'édition attendu d'un back-office) vers un
  stockage distinct de l'instance de base elle-même (objet S3-compatible ou
  équivalent), avec rétention (ex. 7 quotidiens + 4 hebdomadaires).
- Si la base est hébergée sur un service managé (RDS, Cloud SQL, etc.) :
  privilégier les **snapshots automatiques natifs de la plateforme**
  (granularité point-in-time souvent supérieure à un simple `pg_dump`
  planifié) en complément, pas nécessairement en remplacement, d'exports
  logiques réguliers.
- Sauvegardes **chiffrées au repos** et testées : une sauvegarde jamais
  restaurée n'est pas une garantie, seulement une intention.

### 7.3 Procédure de restauration (exercice à effectuer avant tout incident réel)

```bash
# Restauration complète sur une instance PostgreSQL vide (jamais directement
# sur l'instance de production existante sans confirmation explicite) :
pg_restore --clean --if-exists -d <nouvelle_instance_ou_instance_vide> <fichier_dump>

# Puis, seulement après vérification manuelle des données restaurées :
# basculer DATABASE_URL de l'application vers cette instance.
```

Comme le rappelle §6.3, une restauration corrige une perte de données, pas un
défaut de code — les deux mécanismes (rollback applicatif et restauration de
sauvegarde) sont indépendants et peuvent être nécessaires simultanément selon
l'incident.

---

## 8. Observabilité, logs, gestion d'erreurs, health check

État déjà en place (Phase 11, ce segment de session) :

- **`/api/health`** (`app/api/health/route.ts`) — `SELECT 1` réel contre
  PostgreSQL, jamais un simple `200 OK` statique qui masquerait une base
  injoignable. Ne fuite jamais le détail de l'erreur (hôte, identifiants) au
  client — seulement `{"status":"degraded"}` + 503 ; le détail complet part
  en `console.error` côté serveur uniquement. **À brancher sur le probe de
  liveness/readiness** de l'orchestrateur cible (Kubernetes `readinessProbe`,
  health check du load balancer, etc.).
- **Error boundaries React** à trois niveaux, chacun avec le périmètre exact
  requis par Next.js 16 App Router :
  - `app/[locale]/error.tsx` — public, localisé (`next-intl`), retry + retour
    aux magasins.
  - `app/admin/error.tsx` — back-office, français uniquement (cohérent avec
    le reste de l'admin, non localisé), retry + retour au tableau de bord.
  - `app/global-error.tsx` — SEUL filet de sécurité racine (remplace out
    layout entier y compris `<html>`/`<body>`, ne dépend d'aucun provider) —
    ne doit normalement jamais s'afficher si les deux boundaries ci-dessus
    fonctionnent, mais couvre le cas où l'erreur survient dans le layout
    racine lui-même.
  - Chaque boundary logue via `console.error` avant l'affichage — jamais
    d'erreur avalée silencieusement.
- **En-têtes de sécurité globaux** (`next.config.ts`) déjà en place — voir
  §9.3 pour ce qui reste volontairement non fait (CSP, HSTS) et pourquoi.

### 8.1 Limite connue et recommandation de suivi (non bloquante)

Les logs actuels sont `console.error`/`console.log` simples — suffisant pour
un déploiement conteneurisé standard où stdout/stderr sont déjà collectés par
la plateforme (Docker logging driver, CloudWatch, Stackdriver, etc.), mais
sans structuration (pas de niveaux, pas de correlation-id par requête). Une
recommandation de suivi non bloquante — pas un correctif de cette phase, voir
`PHASE_11_RAPPORT.md` §"Améliorations non bloquantes" — serait d'introduire
une bibliothèque de logs structurés (ex. `pino`) si le volume de trafic réel
justifie un jour une recherche/agrégation de logs plus fine qu'un `grep` sur
stdout.

---

## 9. Sécurité — état et suivi

### 9.1 Déjà en place (vérifié cette phase)

- En-têtes `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, retrait de `X-Powered-By` (`next.config.ts`).
- RBAC admin (`lib/auth/permissions.ts`) + vérification systématique dans
  chaque Server Action (`requireMutationPermission()`), jamais seulement dans
  le Proxy (voir l'avertissement Next.js 16 cité dans `proxy.ts`).
- Sessions JWT à durée de vie bornée (12h, renouvelée toutes les heures
  d'activité — Phase 11, ce segment).
- Verrouillage optimiste au niveau requête SQL (`version`, Phase 11, voir
  `PHASE_11_RAPPORT.md`) empêchant l'écrasement silencieux concurrent.
- Message d'échec de connexion identique (email inconnu / mot de passe
  invalide / compte désactivé) — pas d'énumération de compte.
- Neutralisation de l'injection de formule CSV à l'export (Phase 10, déjà
  en place, revérifiée non régressée par cette phase — 646/646 tests toujours
  verts).

### 9.2 `npm audit` — état exact

```
5 vulnerabilities (2 moderate, 3 high)
```

Toutes les 5 sont des dépendances **transitives**, jamais du code applicatif
direct :

- `deepmerge-ts` (haute sévérité, épuisement de pile sur un graphe d'objets
  récursif) — via `@prisma/config` → `prisma`. Le correctif proposé par
  `npm audit fix --force` **rétrograderait `prisma` vers `6.12.0`**, une
  régression majeure de version incompatible avec le reste de cette phase
  (le verrouillage optimiste au niveau schéma cible explicitement Prisma 7) —
  non appliqué, conformément à la consigne « ne pas redesigner/casser un
  mécanisme validé sans défaut concret prouvé ».
- `uuid` (sévérité modérée, dépassement de tampon avec un buffer fourni
  explicitement — jamais le cas dans ce projet) — via `exceljs` (utilisé côté
  serveur uniquement, pour l'export Phase 10). Le correctif forcerait
  `exceljs` vers `3.4.0`, également une rétrogradation majeure.

**Aucun des deux n'est exploitable dans l'usage réel de ce projet** (analyse
de code, pas seulement l'avis du scanner) : `deepmerge-ts` n'intervient que
dans le parsing de configuration Prisma au moment du build/CLI (jamais sur
une entrée utilisateur en production), et `exceljs`/`uuid` ne reçoivent
jamais de buffer contrôlé par un utilisateur non authentifié — le générateur
d'export tourne côté serveur, déclenché uniquement par un admin authentifié
avec la permission `export.data`. Documenté ici comme suivi non bloquant :
à réévaluer quand une version non-breaking de `@prisma/config`/`exceljs`
corrige ces avis en amont.

### 9.3 Volontairement non fait cette phase (documenté, jamais improvisé)

- **`Content-Security-Policy`** : absente délibérément (voir le commentaire
  détaillé dans `next.config.ts`). Une CSP mal calibrée sans pouvoir démarrer
  l'application réellement dans ce bac à sable casserait silencieusement la
  carte Google Maps ou les styles Tailwind sans qu'aucun test ne puisse le
  détecter ici. **À calibrer et activer dans un environnement où
  l'application peut réellement être ouverte dans un navigateur** avant mise
  en production — domaines minimums à whitelister : `maps.googleapis.com`,
  `maps.gstatic.com`, le domaine de stockage des photos une fois choisi (§2).
- **`Strict-Transport-Security` (HSTS)** : à poser au niveau du reverse
  proxy/TLS (§2), pas dans `next.config.ts` — l'application ne sait pas
  fiablement si elle est effectivement servie en HTTPS derrière un proxy
  interne en HTTP.
- **Limitation de débit (rate limiting) sur `/admin/login`** : aucune
  protection anti-brute-force dédiée sur la tentative de connexion
  actuellement (au-delà du message d'échec uniforme, §9.1). Une limitation de
  débit correcte a besoin d'un état partagé entre instances (Redis ou
  équivalent, puisque l'application est explicitement sans état — §2) —
  introduire ce genre de nouvelle dépendance d'infrastructure est un
  changement de portée plus large qu'un durcissement ciblé, documenté ici
  comme recommandation de suivi plutôt qu'ajouté à l'improviste dans cette
  phase (voir la consigne explicite : pas de nouvelle fonctionnalité hors
  périmètre pendant ce durcissement).

---

## 10. Ce qui reste À VÉRIFIER en dehors de ce bac à sable

Voir `PHASE_11_RAPPORT.md` pour la liste complète et le verdict — résumé ici :
`prisma generate` réel, démarrage réel de l'application contre une vraie
PostgreSQL, `prisma migrate deploy`/`db seed` réels, et la suite Playwright
permanente n'ont **jamais pu être exécutés** dans cet environnement (réseau
bloqué vers `binaries.prisma.sh`, aucune de ces étapes n'a donc pu être
tentée au-delà de la vérification indépendante par SQL brut déjà documentée
pour les migrations elles-mêmes). Ce sont les véritables portes de sortie
avant toute mise en production réelle.
