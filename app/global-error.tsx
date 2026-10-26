"use client";

import { useEffect } from "react";

/**
 * Filet de dernier recours (Phase 11, §16 — revue error-boundary) — le SEUL
 * fichier `global-error.tsx` autorisé par Next.js, à la RACINE de `app/`
 * (jamais `app/[locale]/global-error.tsx` ni `app/admin/global-error.tsx` :
 * ce fichier remplace le layout racine ENTIER quand celui-ci lève lui-même,
 * donc il doit fournir son propre `<html>/<body>` — ni `app/[locale]/layout.tsx`
 * ni `app/admin/layout.tsx` n'est garanti d'avoir pu s'exécuter à ce stade).
 *
 * Se déclenche uniquement si l'erreur remonte AU-DESSUS de
 * `app/[locale]/error.tsx` ou `app/admin/error.tsx` (ex. le layout racine
 * lui-même lève) — un cas déjà rarissime vu que ces deux layouts ne font que
 * de la composition simple (voir leurs commentaires respectifs) sans logique
 * métier susceptible d'échouer.
 *
 * Volontairement SANS dépendance à `next-intl`/`NextIntlClientProvider` (ni
 * l'un ni l'autre layout n'est garanti actif ici) et sans classes Tailwind
 * (le CSS applicatif pourrait ne pas être fiable dans ce scénario limite) —
 * uniquement du style inline, un message neutre en anglais (langue la plus
 * largement comprise, faute de pouvoir déterminer la locale ici) et un lien
 * de rechargement brut.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app global-error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#111827",
          background: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "28rem", margin: 0 }}>
          The application failed to load. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            border: "none",
            background: "#111827",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </body>
    </html>
  );
}
