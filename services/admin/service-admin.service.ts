import { prisma } from "@/lib/prisma";
import { locales, type AppLocale } from "@/types/i18n";
import type { ServiceInput } from "@/lib/validators/service";
import { AdminConflictError, AdminNotFoundError, AdminRelationInUseError } from "@/lib/admin/mutation-result";
import { computeTranslationStatus, type TranslationStatus } from "@/lib/admin/translation-status";
import { invalidatePublicBranchCaches } from "@/lib/admin/cache";

/** Service métier CRUD Services (Phase 9, §7) — réutilise `Service`/
 * `ServiceTranslation`/`BranchService` du schéma Phase 3, aucun second
 * modèle. */
interface PrismaServiceAdminRow {
  id: string;
  slug: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
  // Phase 11, §16ter — SEULE source de vérité pour la concurrence optimiste
  // (§17), voir le commentaire détaillé sur `Service.version` dans le schéma.
  version: number;
  translations: { locale: string; name: string; description: string | null }[];
  _count?: { branches: number };
}

export interface AdminServiceListItem {
  id: string;
  slug: string;
  icon: string;
  name: string;
  isActive: boolean;
  branchCount: number;
  updatedAt: string;
  translationStatus: TranslationStatus;
}

export interface AdminServiceDetail {
  id: string;
  slug: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  /** Phase 11, §16ter — jeton de concurrence opaque, jamais affiché ni
   * modifiable (voir `ServiceForm.tsx`). */
  version: number;
  translations: { locale: AppLocale; name: string; description: string }[];
}

function mapListItem(row: PrismaServiceAdminRow): AdminServiceListItem {
  const he = row.translations.find((t) => t.locale === "he") ?? row.translations[0];
  return {
    id: row.id,
    slug: row.slug,
    icon: row.icon,
    name: he?.name ?? row.slug,
    isActive: row.isActive,
    branchCount: row._count?.branches ?? 0,
    updatedAt: row.updatedAt.toISOString(),
    translationStatus: computeTranslationStatus(row.translations, (t) => t.name.trim().length > 0),
  };
}

function mapDetail(row: PrismaServiceAdminRow): AdminServiceDetail {
  return {
    id: row.id,
    slug: row.slug,
    icon: row.icon,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
    translations: locales.map((locale) => {
      const t = row.translations.find((entry) => entry.locale === locale);
      return { locale, name: t?.name ?? "", description: t?.description ?? "" };
    }),
  };
}

export async function listAdminServices(): Promise<AdminServiceListItem[]> {
  const rows = (await prisma.service.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { branches: true } } },
  })) as PrismaServiceAdminRow[];
  return rows.map(mapListItem);
}

export async function getAdminServiceById(id: string): Promise<AdminServiceDetail | null> {
  const row = (await prisma.service.findUnique({
    where: { id },
    include: { translations: true },
  })) as PrismaServiceAdminRow | null;
  return row ? mapDetail(row) : null;
}

export async function createService(input: ServiceInput): Promise<{ id: string }> {
  const created = (await prisma.service.create({
    data: {
      slug: input.slug,
      icon: input.icon,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      translations: {
        create: input.translations.map((t) => ({ locale: t.locale, name: t.name, description: t.description })),
      },
    },
  })) as { id: string };
  invalidatePublicBranchCaches();
  return { id: created.id };
}

export async function updateService(id: string, expectedVersion: number, input: ServiceInput): Promise<void> {
  // Pré-vérification rapide (404 explicite) HORS transaction — jamais la
  // source de vérité pour la concurrence.
  const existing = (await prisma.service.findUnique({ where: { id } })) as { version: number } | null;
  if (!existing) throw new AdminNotFoundError("Service introuvable");
  if (existing.version !== expectedVersion) {
    throw new AdminConflictError("Ce service a été modifié entre-temps par un autre utilisateur");
  }

  // Phase 11, §16ter (durcissement de la concurrence optimiste — voir le
  // commentaire détaillé équivalent dans `city-admin.service.ts#updateCity`,
  // même mécanisme exact) : verrou RÉEL = `updateMany` gardé ci-dessous,
  // `WHERE id = ? AND version = expectedVersion`, `version: { increment: 1 }`
  // atomique dans le même `UPDATE`. `updatedAt` (affichage uniquement)
  // partage le même `now` que la mise à jour finale — un seul changement de
  // version cohérent par mutation réussie.
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const guarded = await tx.service.updateMany({
      where: { id, version: expectedVersion },
      data: { version: { increment: 1 }, updatedAt: now },
    });
    if (guarded.count === 0) {
      throw new AdminConflictError("Ce service a été modifié entre-temps par un autre utilisateur");
    }

    await tx.serviceTranslation.deleteMany({ where: { serviceId: id } });
    await tx.service.update({
      where: { id },
      data: {
        slug: input.slug,
        icon: input.icon,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        updatedAt: now,
        translations: {
          create: input.translations.map((t) => ({ locale: t.locale, name: t.name, description: t.description })),
        },
      },
    });
  });
  invalidatePublicBranchCaches();
}

export async function setServiceActive(id: string, isActive: boolean): Promise<void> {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new AdminNotFoundError("Service introuvable");
  await prisma.service.update({ where: { id }, data: { isActive } });
  invalidatePublicBranchCaches();
}

/** §7 : « préférer désactivation à suppression lorsqu'un service est
 * utilisé » — la suppression définitive est REFUSÉE (jamais un cascade
 * silencieux qui viderait `BranchService` pour tous les magasins) tant qu'au
 * moins un magasin utilise encore ce service. */
export async function hardDeleteService(id: string): Promise<void> {
  const branchCount = await prisma.branchService.count({ where: { serviceId: id } });
  if (branchCount > 0) {
    throw new AdminRelationInUseError(
      `Impossible de supprimer : ${branchCount} magasin(s) utilisent encore ce service. Désactivez-le plutôt.`
    );
  }
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new AdminNotFoundError("Service introuvable");

  // Phase 11, §16 — regroupées en une seule transaction (même correctif que
  // `updateService` ci-dessus).
  await prisma.$transaction(async (tx) => {
    await tx.serviceTranslation.deleteMany({ where: { serviceId: id } });
    await tx.service.delete({ where: { id } });
  });
  invalidatePublicBranchCaches();
}

export async function listServiceOptions(): Promise<{ id: string; slug: string; icon: string; label: string; isActive: boolean }[]> {
  const rows = (await prisma.service.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, icon: true, isActive: true, translations: { where: { locale: "he" } } },
  })) as { id: string; slug: string; icon: string; isActive: boolean; translations: { name: string }[] }[];
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    icon: row.icon,
    label: row.translations[0]?.name ?? row.slug,
    isActive: row.isActive,
  }));
}
