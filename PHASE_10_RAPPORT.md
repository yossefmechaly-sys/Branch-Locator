# Phase 10 — Analytics + Import/Export — Rapport final

Ce rapport couvre l'intégralité du cahier des charges §1–§47 (Parties A–J) transmis pour la Phase 10 : ingestion et tableau de bord Analytics, import CSV/XLSX des magasins, export CSV/XLSX (magasins/promotions/analytics), permissions étendues, sécurité (injection CSV, rate-limit), tests (unitaires + Playwright), et l'état exact de l'environnement de développement (TypeScript, ESLint, Vitest, build, Prisma) — cette dernière limitation étant la même que celle documentée depuis la Phase 3, jamais masquée.

**Note de continuité** : cette session a reçu, en cours de route, un renvoi intégral du cahier des charges de la Phase 9 (déjà livrée et validée dans une session précédente). Sur confirmation explicite de l'utilisateur, ce renvoi a été traité comme un incident (glitch), sans reprendre ni ré-auditer la Phase 9 — le travail s'est poursuivi exactement là où la Phase 10 en était. Ce rapport ne couvre donc que la Phase 10.

---

## 1. Vue d'ensemble

Le module Analytics (`/admin/analytics`) et le module Import/Export (`/admin/import-export`) sont fonctionnellement complets : ingestion d'événements publics anonymisés, tableau de bord filtrable avec KPI/conversions/tableaux/graphiques, export du rapport analytics, import CSV/XLSX des magasins avec aperçu/dry-run et transaction contrôlée, export CSV/XLSX des magasins et des promotions directement réimportable, neutralisation de l'injection de formule CSV (avec inverse exacte pour ne jamais corrompre un numéro de téléphone au cycle export→réimport), et une matrice de permissions étendue à cinq nouvelles actions. Deux nouveaux fichiers Playwright **permanents** ont été ajoutés à la suite existante (§44), jamais en remplacement de `admin-full-journey.spec.ts` (Phase 9, toujours présent et inchangé).

**Point important à lire en premier** (identique à la Phase 9, revérifié ici) : l'environnement de développement utilisé pour cette phase a un `prisma generate` bloqué par le réseau et aucune instance PostgreSQL locale — voir §14 de `PHASE_9_RAPPORT.md` pour l'investigation complète, non répétée ici car strictement inchangée. Toute la couche touchant `prisma` a donc été vérifiée par relecture, typage TypeScript strict et tests unitaires avec `prisma` entièrement mocké — **jamais exécutée contre une vraie base de données dans cet environnement**. Même limitation étendue à l'exécution Playwright (§10 ci-dessous).

---

## 2. Fichiers créés et modifiés

### 2.1 Analytics — ingestion et agrégation

