import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "blob-report/**",
  ]),
  {
    // RTL/LTR (architecture Phase 1, §5) : les classes Tailwind physiques
    // (ml-/mr-/pl-/pr-/left-/right-/text-left/text-right/float-left/float-right/
    // rounded-l-/rounded-r-/border-l-/border-r-) sont interdites au profit des
    // propriétés logiques (ms-/me-/ps-/pe-/start-/end-). Vérification best-effort
    // sur les littéraux `className=""` ; les classes composées dynamiquement
    // (via `cn()`/`clsx()`) restent à revoir manuellement en revue de code.
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)(-?ml-|-?mr-|-?pl-|-?pr-|left-|right-|text-left\\b|text-right\\b|float-left\\b|float-right\\b|rounded-l-|rounded-r-|border-l-|border-r-)/]",
          message:
            "Classe Tailwind physique détectée : utiliser l'équivalent logique (ms-/me-/ps-/pe-/start-/end-) — voir l'architecture RTL/LTR, Phase 1 §5.",
        },
      ],
    },
  },
]);

export default eslintConfig;
