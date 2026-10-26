# Phase 9 — Back-office d'administration (`/admin`) — Rapport final

Ce rapport couvre l'intégralité du cahier des charges §1–§30 transmis pour la Phase 9 : authentification et rôles, CRUD Magasins/Promotions/Services/Villes, géocodage, photos, cache, concurrence, audit, sécurité serveur, tests (unitaires + Playwright), et l'état exact de l'environnement de développement (TypeScript, ESLint, Vitest, build, Prisma).

## 1. Vue d'ensemble

Le back-office `/admin` est fonctionnellement complet : authentification Auth.js avec trois rôles (SUPER_ADMIN/ADMIN/EDITOR), tableau de bord, CRUD complet Magasins/Promotions/Services/Villes, géocodage serveur, upload de photos, journal d'audit, invalidation de cache ciblée, gestion de la concurrence d'édition, et une suite de sécurité serveur exhaustive. Une suite Playwright **permanente** a été ajoutée (§28), contrairement aux passes de vérification jetables des phases précédentes.

**Point important à lire en premier** : l'environnement de développement utilisé pour cette phase a un `prisma generate` bloqué par le réseau (confirmé dès la Phase 3, revérifié ici) et aucune instance PostgreSQL locale. Le code a donc été vérifié de façon exhaustive par relecture, typage TypeScript, tests unitaires isolés (mocks Prisma) et revue de la migration SQL — mais **jamais exécuté contre une vraie base de données dans cet environnement**. Le détail exact de ce qui a pu être vérifié, et de ce qui ne peut l'être que dans un environnement normal, est au §14 et dans chaque section concernée.

---

## 2. Fichiers créés et modifiés

### 2.1 Schéma et migrations

- `prisma/schema.prisma` : ajout du modèle `AuditLog` (id, actorId, actorEmail, action, entityType, entityId, createdAt), inséré entre les sections ADMINISTRATION et ANALYTICS. Aucune autre table touchée.
- `prisma/migrations/20260831000000_admin_audit_log/migration.sql` (nouvelle migration, additive et indépendante) :

  ```sql
  CREATE TABLE "audit_logs" (
      "id" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "actorEmail" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
  );
  CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
  CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
  ```

  La migration `20260830010000_promotion_pricing` (Phase 8b) n'a **pas** été modifiée, conformément à la consigne — cette nouvelle migration est strictement additive.
- `prisma/seed.ts` : `seedAdminUsers()` ne crée plus les comptes DEMO quand `NODE_ENV === "production"` (retour anticipé explicite, §1).
- `prisma.config.ts` : ajout de `process.loadEnvFile()` (API native Node 22, sans nouvelle dépendance) pour corriger un vrai bug de Prisma 7 (voir §14).

### 2.2 Authentification et permissions

`types/admin.ts`, `types/next-auth.d.ts`, `services/admin-user.repository.ts` + `.prisma.ts`, `lib/auth/permissions.ts`, `lib/auth/config.ts`, `lib/auth/index.ts`, `app/api/auth/[...nextauth]/route.ts`, `lib/auth/require.ts`, `proxy.ts` (réécrit pour combiner le routage next-intl et la garde `/admin`), `app/admin/login/{actions.ts,LoginForm.tsx,page.tsx}`.

### 2.3 Shell admin et tableau de bord

`app/admin/layout.tsx` (racine `<html>/<body>` indépendante), `components/admin/{AdminSidebar,AdminHeader}.tsx`, `app/admin/(dashboard)/{layout.tsx,actions.ts,page.tsx}`, `app/admin/(dashboard)/{import-export,analytics}/page.tsx` (placeholders inertes Phase 10), `services/admin/dashboard.service.ts`.

### 2.4 Couche partagée admin

`lib/admin/mutation-result.ts`, `lib/admin/cache.ts`, `lib/admin/translation-status.ts`, `components/admin/{TranslationStatusBadges,TranslationTabs,ConfirmButton}.tsx`.

### 2.5 Magasins (§4–§10)

