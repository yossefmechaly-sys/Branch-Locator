import { NextResponse } from "next/server";

import { branchListQuerySchema } from "@/lib/validators/branch";
import { getBranchLocatorData } from "@/services/branch.service";

/**
 * `GET /api/branches?locale=…&city=…&service=…&isOpenNow=…&q=…`
 *
 * Seul point d'entrée HTTP pour les données du Store Locator côté client
 * (`hooks/useBranches.ts`). Le rendu serveur initial (`app/[locale]/branches/page.tsx`)
 * appelle directement `getBranchLocatorData()` pour éviter un aller-retour réseau
 * superflu au premier chargement — les deux chemins passent par la même fonction,
 * donc jamais de logique dupliquée.
 *
 * Validation Zod systématique (`branchListQuerySchema`, `lib/validators/branch.ts`) :
 * jamais de confiance dans les paramètres client, même si le client est notre
 * propre frontend (cahier des charges §58 — sécurité).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const parseResult = branchListQuerySchema.safeParse({
    locale: url.searchParams.get("locale") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    service: url.searchParams.get("service") ?? undefined,
    isOpenNow: url.searchParams.get("isOpenNow") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "INVALID_QUERY", issues: parseResult.error.issues },
      { status: 400 }
    );
  }

  const { locale, city, service, isOpenNow, q } = parseResult.data;

  try {
    const data = await getBranchLocatorData({
      locale,
      citySlug: city ?? null,
      serviceSlug: service ?? null,
      isOpenNow: isOpenNow ?? false,
      q,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/branches]", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
