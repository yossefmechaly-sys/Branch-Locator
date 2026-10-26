import { prisma } from "@/lib/prisma";
import { locales, type AppLocale } from "@/types/i18n";
import type { PromotionCurrency, PromotionStatus, PromotionUnit } from "@/types/promotion";
import type { PromotionInput } from "@/lib/validators/promotion";
import { AdminConflictError, AdminNotFoundError } from "@/lib/admin/mutation-result";
import { computeTranslationStatus, type TranslationStatus } from "@/lib/admin/translation-status";
import { invalidatePublicBranchCaches } from "@/lib/admin/cache";

/**
 * Service métier CRUD Promotions (Phase 9, §11-§15) — SEULE couche qui parle
 * à Prisma pour ce domaine ; les Server Actions (`app/admin/(dashboard)/promotions/actions.ts`)
 * n'appellent QUE ces fonctions, jamais `prisma` directement (§19).
 *
 * Le modèle Promotion structuré livré en Phase 8b est ici la SEULE source de
 * vérité (aucun second modèle promotionnel recréé) — `price`/`originalPrice`
 * transitent comme chaînes décimales de bout en bout, jamais `Number(...)`
 * ni `parseFloat(...)` (§11, impératif).
 */

interface PrismaPromotionAdminRow {
  id: string;
  slug: string;
  image: string | null;
  price: { toString(): string } | null;
  originalPrice: { toString(): string } | null;
  currency: string;
  unit: string;
  startDate: Date;
  endDate: Date;
  url: string | null;
  status: string;
  appliesToAll: boolean;
  isFeatured: boolean;
  priority: number;
  isDemo: boolean;
  updatedAt: Date;
  // Phase 11, §16ter — SEULE source de vérité pour la concurrence optimiste
  // (§17), voir le commentaire détaillé sur `Promotion.version` dans le schéma.
  version: number;
  translations: {
    locale: string;
    productName: string | null;
    title: string;
    description: string | null;
    ctaLabel: string | null;
  }[];
  branches: { branchId: string }[];
}

export interface AdminPromotionListItem {
  id: string;
  slug: string;
  title: string;
  status: PromotionStatus;
  appliesToAll: boolean;
  branchCount: number;
  isFeatured: boolean;
  priority: number;
  price: string | null;
  currency: PromotionCurrency;
  unit: PromotionUnit;
  startDate: string;
  endDate: string;
  updatedAt: string;
  translationStatus: TranslationStatus;
}