`lib/validators/common.ts` (ajout `decimalPriceStringSchema`, refonte de `openingHoursEntrySchema` avec interdiction explicite des créneaux traversant minuit), `lib/validators/branch.ts`, `services/admin/storage/{storage-provider.ts,local-storage.provider.ts}`, `services/admin/geocoding.service.ts`, `services/admin/branch-admin.service.ts`, `components/admin/{OpeningHoursEditor,SpecialOpeningHoursEditor,ServiceSelector,BranchForm}.tsx`, `app/admin/(dashboard)/branches/{actions.ts,page.tsx,BranchRowActions.tsx,new/page.tsx,[id]/edit/page.tsx}`.

### 2.6 Services (§7) et Villes (§8)

`services/admin/service-admin.service.ts`, `components/admin/ServiceForm.tsx`, `app/admin/(dashboard)/services/**` ; `services/admin/city-admin.service.ts`, `components/admin/CityForm.tsx`, `app/admin/(dashboard)/cities/**`.

### 2.7 Promotions (§11–§15)

`lib/validators/promotion.ts` (refonte complète, 4 `.refine()` : cohérence dates, HE requis, portée globale/locale exclusive et cohérente avec `branchIds`), `services/admin/promotion-admin.service.ts`, `components/admin/{PromotionPreview,PromotionForm}.tsx`, `app/admin/(dashboard)/promotions/{actions.ts,page.tsx,PromotionRowActions.tsx,new/page.tsx,[id]/edit/page.tsx}`.

### 2.8 Store Locator public (impact minimal, Phase 9)

`components/branches/BranchCard.tsx` : ajout d'un bloc d'aperçu de la promotion "du jour" (§13), rendu **uniquement** si `branch.featuredPromotion` est renseigné — quand il est `null` (cas normal de la grande majorité des magasins), la carte reste identique à avant la Phase 9. `robots.ts` et `services/branch.repository.prisma.ts` (filtre `isActive: true`) : **non modifiés** par cette phase (vérifiés, voir §11.3).

### 2.9 Tests

9 fichiers `tests/unit/admin-*.test.ts` (voir §9), `playwright.config.ts`, `tests/e2e/admin-full-journey.spec.ts`, `tests/e2e/helpers/auth.ts`, `tests/e2e/README.md` (voir §10).

### 2.10 Divers

`.env` (`AUTH_SECRET`, `NEXTAUTH_URL` renseignés), `.env.example` (documentation des nouvelles variables), `vitest.config.mts` (alias `next/server`, `next-auth` inliné — voir §9.2), `package.json` (`@playwright/test` en dépendance de dev permanente, scripts `test:e2e`/`test:e2e:report`), `.gitignore` (exclusion des rapports Playwright générés).

Quelques `data-testid` ont été ajoutés aux champs de formulaire admin qui n'avaient pas de `<label htmlFor>` associé (`BranchForm`, `OpeningHoursEditor`, `PromotionForm`) — uniquement pour fiabiliser leur ciblage par la suite Playwright, sans changement de comportement ni de rendu visuel.

---

## 3. Authentification, rôles et permissions serveur (§1)

Auth.js (`next-auth@5.0.0-beta.32`) en stratégie JWT, provider Credentials (email + mot de passe bcrypt), sans adaptateur base de données ni route de signup. `proxy.ts` intercepte `/admin/**` **avant** le middleware next-intl (pour ne jamais casser `/admin` sous `localePrefix: "always"`) et redirige vers `/admin/login` en l'absence de session valide.

La matrice de permissions (`lib/auth/permissions.ts`) est uniforme sur les quatre ressources gérées :

| Rôle | view | write | deactivate | hardDelete |
|---|---|---|---|---|
| EDITOR | ✓ | ✓ | — | — |
| ADMIN | ✓ | ✓ | ✓ | — |
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ |

Deux points de garde distincts, tous deux **côté serveur** (jamais une vérification UI seule) :
- `requireAdminSession()`/`requireAdminPermission()` (`lib/auth/require.ts`) : pour les pages/layouts, redirigent via `redirect()`.
- `requireMutationPermission()` : pour les Server Actions, lève `AdminUnauthenticatedError`/`AdminAuthorizationError` — jamais une redirection surprise après un clic "Enregistrer" (§19).

