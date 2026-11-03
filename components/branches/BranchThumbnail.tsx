"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/types/i18n";

export function BranchThumbnail({ src, name, slug, locale }: {
  src: string | null; name: string; slug: string; locale: AppLocale;
}) {
  const t = useTranslations("branches");
  const [failed, setFailed] = useState(false);
  const image = src?.trim();
  const hasImage = image && !failed && (image.startsWith("/") || /^https?:\/\//.test(image));

  return (
    <Link href={`/${locale}/branches/${slug}`} data-slot="branch-thumbnail"
      aria-label={`${t("viewPage")} – ${name}`}
      className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-gradient-to-br from-muted to-muted/40 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-24">
      {hasImage ? (
        <Image src={image} alt={name} fill sizes="(min-width: 640px) 96px, 80px"
          loading="lazy"
          unoptimized={image.startsWith("/uploads/branches/") || !image.startsWith("/") || image.startsWith("//")}
          onError={() => setFailed(true)}
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
      ) : <Store className="size-8 text-muted-foreground/50" strokeWidth={1.25} aria-hidden="true" />}
    </Link>
  );
}
