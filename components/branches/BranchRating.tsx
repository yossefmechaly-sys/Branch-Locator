"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { AppLocale } from "@/types/i18n";
import type { ReviewRating } from "@/types/review";

export function BranchRating({ rating, slug, locale }: { rating: ReviewRating; slug: string; locale: AppLocale }) {
  const t = useTranslations("reviews");
  const format = useFormatter();
  const href = `/${locale}/branches/${slug}#reviews`;
  const averageRating = rating.averageRating;
  const linkClass = "mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sm text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";

  if (!rating.total || averageRating === null) {
    return <Link href={href} className={`${linkClass} text-muted-foreground`}>{t("noRatings")}</Link>;
  }

  const average = format.number(averageRating, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <Link href={href} className={linkClass} aria-label={t("averageLabel", { rating: average, count: rating.total })}>
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index} className="relative inline-flex size-4 shrink-0">
            <Star className="size-4 text-muted-foreground/40" />
            <span className="absolute inset-y-0 start-0 overflow-hidden"
              style={{ width: `${Math.max(0, Math.min(1, averageRating - index)) * 100}%` }}>
              <Star className="absolute inset-y-0 start-0 size-4 fill-amber-400 text-amber-500" />
            </span>
          </span>
        ))}
      </span>
      <span dir="ltr" className="font-medium tabular-nums">{average}<span className="text-muted-foreground"> / 5</span></span>
      <span className="text-xs text-muted-foreground">{t("ratingCount", { count: rating.total })}</span>
    </Link>
  );
}
