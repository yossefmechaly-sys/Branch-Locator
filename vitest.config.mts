import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // jsdom (Phase 5) : les tests carte ont besoin de `window`/`document`
    // (chargeur de script, composants React) ; les tests purs de la Phase 4
    // (horaires, recherche, filtres) tournent aussi bien sous jsdom que sous
    // "node" — pas de config séparée par fichier.
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    // `@testing-library/react` nettoie automatiquement le DOM après chaque
    // test (`cleanup()`) seulement s'il détecte un `afterEach` global — sans
    // ça, les rendus de tests successifs s'accumulent dans le même document.
    globals: true,
    server: {
      deps: {
        // `lib/i18n/navigation.ts` (`createNavigation`, next-intl) importe
        // `next/navigation` SANS extension — valide pour un bundler
        // (webpack/Vite), mais Vitest EXTERNALISE `next-intl` par défaut
        // (chargé par le résolveur ESM strict de Node, qui exige l'extension
        // explicite) plutôt que de le faire passer par le résolveur de Vite
        // (qui tolère l'absence d'extension, via l'alias ci-dessous). Aucun
        // test n'avait jusqu'ici importé de composant passant par ce wrapper
        // de navigation (`Breadcrumbs`, `NearbyBranches`, Phase 8) — ce n'est
        // donc pas une régression, seulement la première fois que ce chemin
        // de résolution est exercé.
        //
        // Phase 9 : même problème pour `next-auth` (importé transitivement
        // par `lib/auth/config.ts` → `lib/auth/require.ts` → à peu près
        // toute la couche de mutation admin), qui importe `next/server`
        // sans extension. Tant que `next-auth` reste externalisé (résolu
        // par le résolveur ESM natif de Node, qui ignore l'alias Vite
        // ci-dessous), l'alias seul ne suffit pas — il faut aussi que
        // `next-auth` passe par le résolveur de Vite, d'où son ajout ici.
        inline: [/next-intl/, /next-auth/],
      },
    },
  },
  resolve: {
    alias: {
      "@": dirname,
      "next/navigation": path.join(dirname, "node_modules/next/navigation.js"),
      // Phase 9 : `next-auth` (`lib/auth/config.ts`) importe `next/server`
      // sans extension — même problème de résolution ESM stricte que
      // `next/navigation` ci-dessus. Actif uniquement une fois `next-auth`
      // inliné (voir `server.deps.inline` ci-dessus), sinon Node résout ce
      // spécificateur nativement et ignore cet alias.
      "next/server": path.join(dirname, "node_modules/next/server.js"),
    },
  },
});
