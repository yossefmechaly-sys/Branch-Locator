"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/**
 * Périmètre erreur (Phase 11, §16 — revue error-boundary) — segment
 * `/[locale]/**` (site public).
 *
 * AVANT cette phase, AUCUN `error.tsx` n'existait nulle part dans
 * l'application (public ET admin) : une exception non interceptée pendant le
 * rendu d'un Server ou Client Component tombait sur l'écran d'erreur
 * générique de Next.js, jamais dans la langue/le style de l'app. Les points
 * de défaillance déjà identifiés (échec de chargement Google Maps, échec
 * d'ingestion analytics, image cassée) sont indépendamment blindés en amont
 * (voir `lib/maps/providers/google/loader.ts`, `lib/analytics/track.ts`,
 * `BranchHero`/`BranchGallery`/`PromotionCard`) et n'atteignent donc jamais
 * cette limite — ce filet est pour tout le reste (bug de rendu imprévu dans
 * `BranchList`/`BranchCard`, etc.), qui n'avait auparavant AUCUNE limite.
 *
 * Rendu À L'INTÉRIEUR de `app/[locale]/layout.tsx` (qui fournit déjà
 * `NextIntlClientProvider`) : `useTranslations` fonctionne donc normalement
 * ici, contrairement à `app/global-error.tsx` (qui, lui, remplace le layout
 * racine entier et ne peut donc dépendre d'aucun provider).
 *
 * Next.js impose qu'un `error.tsx` soit un Client Component (props
 * `error`/`reset` fournies par le framework, pas de données chargées ici).
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorBoundary");
  const tCommon = useTranslations("common");

  useEffect(() => {
    // Visibilité minimale côté serveur (Phase 11, §16bis — observabilité) :
    // jamais de mot de passe/secret ici, uniquement l'erreur elle-même (déjà
    // le pattern utilisé par `lib/admin/mutation-result.ts`/les routes API).
    console.error("[app error boundary /[locale]]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <div className="flex gap-3">
        <Button onClick={reset}>{tCommon("retry")}</Button>
        <Button variant="outline" asChild>
          <Link href="/branches">{t("cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