export interface AdminPromotionDetail {
  id: string;
  slug: string;
  image: string | null;
  price: string | null;
  originalPrice: string | null;
  currency: PromotionCurrency;
  unit: PromotionUnit;
  startDate: string;
  endDate: string;
  url: string | null;
  status: PromotionStatus;
  appliesToAll: boolean;
  branchIds: string[];
  isFeatured: boolean;
  priority: number;
  isDemo: boolean;
  updatedAt: string;
  /** Phase 11, §16ter — jeton de concurrence opaque, jamais affiché ni
   * modifiable (voir `PromotionForm.tsx`). */
  version: number;
  translations: {
    locale: AppLocale;
    productName: string | null;
    title: string;
    description: string | null;
    ctaLabel: string | null;
  }[];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapListItem(row: PrismaPromotionAdminRow): AdminPromotionListItem {
  const heTranslation = row.translations.find((t) => t.locale === "he") ?? row.translations[0];
  return {
    id: row.id,
    slug: row.slug,
    title: heTranslation?.title ?? row.slug,
    status: row.status as PromotionStatus,
    appliesToAll: row.appliesToAll,
    branchCount: row.branches.length,
    isFeatured: row.isFeatured,
    priority: row.priority,
    price: row.price ? row.price.toString() : null,
    currency: row.currency as PromotionCurrency,
    unit: row.unit as PromotionUnit,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    updatedAt: row.updatedAt.toISOString(),
    translationStatus: computeTranslationStatus(row.translations, (t) => t.title.trim().length > 0),
  };
}

function mapDetail(row: PrismaPromotionAdminRow): AdminPromotionDetail {
  return {
    id: row.id,
    slug: row.slug,
    image: row.image,
    price: row.price ? row.price.toString() : null,
    originalPrice: row.originalPrice ? row.originalPrice.toString() : null,
    currency: row.currency as PromotionCurrency,
    unit: row.unit as PromotionUnit,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    url: row.url,
    status: row.status as PromotionStatus,
    appliesToAll: row.appliesToAll,
    branchIds: row.branches.map((b) => b.branchId),
    isFeatured: row.isFeatured,
    priority: row.priority,
    isDemo: row.isDemo,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
    translations: locales.map((locale) => {
      const existing = row.translations.find((t) => t.locale === locale);
      return (
        existing ?? { locale, productName: null, title: "", description: null, ctaLabel: null }
      ) as AdminPromotionDetail["translations"][number];
    }),
  };
}

const PROMOTION_INCLUDE = { translations: true, branches: true } as const;

export async function listAdminPromotions(): Promise<AdminPromotionListItem[]> {
  const rows = (await prisma.promotion.findMany({
    orderBy: [{ isFeatured: "desc" }, { priority: "desc" }, { updatedAt: "desc" }],
    include: PROMOTION_INCLUDE,
  })) as PrismaPromotionAdminRow[];
  return rows.map(mapListItem);
}

export async function getAdminPromotionById(id: string): Promise<AdminPromotionDetail | null> {
  const row = (await prisma.promotion.findUnique({
    where: { id },
    include: PROMOTION_INCLUDE,
  })) as PrismaPromotionAdminRow | null;
  return row ? mapDetail(row) : null;
}

/** Résout, pour l'invalidation de cache (§20), les slugs de magasins réellement
 * concernés par cette promotion — TOUS les magasins actifs si `appliesToAll`,
 * sinon uniquement les magasins explicitement sélectionnés. */
async function resolveAffectedBranchSlugs(appliesToAll: boolean, branchIds: string[]): Promise<string[]> {
  if (appliesToAll) {
    const branches = (await prisma.branch.findMany({
      where: { isActive: true },
      select: { slug: true },
    })) as { slug: string }[];
    return branches.map((b) => b.slug);
  }
  if (branchIds.length === 0) return [];
  const branches = (await prisma.branch.findMany({
    where: { id: { in: branchIds } },
    select: { slug: true },
  })) as { slug: string }[];
  return branches.map((b) => b.slug);
}

function branchRelationInput(input: PromotionInput) {
  // §12, impératif : `appliesToAll: true` ne doit JAMAIS laisser subsister de
  // ligne `PromotionBranch` — on ignore délibérément `branchIds` dans ce cas,
  // plutôt que de faire confiance à ce que le client ait bien vidé le tableau.
  if (input.appliesToAll) return undefined;
  return { create: input.branchIds.map((branchId) => ({ branchId })) };
}

export async function createPromotion(input: PromotionInput): Promise<{ id: string }> {
  const created = (await prisma.promotion.create({
    data: {
      slug: input.slug,
      image: input.image,
      price: input.price,
      originalPrice: input.originalPrice,
      currency: input.currency,
      unit: input.unit,
      startDate: input.startDate,
      endDate: input.endDate,
      url: input.url,
      status: input.status,
      appliesToAll: input.appliesToAll,
      isFeatured: input.isFeatured,
      priority: input.priority,
      // Créée depuis le back-office : jamais marquée `isDemo` (réservé aux
      // données du seed, §22 Phase 8 — « ne jamais présenter une promotion
      // fictive comme une vraie offre »).
      isDemo: false,
      translations: {
        create: input.translations.map((t) => ({
          locale: t.locale,
          productName: t.productName,
          title: t.title,
          description: t.description,
          ctaLabel: t.ctaLabel,
        })),
      },
      branches: branchRelationInput(input),
    },
  })) as { id: string };

  const affectedSlugs = await resolveAffectedBranchSlugs(input.appliesToAll, input.branchIds);
  invalidatePublicBranchCaches(affectedSlugs);

  return { id: created.id };
}

export async function updatePromotion(
  id: string,
  expectedVersion: number,
  input: PromotionInput
): Promise<void> {
  const existing = (await prisma.promotion.findUnique({ where: { id } })) as { version: number } | null;
  if (!existing) throw new AdminNotFoundError("Promotion introuvable");
  // Concurrence d'édition (§17) : pré-vérification rapide HORS transaction,
  // jamais la source de vérité (voir le verrou atomique ci-dessous) — jamais
  // un écrasement silencieux.
  if (existing.version !== expectedVersion) {
    throw new AdminConflictError("Cette promotion a été modifiée entre-temps par un autre utilisateur");
  }

  // Traductions et liens magasin : purge + recréation (même stratégie que
  // `prisma/seed.ts#seedPromotions()`, plus simple et plus sûre qu'un diff
  // fin pour un formulaire qui renvoie toujours l'état complet).
  //
  // Phase 11, §16 (audit transactions) — CORRECTIF : mêmes 2 suppressions +
  // 1 mise à jour regroupées en une seule transaction (voir le commentaire
  // équivalent dans `branch-admin.service.ts#updateBranch` — même défaut,
  // même correction : un crash entre la purge et la mise à jour laissait sinon
  // une promotion réelle sans traduction ni ciblage magasin).
  //
  // Phase 11, §16ter (durcissement de la concurrence optimiste — voir le
  // commentaire détaillé équivalent dans `branch-admin.service.ts#updateBranch`,
  // même mécanisme exact) : verrou RÉEL = `updateMany` gardé ci-dessous,
  // `WHERE id = ? AND version = expectedVersion`, `version: { increment: 1 }`
  // atomique dans le même `UPDATE`. `updatedAt` (affichage uniquement)
  // partage le même `now` que la mise à jour finale.
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const guarded = await tx.promotion.updateMany({
      where: { id, version: expectedVersion },
      data: { version: { increment: 1 }, updatedAt: now },
    });
    if (guarded.count === 0) {
      throw new AdminConflictError("Cette promotion a été modifiée entre-temps par un autre utilisateur");
    }

    await tx.promotionTranslation.deleteMany({ where: { promotionId: id } });
    await tx.promotionBranch.deleteMany({ where: { promotionId: id } });

    await tx.promotion.update({
      where: { id },
      data: {
        slug: input.slug,
        image: input.image,
        price: input.price,
        originalPrice: input.originalPrice,
        currency: input.currency,
        unit: input.unit,
        startDate: input.startDate,
        endDate: input.endDate,
        url: input.url,
        status: input.status,
        appliesToAll: input.appliesToAll,
        isFeatured: input.isFeatured,
        priority: input.priority,
        updatedAt: now,
        translations: {
          create: input.translations.map((t) => ({
            locale: t.locale,
            productName: t.productName,
            title: t.title,
            description: t.description,
            ctaLabel: t.ctaLabel,
          })),
        },
        branches: branchRelationInput(input),
      },
    });
  });

  const affectedSlugs = await resolveAffectedBranchSlugs(input.appliesToAll, input.branchIds);
  invalidatePublicBranchCaches(affectedSlugs);
}

