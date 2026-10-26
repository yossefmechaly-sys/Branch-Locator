import Link from "next/link";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth/require";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { adminReviewMessages } from "@/lib/admin-i18n/reviews";
import { listAdminReviews } from "@/services/review.service";
import { REVIEW_STATUSES } from "@/types/review";
import { reviewPageSchema } from "@/lib/validators/review";
import { ReviewModerationActions } from "@/components/admin/ReviewModerationActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Reviews · Branch Locator Admin" };

export default async function AdminReviewsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireAdminPermission("view");
  const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const branchId = typeof params.branchId === "string" ? params.branchId.slice(0, 100) : undefined;
  const parsedStatus = z.enum(REVIEW_STATUSES).safeParse(params.status ?? "PENDING");
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const parsedPage = reviewPageSchema.safeParse(params.page);
  const page = parsedPage.success ? parsedPage.data : 1;
  const [data, branches] = await Promise.all([
    listAdminReviews({ branchId: branchId || undefined, status, page }),
    prisma.branch.findMany({ orderBy: { branchCode: "asc" }, select: {
      id: true, branchCode: true, translations: { select: { locale: true, displayName: true } },
    } }),
  ]);
  const t = adminReviewMessages[locale];
  const canModerate = hasPermission(user.role, "reviews.moderate");
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Asia/Jerusalem" });
  const nameFor = (branch: typeof branches[number]) => branch.translations.find((entry) => entry.locale === locale)?.displayName
    ?? branch.translations.find((entry) => entry.locale === "he")?.displayName ?? branch.branchCode;
  const pageUrl = (nextPage: number) => `/admin/reviews?${new URLSearchParams({ branchId: branchId || "", status: status || "ALL", page: String(nextPage) })}`;
  const selectClass = "h-9 rounded-md border bg-background px-3 text-sm";
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold">{t.title}</h1><p className="mt-1 text-sm text-muted-foreground">{t.description}</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-4"><p className="text-sm text-muted-foreground">{t.waiting}</p><p className="mt-2 text-2xl font-semibold">{number.format(data.pending)}</p></div>
        <div className="rounded-lg border bg-background p-4"><p className="text-sm text-muted-foreground">{t.average}</p><p className="mt-2 text-2xl font-semibold">{data.summary.averageRating === null ? "—" : `${number.format(data.summary.averageRating)} / 5`}</p></div>
        <div className="rounded-lg border bg-background p-4"><p className="text-sm text-muted-foreground">{t.satisfaction}</p><p className="mt-2 text-2xl font-semibold">{data.summary.satisfiedPercent === null ? "—" : `${number.format(data.summary.satisfiedPercent)} %`}</p><p className="text-xs text-muted-foreground">{t.method}</p></div>
      </div>
      <form className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">{t.branch}
          <select className={selectClass} name="branchId" defaultValue={branchId || ""}>
            <option value="">{t.allBranches}</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.branchCode} · {nameFor(branch)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">{t.status}
          <select className={selectClass} name="status" defaultValue={status || "ALL"}>
            <option value="ALL">{t.allStatuses}</option>
            {REVIEW_STATUSES.map((value) => <option key={value} value={value}>{t.statuses[value]}</option>)}
          </select>
        </label>
        <Button type="submit" variant="outline">{t.filter}</Button>
      </form>
      <p className="text-sm text-muted-foreground">{number.format(data.total)} {t.count}</p>
      {data.reviews.length === 0 ? <p className="rounded-lg border p-6 text-sm">{t.empty}</p> : (
        <ul className="flex flex-col gap-3">
          {data.reviews.map((review) => <li key={review.id} className="flex flex-col gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/admin/branches/${review.branch.id}/edit`} className="font-medium underline">{review.branch.branchCode} · {nameFor(review.branch)}</Link>
                <Badge variant={review.status === "APPROVED" ? "success" : "secondary"}>{t.statuses[review.status]}</Badge>
              </div>
              <p className="mt-3 flex flex-wrap gap-3 text-sm"><span dir="auto" className="break-words font-medium">{review.authorName}</span><span>{number.format(review.rating)} / 5</span><time className="text-muted-foreground" dateTime={review.createdAt.toISOString()}>{date.format(review.createdAt)}</time></p>
              <p dir="auto" lang={review.locale} className="mt-2 whitespace-pre-wrap break-words text-sm">{review.comment}</p>
              <Link className="mt-3 inline-block text-xs underline" href={`/${locale}/branches/${review.branch.slug}#reviews`}>{t.viewBranch}</Link>
            </div>
            {canModerate && <ReviewModerationActions id={review.id} version={review.version} status={review.status} />}
          </li>)}
        </ul>
      )}
      {data.totalPages > 1 && <nav aria-label={t.page} className="flex items-center justify-center gap-3">
        {page > 1 && <Link href={pageUrl(page - 1)} className="text-sm underline">{t.previous}</Link>}
        <span className="text-sm">{t.page} {number.format(page)} / {number.format(data.totalPages)}</span>
        {page < data.totalPages && <Link href={pageUrl(page + 1)} className="text-sm underline">{t.next}</Link>}
      </nav>}
    </div>
  );
}
