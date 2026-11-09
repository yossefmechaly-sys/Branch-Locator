"use client";

import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/types/i18n";
import type { ReviewRating } from "@/types/review";
import { BranchRating } from "./BranchRating";

export function BranchReviewOverview({ rating, slug }: { rating: ReviewRating; slug: string }) {
  const t = useTranslations("reviews");
  const tDesign = useTranslations("branchDetail.design");
  const locale = useLocale() as AppLocale;
  return (
    <section className="branch-detail-card branch-detail-review-overview" aria-labelledby="branch-review-overview-heading">
      <h2 id="branch-review-overview-heading" className="branch-detail-section-heading">
        <MessageCircle aria-hidden="true" />{tDesign("reviewsTitle")}
      </h2>
      <div className="branch-detail-overview-rating">
        <BranchRating rating={rating} slug={slug} locale={locale} />
      </div>
      <div className="branch-detail-review-invitation">
        <p>{tDesign("reviewPrompt")}</p>
        <Button asChild variant="outline" className="mt-3 gap-2">
          <a href="#reviews"><Pencil className="size-4" aria-hidden="true" />{t("write")}</a>
        </Button>
      </div>
    </section>
  );
}
