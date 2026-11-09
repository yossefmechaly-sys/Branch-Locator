"use client";

import { useState } from "react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BranchGalleryProps {
  images: { imageUrl: string; alt: string | null }[];
  branchName: string;
}

/** A single gallery owns the main photo, thumbnails and unavailable-image fallback. */
export function BranchGallery({ images, branchName }: BranchGalleryProps) {
  const t = useTranslations("branchDetail.gallery");
  const format = useFormatter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const activeImage = images[activeIndex] ?? images[0];
  const markFailed = (url: string) => setFailedUrls((current) => new Set(current).add(url));

  return (
    <section aria-labelledby="branch-gallery-heading" className="branch-detail-gallery branch-detail-card">
      <h2 id="branch-gallery-heading" className="sr-only">{t("sectionTitle")}</h2>
      <div className="branch-detail-gallery-stage">
        {activeImage && !failedUrls.has(activeImage.imageUrl) ? (
          <Image src={activeImage.imageUrl} alt={activeImage.alt || t("mainImageAlt", { name: branchName })}
            fill priority={activeIndex === 0} unoptimized={activeImage.imageUrl.startsWith("/uploads/branches/")}
            sizes="(min-width: 1440px) 850px, (min-width: 1024px) 60vw, 100vw"
            className="object-cover" onError={() => markFailed(activeImage.imageUrl)} />
        ) : (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-5 text-center text-muted-foreground">
            <ImageOff className="size-10" aria-hidden="true" />
            <p className="text-sm">{t("noImage")}</p>
          </div>
        )}
        {activeImage && <span className="branch-detail-photo-count" dir="ltr" aria-live="polite"
          aria-label={t("position", { current: activeIndex + 1, total: images.length })}>
          {format.number(activeIndex + 1)} / {format.number(images.length)}
        </span>}
      </div>
      {images.length > 1 && (
        <div className="branch-detail-thumbnails">
          {images.map((image, index) => (
            <button key={image.imageUrl + index} type="button" onClick={() => setActiveIndex(index)}
              aria-current={index === activeIndex}
              aria-label={t("thumbnailAlt", { name: branchName, index: index + 1 })}
              className={cn("relative shrink-0 overflow-hidden rounded-xl border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                index === activeIndex ? "border-primary" : "border-transparent hover:border-muted-foreground/40")}>
              {failedUrls.has(image.imageUrl) ? <ImageOff className="mx-auto size-5 text-muted-foreground" aria-hidden="true" /> :
                <Image src={image.imageUrl} alt="" fill sizes="96px" className="object-cover"
                  unoptimized={image.imageUrl.startsWith("/uploads/branches/")}
                  onError={() => markFailed(image.imageUrl)} />}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
