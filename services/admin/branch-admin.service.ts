import { prisma } from "@/lib/prisma";
import { locales, type AppLocale } from "@/types/i18n";
import type { BranchInput } from "@/lib/validators/branch";
import {
  AdminConflictError,
  AdminNotFoundError,
  AdminRelationInUseError,
} from "@/lib/admin/mutation-result";
import { computeTranslationStatus, type TranslationStatus } from "@/lib/admin/translation-status";
import { invalidatePublicBranchCaches } from "@/lib/admin/cache";
import type { OpeningHoursEntry, SpecialHoursEntry } from "@/types/opening-hours";

/**
 * Service métier CRUD Magasins (Phase 9, §4-§10) — SEULE couche qui parle à
 * Prisma pour ce domaine. Ne réimplémente AUCUNE règle du moteur d'horaires
 * (Phase 7) : les horaires bruts saisis sont stockés tels quels, exactement
 * comme le fait déjà `prisma/seed.ts` — c'est `lib/opening-hours/*` (public)
 * qui les interprète, jamais ce service.
 */
interface PrismaBranchAdminRow {
  id: string;
  slug: string;
  branchCode: string;
  cityId: string;
  district: string | null;
  address: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
  whatsappGroupUrl: string | null;
  wazeUrlOverride: string | null;
  mainImage: string | null;
  isActive: boolean;
  isDemo: boolean;
  sortOrder: number;
  updatedAt: Date;
  // Phase 11, §16ter — SEULE source de vérité pour la concurrence optimiste
  // (§17), voir le commentaire détaillé sur `Branch.version` dans le schéma.
  version: number;
  city: { id: string; translations: { locale: string; name: string }[] };
  translations: { locale: string; displayName: string; description: string | null; seoTitle: string | null; seoDescription: string | null }[];
  openingHours: { dayOfWeek: number; isClosed: boolean; openingTime: string | null; closingTime: string | null; openingTime2: string | null; closingTime2: string | null }[];
  specialHours: { id: string; date: Date; title: string | null; isClosed: boolean; openingTime: string | null; closingTime: string | null; openingTime2: string | null; closingTime2: string | null }[];
  services: { serviceId: string }[];
  images: { id: string; imageUrl: string; alt: string | null; sortOrder: number }[];
}

export interface AdminBranchListItem {
  id: string;
  slug: string;
  branchCode: string;
  displayName: string;
  cityName: string;
  isActive: boolean;
  updatedAt: string;
  translationStatus: TranslationStatus;
}