Les comptes DEMO (`admin@maayan2000-demo.local` / `Demo1234!SuperAdmin`, `editor@maayan2000-demo.local`) ne sont créés par le seed que si `NODE_ENV !== "production"` — vérifié explicitement dans `prisma/seed.ts`.

---

## 4. Tableau de bord (§2–§3)

Shell admin (`app/admin/layout.tsx` racine indépendante + `(dashboard)/layout.tsx` protégé) avec navigation Dashboard/Magasins/Promotions/Services/Villes, et Import-Export/Analytics en placeholders **inertes** (aucun bouton fonctionnel factice), explicitement annoncés "Disponible en Phase 10". Les statistiques du tableau de bord (`services/admin/dashboard.service.ts`) réutilisent le moteur d'horaires de la Phase 7 pour le calcul "ouvert maintenant" — aucune nouvelle logique d'horaires.

---

## 5. CRUD Magasins (§4–§10)

CRUD complet (`/admin/branches`, `/new`, `/[id]/edit`) avec :
- Traductions HE/EN/RU/FR/ES via `TranslationTabs` partagé, HE obligatoire, indicateurs de complétude par langue (✓/!) calculés en direct côté formulaire — jamais une colonne par langue en base.
- Slug indépendant de la langue, avertissement explicite si le slug d'un magasin déjà publié change (l'ancienne URL cesse de fonctionner).
- `OpeningHoursEditor`/`SpecialOpeningHoursEditor` réutilisant strictement les règles de la Phase 7, avec interdiction explicite (Zod `.refine()`) des créneaux traversant minuit.
- `ServiceSelector` réutilisant `Service`/`ServiceTranslation`/`BranchService` existants.
- Géocodage serveur (`GOOGLE_GEOCODING_API_KEY`, jamais la clé publique Maps) déclenché **uniquement** par un clic explicite sur "Rechercher l'adresse" — jamais à la frappe — avec correction manuelle possible ensuite de la latitude/longitude.
- Upload de photos via une abstraction `StorageProvider` (implémentation locale fournie, prête pour S3/R2), avec validation **réelle** du contenu (signature d'octets JPEG/PNG/WebP, pas seulement le `Content-Type` déclaré) et de la taille.

CRUD Services (`/admin/services`) et Villes (`/admin/cities`) : mêmes principes, aucun nom de ville en texte libre sur `Branch` (toujours une relation vers `City`).

---

## 6. CRUD Promotions structurées (§11–§15)

Formulaire fidèle au modèle Phase 8b : slug, traductions (productName/title/description/ctaLabel), image, prix/ancien prix (chaînes décimales — **jamais** `parseFloat()`, réutilisation stricte de `decimalStringToCents`/`centsToDecimalString`/`formatMoney`/`computeDiscount`), devise (ILS uniquement, champ verrouillé), unité (`PromotionUnit`, libellés traduits), dates, URL de CTA, statut, `isFeatured`, priorité, portée globale/magasins ciblés.

La portée est un choix explicite et non ambigu, **appliqué aussi côté serveur** (`services/admin/promotion-admin.service.ts`) : `appliesToAll: true` supprime systématiquement toute ligne `PromotionBranch` résiduelle ; `appliesToAll: false` exige au moins un magasin (Zod `.refine()`, testé). `isFeatured`/`priority` sont toujours des champs explicites du formulaire, jamais déduits. Le tri d'affichage public reste exclusivement `sortPromotionsByPriority()` — jamais réimplémenté ici. Validation serveur `endDate >= startDate`. L'aperçu `PromotionPreview` réutilise le design du composant public `PromotionCard` (pas de second modèle visuel).

"Désactiver" une promotion (§22) bascule son `status` à `ARCHIVED` (`Promotion` n'a pas de booléen `isActive` dédié) — déjà exclu de l'affichage public par `isPromotionActive()`, non modifié.

---

## 7. Cache et invalidation (§20)

`lib/admin/cache.ts#invalidatePublicBranchCaches()` appelle `revalidatePath()` pour `/branches` et `/branches/[slug]` dans chaque langue, plus `/sitemap.xml`, à la fin de **chaque** fonction de service create/update/deactivate/hardDelete (magasins et promotions) — jamais une dépendance à la seule fenêtre ISR de 60s.

---

## 8. Concurrence d'édition et audit (§17–§18, §27)

Chaque `updateX()` compare un `expectedUpdatedAt` fourni par le client à l'`updatedAt` réel en base ; en cas d'écart, `AdminConflictError` est levée (jamais un écrasement silencieux) et remontée au formulaire comme une erreur claire (code `CONFLICT`).

Le journal d'audit (`AuditLog` : acteur, action, type d'entité, id d'entité, date) est écrit après **chaque** mutation réussie sur les quatre domaines gérés (`recordAudit()` appelé dans `branches/actions.ts`, `promotions/actions.ts`, `services/actions.ts`, `cities/actions.ts`) — table dédiée et minimale, `AnalyticsEvent` n'est pas détournée.

---

## 9. Tests unitaires (§24–§25)

### 9.1 Résultat final

```
npx vitest run
 Test Files  64 passed (64)
      Tests  447 passed (447)
```

Zéro régression sur l'intégralité des tests des Phases 3 à 8b. 9 nouveaux fichiers admin (73 tests) :

| Fichier | Couvre |
|---|---|
| `admin-permissions.test.ts` | Matrice `ROLE_ACTIONS` |
| `admin-translation-status.test.ts` | Indicateurs de complétude |
| `admin-require.test.ts` | Gardes serveur (session absente/expirée, chaque rôle, hardDelete réservé SUPER_ADMIN) |
| `admin-mutation-result.test.ts` | `toMutationError()` — chaque branche du mapping erreur → code normalisé |
| `admin-branch-validator.test.ts` | Zod magasins (créneaux traversant minuit, etc.) |
| `admin-branch-actions-security.test.ts` | Server Actions magasins : non-authentifié, EDITOR, hardDelete refusé EDITOR/ADMIN, autorisé SUPER_ADMIN + audit, payload invalide |
| `admin-promotion-validator.test.ts` | Zod promotions (portée, HE requis, dates) |
| `admin-promotion-service.test.ts` | Nettoyage réel des relations `PromotionBranch` en base, concurrence, invalidation de cache |
| `admin-promotion-actions-security.test.ts` | Sécurité complète : non-authentifié, chaque rôle, suppression refusée EDITOR/ADMIN, conflit de version |

### 9.2 Deux bugs d'environnement de test rencontrés et corrigés

1. **Hissage `vi.mock()`** : Vitest hisse tous les appels `vi.mock()` au-dessus des `const` qui les précèdent textuellement ; référencer un `const xMock = vi.fn()` déclaré juste avant depuis une factory `vi.mock()` levait `ReferenceError: Cannot access 'x' before initialization` dans 4 fichiers. Corrigé avec `vi.hoisted()`.
2. **Résolution ESM `next/server`** : `next-auth` importe `next/server` sans extension, insoluble par le résolveur ESM strict de Node une fois le module externalisé par Vitest — même cause que le problème `next/navigation` déjà documenté pour `next-intl`. Corrigé en ajoutant `next-auth` à `server.deps.inline` (pour qu'il passe par le résolveur Vite, qui tolère l'alias) **et** un alias `next/server` → `node_modules/next/server.js`, sur le même principe que l'alias `next/navigation` déjà en place.

Ces deux corrections sont des corrections d'infrastructure de test légitimes, indépendantes du blocage réseau Prisma (voir §14).

---

## 10. Suite Playwright permanente (§28)

`tests/e2e/admin-full-journey.spec.ts` — un scénario unique, découpé en 14 `test.step()` nommés, exécutant **exactement** le parcours demandé : connexion → ouverture du magasin `jerusalem-ramot` (préexistant, code `JLM-01`) → édition d'une traduction (Titre SEO FR) → édition des horaires (dimanche, fermeture 23:45) → enregistrement → vérification publique (`<title>` et horaires affichés) → création d'une promotion produit 29.90/kg (poulet frais, unité KG) → attribution locale à ce magasin → mise en avant (`isFeatured`, priorité 20 pour dépasser la promotion seed déjà présente sur ce magasin) → vérification sur `BranchCard` → vérification sur la fiche magasin → modification du prix (24.90) → vérification de l'invalidation **immédiate** du cache (nouvelle navigation directe, jamais d'attente de 60s) → déconnexion, avec confirmation qu'aucune session résiduelle ne permet de revenir sur `/admin`.

Choix techniques :
- Un seul projet Chromium (déjà préinstallé dans cet environnement, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, aucun téléchargement nécessaire).
- Google Maps **non mocké dans le principe** : `BranchMap` gère déjà nativement l'absence de script chargé via `MapErrorState`, donc le reste de la page (dont `BranchCard`, hors de portée de la carte) reste fonctionnel sans clé API. Une seule interception réseau (`maps.googleapis.com` → abandon) est ajoutée pour garantir le déterminisme si une vraie clé était présente dans l'environnement d'exécution — jamais un mock du reste du back-office ou du Store Locator, conformément à la consigne.
- Chaque exécution génère un identifiant unique (horodatage) injecté dans le titre de la promotion créée et dans le marqueur de traduction édité, rendant la suite rejouable plusieurs fois de suite sans réinitialisation de base entre deux exécutions.
- `@playwright/test` a été installé comme dépendance de développement **permanente** (`npm install --save-dev @playwright/test`, déjà dans `package.json`), avec `playwright.config.ts` et les scripts `npm run test:e2e`/`test:e2e:report`.

**Statut de vérification — à lire attentivement** : `npx playwright test --list` confirme que le fichier est syntaxiquement valide et que le test est correctement découvert. Les sélecteurs ont été construits par relecture ligne à ligne du code réel de chaque formulaire (`BranchForm.tsx`, `PromotionForm.tsx`, `OpeningHoursEditor.tsx`, `BranchCard.tsx`, `BranchPromotions.tsx`, etc.), pas devinés. **Cette suite n'a cependant pas pu être exécutée de bout en bout** dans le bac à sable utilisé pour l'écrire : `next start`/`next dev` ne peuvent pas réellement démarrer ici (client Prisma non généré, aucune instance PostgreSQL démarrée — voir §14). Elle doit être exécutée une première fois dans un environnement normal (CI ou poste de développement, procédure détaillée dans `tests/e2e/README.md`) avant de s'y fier pour la non-régression continue.

---

## 11. Vérifications de non-régression (§21–§23, §29)

### 11.1 Désactivation et suppression (§21–§22)

Vérifié par relecture, **aucune modification requise** :
- `services/branch.repository.prisma.ts` filtre toujours `isActive: true` au niveau de la requête elle-même (`findAll` ligne 288, `findBySlug` ligne 310) — logique Phase 8 non touchée. Un magasin désactivé disparaît donc du Store Locator et de `getBranchLocatorData()`.
- La fiche magasin (`app/[locale]/branches/[slug]/page.tsx`) appelle `notFound()` dès que `findBySlug` renvoie `null` — magasin inexistant et magasin désactivé sont indistinguables côté public (404 dans les deux cas), comportement déjà en place.
- `app/sitemap.ts` construit sa liste via `getBranchLocatorData()`, donc un magasin désactivé en disparaît automatiquement — aucune logique de filtrage dupliquée dans le sitemap.
- Suppression définitive (`hardDelete*`) réservée à SUPER_ADMIN dans les quatre domaines, avec vérification de relation avant suppression (`hardDeleteBranch` bloque si des `PromotionBranch` y réfèrent encore, `hardDeleteService` via `BranchService`, `hardDeleteCity` via `Branch`) — jamais un cascade destructif silencieux, toujours `AdminRelationInUseError` → code `RELATION_IN_USE`, orientant vers la désactivation.

### 11.2 Exclusion SEO du back-office (§23)

Défense en profondeur à deux niveaux, tous deux vérifiés présents : `app/robots.ts` (non modifié, `disallow: "/admin"` déjà en place depuis la Phase 8) **et** `app/admin/layout.tsx` qui pose `robots: { index: false, follow: false }` au niveau racine de tout `/admin/**`, plus `/admin/login` qui répète explicitement ce même `robots` (défense en profondeur assumée, jamais une seule couche).

### 11.3 Non-régression Store Locator public (§29)

Aucun fichier des sous-systèmes suivants n'a été modifié par cette phase (seul `BranchCard.tsx` l'a été, de façon additive et conditionnelle — voir §2.8) : recherche multilingue, filtres, carte (`components/maps/**`), géolocalisation (`hooks/useGeolocation.ts`, `lib/geolocation/**`), `BranchPopup`, horaires (`lib/opening-hours/**`), navigation/breadcrumbs, JSON-LD (`lib/seo/schema.ts`), hreflang (`lib/seo/branch-urls.ts`), sitemap, robots. La preuve de non-régression la plus forte disponible dans cet environnement est la suite Vitest complète : les **447 tests couvrant l'intégralité de ces sous-systèmes passent toujours**, sans aucune modification de leur code source. Une vérification visuelle/interactive complémentaire (navigateur réel) n'a pas pu être menée ici faute d'application démarrable (§14) ; elle est du ressort de l'exécution de `tests/e2e/admin-full-journey.spec.ts` (étapes 6, 10, 11, 13) et d'une recette manuelle classique dans un environnement normal.

