import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";

import type { BranchDetail } from "@/types/branch";
import type { AppLocale } from "@/types/i18n";
import type { ReviewRating } from "@/types/review";

import { BranchStatusLive } from "./BranchStatusLive";
import { BranchActions } from "./BranchActions";
import { BranchRating } from "./BranchRating";
import { StorefrontIllustration } from "./StorefrontIllustration";

export interface BranchHeroProps {
  branch: BranchDetail;
  rating?: ReviewRating;
}

/** Branch identity and live actions; photography belongs to the gallery. */
export function BranchHero({ branch, rating }: BranchHeroProps) {
  const locale = useLocale() as AppLocale;
  return (
    <>
      <header className="branch-detail-hero">
        <div className="branch-detail-container branch-detail-hero-inner">
          <div className="branch-detail-hero-copy">
            <h1>{branch.displayName}</h1>
            <p className="mt-3 flex items-start gap-2">
              <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>{branch.city.name}{branch.district ? ` · ${branch.district}` : ""} · {branch.address}</span>
            </p>
          </div>
          <div className="branch-detail-illustration"><StorefrontIllustration /></div>
        </div>
      </header>
      <div className="branch-detail-container">
        <div className="branch-detail-actionbar">
          <BranchStatusLive openingHours={branch.openingHours} specialHours={branch.specialHours} saturdayEveningHours={branch.saturdayEveningHours}
            className="branch-detail-status" />
          {rating && <div className="branch-detail-header-rating">
            <BranchRating rating={rating} slug={branch.slug} locale={locale} />
          </div>}
          <BranchActions branch={branch} className="branch-detail-actions flex flex-wrap gap-2" />
        </div>
      </div>
    </>
  );
}