/** Soft-delete (§22) — une promotion n'a pas de champ `isActive` dédié :
 * archiver (statut `ARCHIVED`) EST son équivalent « désactivé/retiré », déjà
 * exclu de tout affichage public par `isPromotionActive()` (§14, jamais
 * dupliqué ici). */
export async function archivePromotion(id: string): Promise<void> {
  const existing = (await prisma.promotion.findUnique({
    where: { id },
    include: { branches: true },
  })) as { appliesToAll: boolean; branches: { branchId: string }[] } | null;
  if (!existing) throw new AdminNotFoundError("Promotion introuvable");

  await prisma.promotion.update({ where: { id }, data: { status: "ARCHIVED" } });

  const affectedSlugs = await resolveAffectedBranchSlugs(
    existing.appliesToAll,
    existing.branches.map((b) => b.branchId)
  );
  invalidatePublicBranchCaches(affectedSlugs);
}

/** Suppression définitive (§22) — appelant responsable de vérifier la
 * permission `hardDelete` (SUPER_ADMIN uniquement) AVANT d'appeler cette
 * fonction ; aucune vérification de rôle ici (couche service pure). */
export async function hardDeletePromotion(id: string): Promise<void> {
  const existing = (await prisma.promotion.findUnique({
    where: { id },
    include: { branches: true },
  })) as { appliesToAll: boolean; branches: { branchId: string }[] } | null;
  if (!existing) throw new AdminNotFoundError("Promotion introuvable");

  const affectedSlugs = await resolveAffectedBranchSlugs(
    existing.appliesToAll,
    existing.branches.map((b) => b.branchId)
  );

  // Aucun cascade destructif silencieux (§22) : les deux tables enfant sont
  // vidées explicitement avant la suppression de la promotion elle-même,
  // jamais un simple `onDelete: Cascade` invisible dans une Server Action.
  // Phase 11, §16 — regroupées en une seule transaction (même correctif que
  // `updatePromotion` ci-dessus) : sans elle, un crash entre les deux
  // suppressions et `promotion.delete` laisserait la promotion elle-même
  // présente mais orpheline de ses traductions/ciblages, un état incohérent
  // pire que la suppression complète visée.
  await prisma.$transaction(async (tx) => {
    await tx.promotionBranch.deleteMany({ where: { promotionId: id } });
    await tx.promotionTranslation.deleteMany({ where: { promotionId: id } });
    await tx.promotion.delete({ where: { id } });
  });

  invalidatePublicBranchCaches(affectedSlugs);
}

/** Utilisé par le formulaire (sélecteur de magasins) — liste minimale, pas de
 * pagination nécessaire pour la douzaine de magasins DEMO actuels. */
export async function listBranchOptions(): Promise<{ id: string; label: string }[]> {
  const rows = (await prisma.branch.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, translations: { where: { locale: "he" } } },
  })) as { id: string; translations: { displayName: string }[] }[];
  return rows.map((row) => ({ id: row.id, label: row.translations[0]?.displayName ?? row.id }));
}