export interface AdminBranchDetail {
  id: string;
  slug: string;
  branchCode: string;
  cityId: string;
  district: string | null;
  address: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
  whatsappGroupUrl: string | null;
  wazeUrlOverride: string | null;
  mainImage: string | null;
  isActive: boolean;
  isDemo: boolean;
  sortOrder: number;
  updatedAt: string;
  /** Phase 11, §16ter — jeton de concurrence opaque, jamais affiché ni
   * modifiable (voir `BranchForm.tsx`). */
  version: number;
  serviceIds: string[];
  openingHours: OpeningHoursEntry[];
  specialHours: (SpecialHoursEntry & { id: string })[];
  images: { id: string; imageUrl: string; alt: string | null; sortOrder: number }[];
  translations: { locale: AppLocale; displayName: string; description: string; seoTitle: string; seoDescription: string }[];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapListItem(row: PrismaBranchAdminRow): AdminBranchListItem {
  const he = row.translations.find((t) => t.locale === "he") ?? row.translations[0];
  const cityHe = row.city.translations.find((t) => t.locale === "he") ?? row.city.translations[0];
  return {
    id: row.id,
    slug: row.slug,
    branchCode: row.branchCode,
    displayName: he?.displayName ?? row.slug,
    cityName: cityHe?.name ?? "",
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
    translationStatus: computeTranslationStatus(row.translations, (t) => t.displayName.trim().length > 0),
  };
}

function mapDetail(row: PrismaBranchAdminRow): AdminBranchDetail {
  return {
    id: row.id,
    slug: row.slug,
    branchCode: row.branchCode,
    cityId: row.cityId,
    district: row.district,
    address: row.address,
    postalCode: row.postalCode,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    whatsappNumber: row.whatsappNumber,
    whatsappGroupUrl: row.whatsappGroupUrl,
    wazeUrlOverride: row.wazeUrlOverride,
    mainImage: row.mainImage,
    isActive: row.isActive,
    isDemo: row.isDemo,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
    serviceIds: row.services.map((s) => s.serviceId),
    openingHours: row.openingHours.map((entry) => ({
      dayOfWeek: entry.dayOfWeek as OpeningHoursEntry["dayOfWeek"],
      isClosed: entry.isClosed,
      openingTime: entry.openingTime,
      closingTime: entry.closingTime,
      openingTime2: entry.openingTime2,
      closingTime2: entry.closingTime2,
    })),
    specialHours: row.specialHours.map((entry) => ({
      id: entry.id,
      date: toIsoDate(entry.date),
      title: entry.title,
      isClosed: entry.isClosed,
      openingTime: entry.openingTime,
      closingTime: entry.closingTime,
      openingTime2: entry.openingTime2,
      closingTime2: entry.closingTime2,
    })),
    images: row.images.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    translations: locales.map((locale) => {
      const t = row.translations.find((entry) => entry.locale === locale);
      return {
        locale,
        displayName: t?.displayName ?? "",
        description: t?.description ?? "",
        seoTitle: t?.seoTitle ?? "",
        seoDescription: t?.seoDescription ?? "",
      };
    }),
  };
}

const BRANCH_ADMIN_INCLUDE = {
  city: { include: { translations: { where: { locale: "he" } } } },
  translations: true,
  openingHours: true,
  specialHours: true,
  services: true,
  images: true,
} as const;

export interface AdminBranchListParams {
  q?: string;
  cityId?: string;
  isActive?: boolean;
}

export async function listAdminBranches(params: AdminBranchListParams = {}): Promise<AdminBranchListItem[]> {
  const rows = (await prisma.branch.findMany({
    where: {
      cityId: params.cityId || undefined,
      isActive: params.isActive,
    },
    orderBy: { sortOrder: "asc" },
    include: BRANCH_ADMIN_INCLUDE,
  })) as PrismaBranchAdminRow[];

  const items = rows.map(mapListItem);
  if (!params.q) return items;

  // Recherche simple sur nom/slug/code magasin — pas besoin du moteur
  // multilingue public (`lib/search/`) ici : l'admin cherche par ce qu'il a
  // sous les yeux dans SA langue de saisie, pas par correspondance
  // multilingue visiteur.
  const q = params.q.trim().toLowerCase();
  return items.filter(
    (item) =>
      item.displayName.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      item.branchCode.toLowerCase().includes(q)
  );
}

export async function getAdminBranchById(id: string): Promise<AdminBranchDetail | null> {
  const row = (await prisma.branch.findUnique({
    where: { id },
    include: BRANCH_ADMIN_INCLUDE,
  })) as PrismaBranchAdminRow | null;
  return row ? mapDetail(row) : null;
}

function translationsCreateInput(input: BranchInput) {
  return input.translations.map((t) => ({
    locale: t.locale,
    displayName: t.displayName,
    description: t.description,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
  }));
}

export async function createBranch(input: BranchInput): Promise<{ id: string }> {
  const created = (await prisma.branch.create({
    data: {
      slug: input.slug,
      branchCode: input.branchCode,
      cityId: input.cityId,
      district: input.district,
      address: input.address,
      postalCode: input.postalCode,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      email: input.email,
      whatsappNumber: input.whatsappNumber,
      whatsappGroupUrl: input.whatsappGroupUrl,
      wazeUrlOverride: input.wazeUrlOverride,
      mainImage: input.mainImage,
      isActive: input.isActive,
      // Créé depuis le back-office : jamais marqué DEMO (§22 Phase 8, même
      // principe que `promotion-admin.service.ts`).
      isDemo: false,
      sortOrder: input.sortOrder,
      translations: { create: translationsCreateInput(input) },
      openingHours: { create: input.openingHours },
      specialHours: {
        create: input.specialHours.map((s) => ({
          date: s.date,
          title: s.title,
          isClosed: s.isClosed,
          openingTime: s.openingTime,
          closingTime: s.closingTime,
          openingTime2: s.openingTime2,
          closingTime2: s.closingTime2,
        })),
      },
      services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
      images: { create: input.images },
    },
  })) as { id: string };

  invalidatePublicBranchCaches([input.slug]);
  return { id: created.id };
}

export async function updateBranch(id: string, expectedVersion: number, input: BranchInput): Promise<void> {
  // Pré-vérification rapide (404 explicite) HORS transaction — jamais la
  // source de vérité pour la concurrence (voir le verrou atomique ci-dessous),
  // seulement un échec rapide et un message clair pour le cas courant "id
  // inexistant", sans ouvrir de transaction pour rien.
  const existing = (await prisma.branch.findUnique({ where: { id } })) as { version: number; slug: string } | null;
  if (!existing) throw new AdminNotFoundError("Magasin introuvable");
  if (existing.version !== expectedVersion) {
    throw new AdminConflictError("Ce magasin a été modifié entre-temps par un autre utilisateur");
  }

  // Purge + recréation des collections enfant — même stratégie que
  // `prisma/seed.ts#seedBranches()` (§4-§10 : simple et sûr pour un
  // formulaire qui renvoie toujours l'état complet).
  //
  // Phase 11, §16 (audit transactions) — CORRECTIF : ces 5 suppressions et la
  // mise à jour qui suit étaient auparavant 6 appels Prisma indépendants, non
  // transactionnels. Un crash du processus ou une perte de connexion DB entre
  // deux de ces appels (ex. juste après `branchOpeningHours.deleteMany`, avant
  // `branch.update`) laissait un magasin réel avec ses horaires supprimés mais
  // jamais recréés — un état incohérent persistant jusqu'à la prochaine
  // modification réussie. Même défaut de conception que celui déjà corrigé en
  // Phase 10 pour l'import (`executeBranchImport`, qui enveloppe exactement ce
  // même type de purge+recréation dans un seul `prisma.$transaction`) —
  // corrigé ici à l'identique : soit les 6 opérations réussissent ensemble,
  // soit aucune n'est appliquée, jamais un état intermédiaire.
  //
  // Phase 11, §16ter (durcissement de la concurrence optimiste — remplace le
  // verrou basé sur `updatedAt` introduit plus tôt dans cette même phase) :
  // la pré-vérification ci-dessus lit `version` AVANT d'ouvrir la
  // transaction — une deuxième requête concurrente pourrait passer le même
  // contrôle entre-temps et les deux transactions écraseraient alors
  // silencieusement l'une le travail de l'autre (fenêtre "TOCTOU" classique
  // d'un verrou optimiste vérifié hors de l'écriture qu'il protège). Le VRAI
  // verrou est donc le `updateMany` gardé ci-dessous, PREMIÈRE opération de
  // la transaction : `WHERE id = ? AND version = expectedVersion`, avec
  // `version: { increment: 1 }` dans le MÊME `UPDATE` atomique (jamais
  // `expectedVersion + 1` calculé côté JS, ce qui réintroduirait la race).
  // Postgres pose un verrou ligne sur `branches` dès cet `UPDATE`, qu'aucune
  // autre transaction concurrente touchant la même ligne ne peut acquérir
  // avant que celle-ci ne committe ou n'échoue — la deuxième transaction, une
  // fois débloquée, réévalue alors sa clause `WHERE version = <ancienne
  // valeur>` contre la valeur déjà commitée par la première, qui ne
  // correspond plus : `count` vaut 0, `AdminConflictError` est levée,
  // ROLLBACK automatique (aucune des suppressions ci-dessous n'a encore eu
  // lieu). Comparaison et écriture sont ainsi une seule opération atomique,
  // jamais deux étapes séparables. `updatedAt` (affichage uniquement, jamais
  // comparé dans un `WHERE`) partage le même `now` que la mise à jour finale
  // — un seul changement de version cohérent par mutation réussie.
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const guarded = await tx.branch.updateMany({
      where: { id, version: expectedVersion },
      data: { version: { increment: 1 }, updatedAt: now },
    });
    if (guarded.count === 0) {
      throw new AdminConflictError("Ce magasin a été modifié entre-temps par un autre utilisateur");
    }

    await tx.branchOpeningHours.deleteMany({ where: { branchId: id } });
    await tx.specialOpeningHours.deleteMany({ where: { branchId: id } });
    await tx.branchService.deleteMany({ where: { branchId: id } });
    await tx.branchImage.deleteMany({ where: { branchId: id } });
    await tx.branchTranslation.deleteMany({ where: { branchId: id } });

    await tx.branch.update({
      where: { id },
      data: {
        slug: input.slug,
        branchCode: input.branchCode,
        cityId: input.cityId,
        district: input.district,
        address: input.address,
        postalCode: input.postalCode,
        latitude: input.latitude,
        longitude: input.longitude,
        phone: input.phone,
        email: input.email,
        whatsappNumber: input.whatsappNumber,
        whatsappGroupUrl: input.whatsappGroupUrl,
        wazeUrlOverride: input.wazeUrlOverride,
        mainImage: input.mainImage,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        updatedAt: now,
        translations: { create: translationsCreateInput(input) },
        openingHours: { create: input.openingHours },
        specialHours: {
          create: input.specialHours.map((s) => ({
            date: s.date,
            title: s.title,
            isClosed: s.isClosed,
            openingTime: s.openingTime,
            closingTime: s.closingTime,
            openingTime2: s.openingTime2,
            closingTime2: s.closingTime2,
          })),
        },
        services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
        images: { create: input.images },
      },
    });
  });

  // Invalide l'ancien ET le nouveau slug (§20) — un changement de slug (§4)
  // laisserait sinon l'ancienne URL publique servir une page périmée par le
  // cache jusqu'à l'expiration de l'ISR.
  const affected = existing.slug === input.slug ? [input.slug] : [existing.slug, input.slug];
  invalidatePublicBranchCaches(affected);
}

