# tests/e2e

Suite Playwright **permanente** (Phase 9, §28) — contrairement aux passes de
vérification manuelle des phases précédentes (créées puis intégralement
supprimées après vérification), ce dossier reste dans le dépôt et continue
d'être exécuté aux phases suivantes.

## Contenu

- `admin-full-journey.spec.ts` — parcours admin de bout en bout en 14 étapes
  (connexion → édition d'un magasin existant, traduction et horaires →
  vérification publique → création d'une promotion produit structurée
  29.90/kg → attribution locale → mise en avant → vérifications `BranchCard`
  et fiche magasin → modification du prix → vérification de l'invalidation
  **immédiate** du cache → déconnexion). Voir l'en-tête du fichier pour le
  détail complet.
- `admin-analytics-journey.spec.ts` (Phase 10, §44) — génère des événements
  publics réels (`locator_view`, `branch_view`) → connexion admin → ouvre
  `/admin/analytics` → vérifie les KPI (non filtré pour `locator_view`,
  jamais rattaché à un magasin ; filtré par magasin pour `branch_view`) →
  filtre par magasin → exporte le rapport CSV. Assertions volontairement
  "au moins non nul" plutôt qu'une égalité stricte : les événements
  analytics s'accumulent en base sans jamais être réinitialisés entre deux
  exécutions (§37).
- `admin-import-journey.spec.ts` (Phase 10, §44) — connexion admin → ouvre
  Import/Export → télécharge le template officiel → upload un CSV contenant
  une ligne valide ET une ligne en erreur (ville inconnue) → vérifie que
  l'aperçu détecte l'erreur SANS bloquer la ligne valide (§28) → corrige le
  fichier (ville valide) → confirme l'import (transaction réelle) → vérifie
  le nouveau magasin sur le Store Locator public (FR), horaires importés
  compris. Le CSV est construit en mémoire avec les colonnes exactes du
  template plutôt que copié à la main, pour détecter explicitement tout
  changement de colonnes futur.
- `helpers/auth.ts` — connexion via le vrai formulaire `/admin/login`
  (jamais un contournement de session).

## Prérequis pour exécuter la suite

1. Une base PostgreSQL migrée (`npx prisma migrate deploy`) et seedée
   (`npx prisma db seed`) — la suite s'appuie sur le magasin `jerusalem-ramot`
   (code `JLM-01`) et le compte SUPER_ADMIN de démonstration
   (`admin@maayan2000-demo.local`) créés par `prisma/seed.ts`. Ce seed
   n'insère ces comptes DEMO que hors production (`NODE_ENV !== "production"`,
   §1) — la suite ne peut donc tourner que contre un environnement de
   développement/CI, jamais contre une base de production.
2. Un client Prisma généré (`npx prisma generate`).
3. Un build de l'application (`npm run build`), puis démarrer le serveur soit
   manuellement (`npm run start`), soit automatiquement en exportant
   `E2E_START_SERVER=1` avant `npm run test:e2e` (voir `playwright.config.ts`).

```bash
npx prisma migrate deploy
npx prisma db seed
npm run build
E2E_START_SERVER=1 npm run test:e2e
```

Chromium est déjà préinstallé dans les environnements CI/sandbox de ce
projet (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) — `npx playwright
install` n'est normalement pas nécessaire.

## Statut de vérification (Phase 9 et 10)

Cette suite a été écrite et revue ligne à ligne contre le code réel des
formulaires admin (sélecteurs, libellés, routes), mais n'a **pas** pu être
exécutée de bout en bout dans le bac à sable utilisé pour l'écrire : ni
client Prisma généré (`prisma generate` y est bloqué par le réseau, voir le
rapport final §26), ni instance PostgreSQL démarrée. C'est la même limitation
déjà documentée pour les tests unitaires touchant Prisma, étendue ici à
l'exécution E2E complète — voir le rapport final de la Phase 9 pour le détail.
À exécuter dans un environnement normal (CI ou poste de développement) avant
de s'y fier pour la non-régression.

Les deux fichiers Phase 10 (`admin-analytics-journey.spec.ts`,
`admin-import-journey.spec.ts`) ont été ajoutés dans EXACTEMENT le même bac à
sable, avec EXACTEMENT la même limitation — ni l'un ni l'autre n'a donc pu
être exécuté ici non plus. Voir le rapport final de la Phase 10 pour le
détail exact de ce qui n'a pas pu être exécuté.