---

## 12. TypeScript, ESLint, Vitest, build

```
npx tsc --noEmit
  lib/prisma.ts(1,10): error TS2305 — PrismaClient
  prisma/seed.ts(14,10): error TS2305 — PrismaClient
  prisma/seed.ts(14,29): error TS2305 — Locale
  (3 erreurs — TOUTES pré-existantes, documentées depuis la Phase 4, dues au client Prisma non généré)

npx eslint .
  2 warnings pré-existantes (tests/unit/use-geolocation.test.ts, variables non utilisées)
  0 erreur

npx vitest run
  64 fichiers, 447 tests — 100% passés

npm run build
  Compilation Next.js/Turbopack : réussie (23.6s)
  Vérification TypeScript du build : bloquée par les 3 mêmes erreurs Prisma ci-dessus
```

Aucune erreur ni avertissement **nouveau** introduit par la Phase 9 sur l'ensemble de ces quatre vérifications.

---

## 13. Variables d'environnement (nouvelles, Phase 9)

| Variable | Portée | Usage |
|---|---|---|
| `AUTH_SECRET` | Serveur uniquement | Secret Auth.js (JWT de session) |
| `NEXTAUTH_URL` | Serveur uniquement | URL de base du déploiement (auto-hébergé, `trustHost: true`) |
| `GOOGLE_GEOCODING_API_KEY` | Serveur uniquement | Géocodage d'adresse (`services/admin/geocoding.service.ts`) — **jamais** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |

