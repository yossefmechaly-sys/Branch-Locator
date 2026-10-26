import Image from "next/image";
import { MapPin } from "lucide-react";

import type { BranchDetail } from "@/types/branch";

import { BranchStatusLive } from "./BranchStatusLive";
import { BranchActions } from "./BranchActions";

export interface BranchHeroProps {
  branch: BranchDetail;
}

/**
 * En-tête de la fiche magasin (Phase 8, §7) — Server Component : seuls
 * `BranchStatusLive` (statut vivant, §8) et `BranchActions` (analytics au
 * clic, §36) sont des Client Components importés ici, le reste (nom, ville,
 * adresse, photo) reste du HTML statique rendu serveur (§3/§33).
 *
 * Volontairement SANS coupure de ligne artificielle ni contenu secondaire
 * (services, horaires complets, promotions...) — ceux-ci vivent dans leurs
 * propres sections plus bas sur la page (§7 : « ne surcharge pas le hero »).
 * Aucune image ne bloque le rendu : `mainImage` absent → repli visuel discret
 * (icône), jamais une image cassée ni un espace vide qui déplace la mise en
 * page (§37 : « photo absente » ne doit jamais faire planter la page).
 */
export function BranchHero({ branch }: BranchHeroProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-[21/9] w-full bg-muted sm:aspect-[3/1]">
        {branch.mainImage ? (
          <Image
            src={branch.mainImage}
            alt={branch.displayName}
            fill
            priority
            unoptimized={branch.mainImage.startsWith("/uploads/branches/")}
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <MapPin className="size-10" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{branch.displayName}</h1>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {branch.city.name}
                {branch.district ? ` · ${branch.district}` : ""} · {branch.address}
              </span>
            </p>
          </div>
        </div>

        <BranchStatusLive openingHours={branch.openingHours} specialHours={branch.specialHours} />

        <BranchActions branch={branch} className="mt-1 flex flex-wrap gap-2" />
      </div>
    </div>
  );
}
