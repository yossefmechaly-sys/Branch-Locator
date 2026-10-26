"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BranchGalleryProps {
  images: { imageUrl: string; alt: string | null }[];
  branchName: string;
}

/**
 * Galerie photo (Phase 8, §13) — Client Component : la bascule miniature ↔
 * grande image est un état purement visuel local (`useState`), aucune donnée
 * réseau ni traduction dynamique n'en dépend — un Server Component ne peut
 * pas porter cet état interactif (§3).
 *
 * Volontairement DISTINCTE de `BranchHero` (§7) : le hero montre toujours la
 * photo principale (`mainImage`, souvent dupliquée en première position ici)
 * de façon statique et prioritaire au chargement ; cette galerie est une
 * section secondaire plus bas sur la page, non bloquante, où seule l'image
 * actuellement affichée est chargée en priorité (`priority` uniquement sur
 * l'image active) — les autres restent en chargement paresseux standard de
 * `next/image` (§33 : ne pas précharger des images hors écran).
 */
export function BranchGallery({ images, branchName }: BranchGalleryProps) {
  const t = useTranslations("branchDetail.gallery");
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <section aria-labelledby="branch-gallery-heading" className="flex flex-col gap-3">
        <h2 id="branch-gallery-heading" className="text-lg font-semibold tracking-tight">
          {t("sectionTitle")}
        </h2>
        <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border bg-muted text-muted-foreground">
          <ImageOff className="size-8" aria-hidden="true" />
          <p className="text-sm">{t("noImage")}</p>
        </div>
      </section>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <section aria-labelledby="branch-gallery-heading" className="flex flex-col gap-3">
      <h2 id="branch-gallery-heading" className="text-lg font-semibold tracking-tight">
        {t("sectionTitle")}
      </h2>

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
        <Image
          src={activeImage.imageUrl}
          alt={activeImage.alt || t("mainImageAlt", { name: branchName })}
          fill
          priority={activeIndex === 0}
          unoptimized={activeImage.imageUrl.startsWith("/uploads/branches/")}
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <button
              key={image.imageUrl + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-current={index === activeIndex}
              aria-label={t("thumbnailAlt", { name: branchName, index: index + 1 })}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                index === activeIndex ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
              )}
            >
              <Image
                src={image.imageUrl}
                alt=""
                fill
                unoptimized={image.imageUrl.startsWith("/uploads/branches/")}
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