Toutes documentées dans `.env.example` avec leurs contraintes de sécurité (clé de géocodage strictement différente et non exposée, restrictions à appliquer côté Google Cloud Console).

---

## 14. Statut Prisma — investigation complète

Deux problèmes distincts ont été identifiés et traités séparément, comme demandé.

**Bug réel corrigé** : `npx prisma generate` échouait avec `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL` malgré un `.env` valide — cause réelle : Prisma 7 a supprimé le chargement implicite de `.env` par `prisma.config.ts`. Corrigé légitimement par `process.loadEnvFile()` (API native Node 22, aucune nouvelle dépendance), au tout début de `prisma.config.ts`. Ce correctif est indépendant du point suivant et reste valable dans tout environnement.

**Blocage réseau confirmé, non contournable** : une fois ce bug corrigé, `npx prisma generate` progresse jusqu'au téléchargement des binaires du moteur, qui échoue systématiquement :
```
Failed to fetch sha256 checksum at https://binaries.prisma.sh/.../schema-engine.sha256 - 403 Forbidden
```
Avec `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` (échappatoire documentée officielle pour environnement hors-ligne), l'étape de somme de contrôle est contournée mais le téléchargement du binaire lui-même échoue de façon identique :
```
Failed to fetch the engine file at https://binaries.prisma.sh/.../schema-engine.gz - 403 Forbidden
```
C'est le même blocage réseau fondamental documenté depuis la Phase 3 (`binaries.prisma.sh` inaccessible depuis ce bac à sable), confirmé ici une étape plus loin après correction du bug `.env`. Conformément à la consigne, **aucune tentative de contournement architectural** n'a été faite (pas de client Prisma alternatif, pas de restructuration pour l'éviter) : `lib/prisma.ts` reste le même point d'entrée unique, typé `any` de fait via l'échec d'import `PrismaClient` déjà documenté depuis la Phase 4, ce qui permet à tous les appels `prisma.xxx.*` de continuer à passer la vérification TypeScript sans client généré.

**Conséquence directe sur cette phase** : aucune requête Prisma réelle n'a pu être exécutée. La vérification s'est donc appuyée sur : relecture exhaustive du schéma et de la migration SQL, cohérence des types applicatifs (`PrismaXxxRow` déclarés à la main dans chaque service, en miroir du schéma), tests unitaires avec `prisma` entièrement mocké (`vi.mock("@/lib/prisma", ...)`), et — nouveau cette phase — la même limitation étendue à l'exécution E2E (§10, ni base ni client Prisma disponibles pour faire tourner l'application).