`prisma/schema.prisma` (types d'événements étendus), `lib/analytics/{events.ts,normalize.ts,period.ts,queries.ts,rate-limit.ts,search-classification.ts,session.ts,timezone.ts,track.ts,README.md}`, `lib/analytics/providers/{index.ts,postgres.provider.ts,types.ts}`, `app/api/analytics/event/route.ts`, `services/admin/{analytics.service.ts,analytics.repository.ts}`, `types/analytics.ts`.

### 2.2 Analytics — tableau de bord admin

`app/admin/(dashboard)/analytics/{page.tsx,actions.ts}`, `components/admin/analytics/{KpiCards,ConversionCards,BranchActionsCard,TopBranchesTable,SearchAnalysisSection,PromotionsAnalyticsTable,AnalyticsCharts,AnalyticsFiltersForm,AnalyticsExportButtons,DeltaBadge}.tsx`, `components/admin/analytics/format.ts`. `components/admin/AdminSidebar.tsx` (lien Analytics activé, n'est plus un placeholder inerte), `app/admin/(dashboard)/branches/[id]/edit/page.tsx` (bouton "Voir les statistiques" vers `/admin/analytics?branchId=...`). `package.json` : ajout de `recharts@^3`.

### 2.3 Import magasins

`lib/import/{branch-import.ts,hours-format.ts,errors.ts,pending-imports.ts,README.md}`, `services/admin/import.service.ts`, `app/admin/(dashboard)/import-export/{page.tsx,actions.ts}`, `components/admin/import/BranchImportWizard.tsx`.

### 2.4 Export magasins/promotions/analytics

`lib/csv-cell-escaping.ts` (neutralisation/inverse injection de formule CSV — partagé import ET export), `lib/export/{table.ts,branch-export.ts,promotion-export.ts,analytics-export.ts}`, `services/admin/export.service.ts`, `components/admin/import/ExportPanel.tsx`, `lib/admin/download.ts` (déclenchement du téléchargement navigateur, client uniquement).

### 2.5 Permissions

`lib/auth/permissions.ts` : `AdminAction` étendu à `analytics.read`, `analytics.export`, `import.preview`, `import.execute`, `export.data` — voir la matrice au §6.

### 2.6 Tests

15 nouveaux fichiers `tests/unit/*.test.ts` (voir §9), 2 nouveaux fichiers Playwright permanents `tests/e2e/{admin-analytics-journey,admin-import-journey}.spec.ts` (voir §10), extension de `tests/unit/{admin-permissions,admin-require}.test.ts` existants.

---

## 3. Analytics — ingestion (§4–§8)

Point d'entrée client unique `track(event)` (`lib/analytics/track.ts`) : `navigator.sendBeacon()` en priorité (conçu pour "envoyer et continuer", y compris à l'ouverture d'un nouvel onglet par un clic Waze/WhatsApp), repli sur `fetch(..., { keepalive: true })`. **Aucune exception ne s'échappe jamais de `track()`** (§7, impératif) — une panne analytics ne doit jamais casser le Store Locator ni retarder un clic de navigation. Événements wirés à travers tout le Store Locator (`locator_view`, `branch_view`, `branch_card_click`, `map_marker_click`, recherche/filtres, navigation Waze/Google/Apple Maps, appel, WhatsApp, vue/clic promotion).

Route d'ingestion `POST /api/analytics/event` : validation Zod stricte (rejet des coordonnées hors plage, dépouillement des propriétés inconnues — vérifié par `analytics-validator.test.ts`), rate-limit en mémoire par clé session/IP (`lib/analytics/rate-limit.ts`, §37 : fenêtre fixe de 60s, 60 événements max — **limite documentée, pas un système enterprise distribué**, voir §11 ci-dessous), identifiant de session anonyme à courte durée de vie (§7 — jamais un identifiant permanent).

---

## 4. Analytics — tableau de bord admin (§9–§20)

`/admin/analytics`, protégé par `analytics.read` (§35 : les **trois** rôles, y compris EDITOR — seule action Phase 10 accessible à EDITOR). Filtres URL classiques (formulaire GET, §10) : période prédéfinie (aujourd'hui/7j/30j) ou personnalisée, magasin, ville, langue — état entièrement dans l'URL, jamais un state client qui se perdrait au rechargement.

Cartes KPI (§11) : vues Store Locator, vues fiches magasins, recherches (+ sans résultat), géolocalisation, clics navigation (Waze/Google/Apple Maps), appels, WhatsApp, vues/clics promotions, intentions de visite (mise en avant visuellement). **Aucun libellé ne prétend représenter des ventes ou une fréquentation physique réelle** (§12/§20, impératif) — uniquement de l'interaction et de l'intention mesurables en ligne. Zéros réels affichés quand la base est vide, jamais une valeur fictive (§47).

Comparaison à la période précédente avec delta en pourcentage (§17) — `null` explicite (badge neutre "—") plutôt qu'un "+Infinity%"/"NaN%" quand le dénominateur est nul. Cartes de conversion (ratios recherche→vue, vue→navigation, etc.), tableau des magasins les plus consultés (triable côté client), analyse de recherche (villes/magasins recherchés), tableau des promotions (vues/clics), 4 graphiques en courbes (Recharts v3 — aucun avertissement de dépréciation contrairement à v2) : visites, intention de visite, navigation/téléphone/WhatsApp, engagement promotions. Toute l'agrégation temporelle est consciente du fuseau Jérusalem (`lib/analytics/timezone.ts`, testé par `analytics-timezone.test.ts`) — un "aujourd'hui" cohérent avec l'heure locale du commerce, pas UTC.

Export du rapport filtré (§32, `AnalyticsExportButtons` + `exportAnalyticsAction`) : recalcule le tableau de bord avec **exactement** les mêmes filtres affichés à l'écran via `getAnalyticsDashboard()` — la même fonction que la page elle-même, jamais un second moteur d'agrégation pour l'export.

---

## 5. Import CSV/XLSX magasins (§21–§29)

### 5.1 Moteur de validation unique

`lib/import/branch-import.ts` : **un seul** moteur (`validateImportRow`/`analyzeBranchImportRows`), utilisé **identiquement** par l'aperçu/dry-run et par l'exécution réelle (§25, impératif) — jamais deux moteurs de validation divergents. Chaque ligne candidate est revalidée par **le même schéma Zod** que le formulaire admin (`branchInputSchema`, §27) — jamais un import moins strict que la saisie manuelle.

Formats acceptés : CSV (`papaparse`) et XLSX (`exceljs`, contournement documenté d'une incompatibilité de types `@types/node` entre le `package.json` du projet et celui, imbriqué, d'`exceljs`). Bornes de sécurité upload (§36) : 5 Mo, 2000 lignes max, extensions/MIME contrôlés (`assertUploadIsSafe`) — le MIME déclaré par le navigateur n'est qu'un indice, jamais la seule vérification, le parsing réel rejette tout contenu illisible.

### 5.2 Correspondance et transaction (§26, §28)

Correspondance magasin existant : priorité **absolue** à `branchCode`, puis `slug` comme second identifiant stable — **jamais** un matching sur le nom affiché. Conflit explicite (erreur bloquante, jamais un choix arbitraire silencieux) si `branchCode` et `slug` d'une même ligne pointent vers deux magasins existants différents.

Stratégie de transaction (§28, préférence explicite de l'utilisateur, confirmée par son message le plus récent de cette session) : **validation complète d'abord, puis transaction contrôlée**. Concrètement : (1) toutes les lignes sont validées d'abord, aucune écriture pendant cette phase ; (2) les lignes en erreur sont exclues **individuellement**, jamais bloquantes pour les autres lignes valides du même fichier ; (3) l'écriture des lignes valides se fait dans **une seule** transaction Prisma (`prisma.$transaction`) — soit toutes les lignes valides sont écrites, soit aucune, jamais un état intermédiaire partiellement corrompu. Ni un all-or-nothing sur le fichier entier, ni des écritures ligne par ligne non transactionnelles.

### 5.3 Horaires (§29) — bug trouvé et corrigé

Format d'import : 7 colonnes `hours_dim`…`hours_sam` (dimanche=0…samedi=6, même ordre que `OpeningHoursEditor`), cellule `"HH:mm-HH:mm"` (un créneau), `"HH:mm-HH:mm,HH:mm-HH:mm"` (deux créneaux), ou vide (fermé) — jamais de syntaxe Excel exotique.

**Bug identifié et corrigé pendant cette phase** : la première version d'`executeBranchImport` vidait et recréait systématiquement les horaires de tout magasin mis à jour, **même quand le fichier importé ne contenait aucune colonne `hours_*`** — ce qui contredisait l'avertissement déjà affiché à l'aperçu ("les horaires existants ne seront pas modifiés") et effaçait silencieusement des horaires que l'utilisateur n'avait jamais eu l'intention de toucher. Corrigé : `headerHasHoursColumns` est calculé une fois par exécution et conditionne à la fois `tx.branchOpeningHours.deleteMany()` et la présence du champ `openingHours` dans la mise à jour — les deux sont **omis** ensemble quand le fichier n'a aucune colonne d'horaires. Couvert explicitement par `tests/unit/import-service.test.ts` (voir §9).

### 5.4 Workflow admin

`BranchImportWizard.tsx` : Upload → "Analyser" (aperçu/dry-run, aucune écriture) → tableau détaillé ligne par ligne (statut Nouveau/Modification/Erreur/Ignorée, erreurs/avertissements) → "Confirmer l'import" (désactivé si aucune ligne valide, ou si le rôle ne permet pas `import.execute`) → résultat (compteurs créés/mis à jour). Template CSV officiel téléchargeable, colonnes identiques au moteur de validation (jamais un exemple divergent maintenu à la main).

État entre aperçu et confirmation : `lib/import/pending-imports.ts`, store en mémoire à usage unique (`importId`, TTL 20 minutes, consommé une seule fois) — **limitation documentée** : non partagé entre plusieurs instances (même principe déjà accepté pour le rate-limit analytics, §37). L'exécution revalide les **mêmes** lignes contre l'état **actuel** de la base (villes/services/magasins fraîchement chargés), jamais un instantané périmé de l'aperçu.

### 5.5 Import promotions — différé sciemment (§21, portée secondaire)

Conformément à la permission explicite du cahier des charges ("si périmètre trop large, prioriser import magasins et documenter import promotions comme étape secondaire") et à la priorité #1 du message le plus récent de l'utilisateur ("Finish the branch CSV/XLSX import"), **l'import CSV/XLSX des promotions n'a pas été implémenté dans cette phase**. L'import magasins, en revanche, est livré complet (parsing, validation, aperçu, transaction, UI, tests). Décision consciente, pas un oubli.

---

## 6. Export CSV/XLSX (§31–§34) et permissions (§35)

### 6.1 Moteur de rendu partagé

`lib/export/table.ts` : `ExportColumn<T>`/`rowsToCsv`/`buildXlsxWorkbook`, **un seul** moteur utilisé identiquement pour les trois exports (magasins, promotions, analytics) — même philosophie que le moteur d'import unique (§5.1). Difficulté TypeScript rencontrée et résolue : la contravariance stricte sur `ExportColumn<T>.value` empêche d'assembler directement un classeur XLSX à plusieurs feuilles de types de ligne différents ; résolue par une fonction `sheet<T>()` qui effectue **un seul** effacement de type contrôlé et documenté, plutôt que des `as any` dispersés à chaque appel.

### 6.2 Export magasins (§31)

Colonnes **identiques**, mêmes clés et même ordre, à `BRANCH_IMPORT_COLUMNS` — un fichier exporté est directement réimportable sans modification, pour mettre à jour les mêmes magasins (correspondance par `branchCode` inchangée). Vérifié par un test d'intégration bout en bout (`export-branch.test.ts`) : export → CSV → `parseImportFile` → `analyzeBranchImportRows` → `action: "update"`, `matchedBranchId` correct, zéro erreur.

### 6.3 Export promotions (§33) et analytics (§32)

Export promotions : colonnes structurées miroir du formulaire admin. Export analytics : CSV = tableau des magasins les plus consultés (format plat, limitation documentée — un CSV ne peut pas représenter un tableau de bord multi-sections) ; XLSX = classeur à 6 feuilles (KPI, Magasins, Villes recherchées, Magasins recherchés, Promotions, Série quotidienne) — le rapport complet, sans la limitation du format plat.

### 6.4 Sécurité injection de formule CSV (§36) — export ET import

`lib/csv-cell-escaping.ts` : neutralisation standard OWASP — toute cellule commençant par `=`, `+`, `-`, `@` (ainsi que tabulation/retour chariot) est préfixée d'une apostrophe droite `'`, appliquée systématiquement à **chaque** export (CSV et XLSX, défense en profondeur).

**Bug critique identifié et corrigé pendant cette phase** : la neutralisation seule cassait le cycle export→réimport pour toute donnée légitime commençant par l'un de ces caractères — notamment un numéro de téléphone `"+972-2-1111111"`, qui devenait `"'+972-2-1111111"` après export et échouait la validation du téléphone au réimport. Corrigé par `unescapeCsvFormulaCell()`, l'inverse **exact** de la neutralisation (retire une apostrophe de tête uniquement quand elle est immédiatement suivie d'un des préfixes dangereux — sûr car aucun champ métier de ce projet ne commence légitimement par une apostrophe), appliquée par le parseur d'import aux deux formats (CSV et XLSX). Le module a été déplacé de `lib/export/csv-security.ts` vers `lib/csv-cell-escaping.ts` (racine `lib/`) pour éviter une dépendance de `lib/import` vers `lib/export` — les deux couches le partagent désormais à parité. Ce bug a été détecté par le test d'intégration bout en bout du §6.2, pas par un test unitaire isolé de la neutralisation seule — voir §17 (leçon retenue).

Encodage (§42) : BOM UTF-8 explicite en tête de chaque export CSV pour qu'Excel Windows affiche correctement l'hébreu/le russe plutôt que du charabia (devinette d'encodage sinon incorrecte sans BOM).

### 6.5 Matrice de permissions (§35)

| Action | EDITOR | ADMIN | SUPER_ADMIN |
|---|---|---|---|
| `analytics.read` | ✓ | ✓ | ✓ |
| `analytics.export` | — | ✓ | ✓ |
| `import.preview` | — | ✓ | ✓ |
| `import.execute` | — | ✓ | ✓ |
| `export.data` | — | ✓ | ✓ |

Import/export n'est **pas** réservé à SUPER_ADMIN (contrairement à `hardDelete`, Phase 9) — ADMIN peut exécuter un import réel et exporter. EDITOR conserve un accès lecture seule aux KPI (`analytics.read`), cohérent avec son rôle éditorial, mais aucune capacité d'export ni d'import. Vérifié à la fois en isolation (`admin-permissions.test.ts`, extension) et au niveau des gardes serveur réellement appelées par les pages/Server Actions (`admin-require.test.ts`, extension — voir §9).

---

## 7. Tests unitaires (§41)

### 7.1 Résultat final

```
npx vitest run
 Test Files  79 passed (79)
      Tests  611 passed (611)
```

Zéro régression sur l'intégralité des tests des Phases 3 à 9 (447 tests déjà présents, tous toujours verts). 15 nouveaux fichiers, 164 nouveaux tests :

| Fichier | Couvre |
|---|---|
| `analytics-normalize.test.ts` | `normalizeAnalyticsEvent` |
| `analytics-period.test.ts` | `resolvePeriodRange`, clés de période valides |
| `analytics-queries.test.ts` | Fonctions pures d'agrégation (`lib/analytics/queries.ts`) |
| `analytics-search-classification.test.ts` | Classification des recherches (ville/magasin) |
| `analytics-timezone.test.ts` | Conversions fuseau Jérusalem |
| `analytics-validator.test.ts` | Schéma Zod d'ingestion (rejet coordonnées, dépouillement propriétés inconnues) |
| `csv-cell-escaping.test.ts` | Neutralisation ET inverse exacte (round-trip, chaque préfixe dangereux) |
| `export-table.test.ts` | Moteur de rendu partagé CSV/XLSX |
| `export-branch.test.ts` | **Test d'intégration bout en bout** export→CSV→réimport (a détecté le bug §6.4) |
| `import-hours-format.test.ts` | `parseHoursCell`/`formatHoursCell` (inverses exactes) |
| `import-branch-validate.test.ts` | `validateImportRow`/`analyzeBranchImportRows` (correspondance, conflits, doublons) |
| `import-parse-file.test.ts` | `parseImportFile` (CSV/XLSX, bornes de taille/lignes) |
| `import-pending-imports.test.ts` | Store en mémoire à usage unique, TTL |
| `import-service.test.ts` | `executeBranchImport` avec `prisma` mocké : transaction unique, création/mise à jour, **préservation des horaires quand le fichier n'a aucune colonne `hours_*`** (§5.3), audit, invalidation de cache |
| `admin-import-export-actions-security.test.ts` | Server Actions import/export/analytics-export : non-authentifié, EDITOR refusé, ADMIN/SUPER_ADMIN autorisés — pour les cinq nouvelles actions |

Extensions (fichiers Phase 9 déjà existants, non recréés) : `admin-permissions.test.ts` (les 5 nouvelles actions × 3 rôles), `admin-require.test.ts` (mêmes gardes serveur que ci-dessus, mais au niveau `requireMutationPermission`/`requireAdminPermission` réellement appelées par le code, pas seulement `hasPermission()` en isolation).

### 7.2 Pattern de mock Prisma (§41)

Même convention que `admin-promotion-service.test.ts` (Phase 9) : `vi.hoisted()` + `vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))`, avec un mock de `prisma.$transaction` qui **invoque réellement** le callback reçu contre un mock `tx` — permet d'observer les appels `tx.branch.create`/`tx.branch.update`/`tx.branchOpeningHours.deleteMany` faits **à l'intérieur** de la transaction, sans jamais toucher une vraie base. C'est ce test (`import-service.test.ts`) qui a permis de vérifier la correction du bug de préservation des horaires (§5.3) — impossible à couvrir par les seuls tests purs de `validateImportRow`, qui ne touchent jamais Prisma.

---

## 8. Suite Playwright permanente (§44)

Deux nouveaux fichiers, ajoutés à `tests/e2e/` **en plus** de `admin-full-journey.spec.ts` (Phase 9, non supprimé ni modifié) :

- `admin-analytics-journey.spec.ts` : génère des événements publics réels (`locator_view`, `branch_view`) → connexion admin → ouvre `/admin/analytics` → vérifie le KPI "Vues Store Locator" (**non filtré** — `locator_view` n'est jamais rattaché à un magasin précis, contrairement à `branch_view`) → filtre par magasin (`jerusalem-ramot`) → vérifie le KPI "Vues fiches magasins" (filtré, car `branch_view` porte bien un `branchId`) → exporte le rapport CSV (`page.waitForEvent("download")`).
- `admin-import-journey.spec.ts` : connexion admin → ouvre Import/Export → télécharge le template officiel → upload un CSV construit en mémoire avec **exactement** les colonnes du template (une ligne valide + une ligne en erreur, ville inconnue) → vérifie que l'aperçu détecte l'erreur **sans bloquer** la ligne valide (badges Nouveau/Erreur, message d'erreur explicite) → corrige le fichier (ville valide) et relance l'aperçu → confirme l'import (transaction réelle) → vérifie le nouveau magasin sur le Store Locator public, horaires importés compris.

Choix techniques cohérents avec `admin-full-journey.spec.ts` : identifiants uniques par horodatage (idempotence, rejouable sans réinitialiser la base), interception réseau `maps.googleapis.com` uniquement (jamais un mock du reste de l'application), assertions "au moins non nul" plutôt qu'une égalité stricte pour les compteurs analytics (les événements s'accumulent sans jamais être réinitialisés entre deux exécutions, §37).

**Statut de vérification — identique à la Phase 9** : ces deux fichiers ont été écrits et revus ligne à ligne contre le code réel (sélecteurs, libellés, routes, structure exacte des composants `KpiCards`/`BranchImportWizard`/`ExportPanel`), mais n'ont **pas** pu être exécutés dans ce bac à sable — même blocage Prisma/PostgreSQL que documenté depuis la Phase 3 (voir §1). `tests/e2e/README.md` a été mis à jour pour documenter ces deux fichiers et rappeler explicitement cette limitation à leur sujet. À exécuter dans un environnement normal avant de s'y fier pour la non-régression.

---

## 9. Vérifications de non-régression

Aucun fichier des sous-systèmes suivants (Store Locator public, Phases 4–8b ; back-office CRUD, Phase 9) n'a été modifié par cette phase, à l'exception des trois ajouts additifs déjà documentés au §2 (lien Analytics activé dans `AdminSidebar`, bouton "Voir les statistiques" sur la page d'édition magasin, `recharts` en dépendance). La preuve de non-régression la plus forte disponible dans cet environnement reste la suite Vitest complète : les 447 tests des Phases 3 à 9 passent toujours, sans aucune modification de leur code source, aux côtés des 164 nouveaux tests Phase 10.

---

## 10. TypeScript, ESLint, Vitest, build

```
npx tsc --noEmit
  lib/prisma.ts(1,10): error TS2305 — PrismaClient
  prisma/seed.ts(14,10): error TS2305 — PrismaClient
  prisma/seed.ts(14,29): error TS2305 — Locale
  (3 erreurs — TOUTES pré-existantes, documentées depuis la Phase 4, dues au client Prisma non généré)

npx eslint .
  4 avertissements pré-existants (aucun nouveau) :
    - BranchLocator.tsx : directive eslint-disable inutile
    - lib/analytics/providers/postgres.provider.ts : import non utilisé
    - tests/unit/use-geolocation.test.ts : 2 variables non utilisées
  0 erreur

npx vitest run
  79 fichiers, 611 tests — 100% passés

npm run build
  Compilation Next.js/Turbopack : réussie
  Vérification TypeScript du build : bloquée par les 3 mêmes erreurs Prisma ci-dessus (identique à la Phase 9)
```

Aucune erreur ni avertissement **nouveau** introduit par la Phase 10 sur l'ensemble de ces quatre vérifications — les 3 erreurs TypeScript et les 4 avertissements ESLint sont tous pré-existants, inchangés depuis avant cette phase.

---

## 11. Limites connues

- La suite Playwright complète (Phase 9 + les deux fichiers Phase 10, §8) et l'application elle-même n'ont pas pu être exécutées de bout en bout dans cet environnement (même blocage Prisma/PostgreSQL documenté depuis la Phase 3) — à valider en priorité dans un environnement normal avant mise en production ou avant la Phase 11.
- Le rate-limit d'ingestion analytics (§37) et le store d'imports en attente (§5.4) sont tous deux en mémoire locale au processus — limitation documentée et acceptée pour l'échelle actuelle du projet, jamais un système enterprise distribué (Redis, etc.) : dans un déploiement multi-instance, la limite/le TTL réels dépendent du nombre d'instances.
- L'export analytics CSV est un format plat (tableau des magasins les plus consultés uniquement) — un CSV ne peut pas représenter fidèlement un tableau de bord multi-sections ; l'export XLSX (6 feuilles) porte le rapport complet.
- L'import CSV/XLSX des promotions n'a pas été implémenté (§5.5, décision consciente et documentée, permise explicitement par le cahier des charges).
- L'export analytics et l'export promotions n'ont pas de test unitaire dédié au niveau `services/admin/export.service.ts` lui-même (contrairement à l'export magasins, couvert par un test d'intégration bout en bout) — couverts indirectement par les tests du moteur de rendu partagé (`export-table.test.ts`) et par la sécurité des Server Actions (`admin-import-export-actions-security.test.ts`), mais pas par un test spécifique aux colonnes/au contenu de ces deux exports.

---

## 12. Décisions et écarts explicites par rapport au cahier des charges

Ces deux points ont été des choix conscients, pas des omissions :

1. **Import promotions différé** (§5.5) — permis explicitement par le cahier des charges lui-même ("si périmètre trop large, prioriser import magasins et documenter import promotions comme étape secondaire") et par la priorité #1 du message le plus récent de l'utilisateur.
2. **Stratégie de transaction import** (§5.2) — l'interprétation retenue de "validation complète d'abord, puis transaction contrôlée" (une seule transaction pour l'ensemble des lignes valides, lignes en erreur exclues individuellement) reflète la préférence explicite de l'utilisateur exprimée dans une session précédente, reconfirmée au démarrage de cette session — documentée en détail au §5.2 pour qu'elle reste vérifiable.

---

## 13. Conclusion

La Phase 10 (Analytics + Import/Export) et l'ensemble de son cahier des charges §1–§47 sont implémentés, testés autant que l'environnement le permet (611/611 tests unitaires dont 164 nouveaux, TypeScript/ESLint/build propres à l'exception des 3 erreurs Prisma pré-existantes documentées depuis la Phase 4), et deux nouveaux fichiers Playwright permanents ont été ajoutés à la suite existante. Deux bugs réels ont été trouvés et corrigés pendant cette phase (préservation des horaires à l'import quand le fichier n'a aucune colonne d'horaires ; corruption des numéros de téléphone au cycle export→réimport par la neutralisation d'injection CSV), tous deux découverts par des tests d'intégration écrits spécifiquement pour exercer le comportement de bout en bout plutôt que des unités isolées — voir §5.3 et §6.4. Le seul point non vérifiable dans ce bac à sable reste l'exécution réelle contre une base de données (Prisma généré + PostgreSQL) et, par extension, l'exécution Playwright — documenté en détail dans `PHASE_9_RAPPORT.md` §14 et rappelé ici où il s'applique.

**ARRÊTE-TOI ICI.** Cette phase ne doit pas s'enchaîner automatiquement sur la Phase 11. Merci de vérifier ce rapport et, en particulier, d'exécuter l'intégralité de `tests/e2e/` (les trois fichiers) dans un environnement disposant d'une base migrée/seedée avant de considérer cette phase définitivement close. J'attends l'instruction explicite **« Continue Phase 11 »** avant d'entamer le moindre travail sur la phase suivante.
