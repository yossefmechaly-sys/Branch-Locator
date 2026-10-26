"use client";

import { useId, useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicReviewsResult } from "@/types/review";
import { cn } from "@/lib/utils";

function RatingStars({ rating, label }: { rating: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.5 align-middle">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star key={value} aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground/40",
          value <= rating && "fill-amber-400 text-amber-500")} />
      ))}
    </span>
  );
}

export function BranchReviews({ slug, initial }: { slug: string; initial: PublicReviewsResult }) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const format = useFormatter();
  const commentHintId = useId();
  const [data, setData] = useState(initial);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState(false);
  const endpoint = `/api/branches/${encodeURIComponent(slug)}/reviews`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: values.get("authorName"), rating, comment: values.get("comment"),
          locale, website: values.get("website"),
        }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? t("rateLimited") : response.status === 400 ? t("invalid") : t("error"));
        return;
      }
      setSubmitted(true);
      form.reset();
      setRating(0);
    } catch { setError(t("error")); }
    finally { setSubmitting(false); }
  }

  async function changePage(page: number) {
    setLoadingPage(true);
    setPageError(false);
    try {
      const response = await fetch(`${endpoint}?page=${page}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load reviews");
      setData(await response.json());
    } catch { setPageError(true); }
    finally { setLoadingPage(false); }
  }

  return (
    <section id="reviews" aria-labelledby="branch-reviews-heading" className="flex scroll-mt-6 flex-col gap-5">
      <div>
        <h2 id="branch-reviews-heading" className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-5">
          {data.summary.total ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Star className="size-8 fill-amber-400 text-amber-500" aria-hidden="true" />
                <div>
                  <p className="text-3xl font-semibold tabular-nums">
                    {format.number(data.summary.averageRating!, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-base font-normal text-muted-foreground"> / 5</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{t("count", { count: data.summary.total })}</p>
                </div>
              </div>
              <p className="text-sm font-medium">{t("satisfaction", { percent: data.summary.satisfiedPercent! })}</p>
              <p className="text-xs text-muted-foreground">{t("method")}</p>
              <ul className="flex flex-col gap-2">
                {data.summary.distribution.map((group) => (
                  <li key={group.rating} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0">
                      <RatingStars rating={group.rating} label={t("stars", { rating: group.rating })} />
                    </span>
                    <progress aria-label={t("stars", { rating: group.rating })} value={group.count}
                      max={data.summary.total} className="h-2 flex-1 accent-amber-500" />
                    <span className="w-8 text-end tabular-nums">{format.number(group.count)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        </div>
        <div className="rounded-xl border p-5">
          {submitted ? <p role="status" className="text-sm leading-relaxed">{t("submitted")}</p> : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <h3 className="font-semibold">{t("write")}</h3>
              <fieldset disabled={submitting} className="flex flex-col gap-4">
                <legend className="mb-2 text-sm font-medium">{t("rating")}</legend>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="relative flex size-11 cursor-pointer items-center justify-center">
                      <input className="peer absolute inset-0 size-full cursor-pointer opacity-0" type="radio" name="rating" value={value}
                        required checked={rating === value} onChange={() => setRating(value)} />
                      <span className="sr-only">{t("stars", { rating: value })}</span>
                      <Star aria-hidden="true" className={cn("pointer-events-none size-9 rounded p-1 text-muted-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                        value <= rating && "fill-amber-400 text-amber-500")} />
                    </label>
                  ))}
                </div>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  {t("name")}
                  <Input name="authorName" autoComplete="nickname" minLength={2} maxLength={80} required />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  {t("comment")}
                  <textarea name="comment" minLength={10} maxLength={2000} rows={4} required
                    aria-describedby={commentHintId}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </label>
                <p id={commentHintId} className="-mt-3 text-xs text-muted-foreground">{t("commentHint")}</p>
                <div hidden aria-hidden="true">
                  <input name="website" tabIndex={-1} autoComplete="off" aria-label="Website" defaultValue="" />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{t("privacy")}</p>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={submitting}>{submitting ? t("sending") : t("send")}</Button>
              </fieldset>
            </form>
          )}
        </div>
      </div>
      {data.reviews.length > 0 && (
        <div aria-busy={loadingPage} className="flex flex-col gap-3">
          <h3 className="font-medium">{t("published")}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.reviews.map((review) => (
              <li key={review.id} className="min-w-0 rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span dir="auto" className="break-words text-sm font-semibold">{review.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(review.createdAt), { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Jerusalem" })}
                  </span>
                </div>
                <p className="mt-2">
                  <RatingStars rating={review.rating} label={t("stars", { rating: review.rating })} />
                </p>
                <p dir="auto" lang={review.locale} className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{review.comment}</p>
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button type="button" variant="outline" size="sm" disabled={loadingPage || data.page <= 1}
                onClick={() => changePage(data.page - 1)}>{t("previous")}</Button>
              <span aria-live="polite" className="text-sm">{t("page", { page: data.page, total: data.totalPages })}</span>
              <Button type="button" variant="outline" size="sm" disabled={loadingPage || data.page >= data.totalPages}
                onClick={() => changePage(data.page + 1)}>{t("next")}</Button>
            </div>
          )}
          {pageError && <p role="alert" className="text-sm text-destructive">{t("error")}</p>}
        </div>
      )}
    </section>
  );
}