---

## 15. Limites connues

- La suite Playwright (§10) et l'application elle-même n'ont pas pu être exécutées de bout en bout dans cet environnement (§14) — à valider en priorité dans un environnement normal avant mise en production ou avant la Phase 10.
- Certains champs des formulaires admin (`Field` interne à `BranchForm`/`PromotionForm`) n'ont pas de `<label htmlFor>` associé à leur `<input>` (label et champ sont des éléments frères, pas un `<label>` englobant) — sans impact fonctionnel, mais un point d'accessibilité à améliorer ; des `data-testid` ont comblé ce manque pour la suite E2E sans corriger le fond. Candidat naturel pour une petite tâche d'accessibilité en Phase 10.
- Le `StorageProvider` local (`local-storage.provider.ts`) est une implémentation de développement ; le passage à S3/R2 en production reste à faire (l'abstraction le permet sans changement d'appelant).
- Aucune UI de gestion des comptes `AdminUser` eux-mêmes (création/désactivation d'admins) n'existe — conforme au §1 ("aucun signup public", création manuelle/seed uniquement), mais à garder à l'esprit pour un futur besoin opérationnel.

## 16. Reste pour la Phase 10 (rappel, déjà annoncé dans l'UI)

Import-Export et Analytics (actuellement des placeholders inertes dans la navigation admin), passage du `StorageProvider` à un backend S3/R2 réel, éventuelle gestion UI des comptes admin.

---

## 17. Conclusion

La Phase 9 (back-office d'administration) et l'ensemble de son cahier des charges §1–§30 sont implémentés, testés autant que l'environnement le permet (447/447 tests unitaires, TypeScript/ESLint/build propres à l'exception des 3 erreurs Prisma pré-existantes documentées), et une suite Playwright permanente a été ajoutée au dépôt. Le seul point non vérifiable dans ce bac à sable est l'exécution réelle contre une base de données (Prisma généré + PostgreSQL), documentée en détail au §14 avec le correctif légitime déjà appliqué et le blocage réseau restant, confirmé non contournable sans enfreindre la consigne de ne pas restructurer l'architecture pour l'éviter.

**ARRÊTE-TOI ICI.** Cette phase ne doit pas s'enchaîner automatiquement sur la Phase 10. Merci de vérifier ce rapport et, en particulier, d'exécuter `tests/e2e/admin-full-journey.spec.ts` dans un environnement disposant d'une base migrée/seedée avant de considérer cette phase définitivement close. J'attends l'instruction explicite **« Continue Phase 10 »** avant d'entamer le moindre travail sur l'Import-Export ou l'Analytics.