/** §21 : un magasin désactivé reste dans l'admin, disparaît du Store
 * Locator/sitemap, retourne 404 publiquement — comportement DÉJÀ garanti par
 * `BranchRepository#getActiveBranches()`/`getBranchBySlug()` (Phase 8, filtre
 * `isActive: true` dans la requête elle-même) : cette fonction ne fait que
 * poser le booléen, aucune logique de visibilité dupliquée ici. */
export async function setBranchActive(id: string, isActive: boolean): Promise<void> {
  const existing = (await prisma.branch.findUnique({ where: { id } })) as { slug: string } | null;
  if (!existing) throw new AdminNotFoundError("Magasin introuvable");
  await prisma.branch.update({ where: { id }, data: { isActive } });
  invalidatePublicBranchCaches([existing.slug]);
}

export async function hardDeleteBranch(id: string): Promise<void> {
  const existing = (await prisma.branch.findUnique({
    where: { id },
    select: { slug: true, promotions: true, _count: { select: { reviews: true } } },
  })) as { slug: string; promotions: { promotionId: string }[]; _count?: { reviews: number } } | null;
  if (!existing) throw new AdminNotFoundError("Magasin introuvable");

  if (existing._count?.reviews) {
    throw new AdminRelationInUseError("Impossible de supprimer un magasin avec des avis clients. Désactivez-le plutôt.");
  }

  if (existing.promotions.length > 0) {
    throw new AdminRelationInUseError(
      `Impossible de supprimer : ${existing.promotions.length} promotion(s) ciblent encore ce magasin. Retirez-le de ces promotions ou désactivez-le plutôt.`
    );
  }

  // Aucun cascade destructif silencieux (§22) : chaque table enfant est
  // vidée explicitement (les images physiques restent en revanche sur le
  // disque — hors périmètre de cette phase, voir le rapport final).
  // Phase 11, §16 — regroupées en une seule transaction (même correctif que
  // `updateBranch` ci-dessus).
  await prisma.$transaction(async (tx) => {
    await tx.branchOpeningHours.deleteMany({ where: { branchId: id } });
    await tx.specialOpeningHours.deleteMany({ where: { branchId: id } });
    await tx.branchService.deleteMany({ where: { branchId: id } });
    await tx.branchImage.deleteMany({ where: { branchId: id } });
    await tx.branchTranslation.deleteMany({ where: { branchId: id } });
    await tx.searchAlias.deleteMany({ where: { branchId: id } });
    await tx.branch.delete({ where: { id } });
  });

  invalidatePublicBranchCaches([existing.slug]);
}
