import { prisma } from "@/lib/prisma";
import { locales, type AppLocale } from "@/types/i18n";
import type { CityInput } from "@/lib/validators/city";
import { AdminConflictError, AdminNotFoundError, AdminRelationInUseError } from "@/lib/admin/mutation-result";
import { computeTranslationStatus, type TranslationStatus } from "@/lib/admin/translation-status";
import { invalidatePublicBranchCaches } from "@/lib/admin/cache";

/**
 * Service métier CRUD Villes (Phase 9, §8) — `Branch.cityId` référence
 * TOUJOURS une `City`, jamais un nom de ville libre stocké directement sur
 * `Branch` (§8, impératif) : ce service est donc un préalable à la création
 * d'un magasin, pas une fonctionnalité secondaire.
 */
interface PrismaCityAdminRow {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
  // Phase 11, §16ter — SEULE source de vérité pour la concurrence optimiste
  // (§17), voir le commentaire détaillé sur `City.version` dans le schéma.
  version: number;
  translations: { locale: string; name: string }[];
  _count?: { branches: number };
}

export interface AdminCityListItem {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  branchCount: number;
  updatedAt: string;
  translationStatus: TranslationStatus;
}

export interface AdminCityDetail {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  /** Phase 11, §16ter — jeton de concurrence opaque à renvoyer tel quel via
   * `updateCity(id, version, input)` ; jamais affiché ni modifiable dans le
   * formulaire (voir `CityForm.tsx` : simple prop transmise, jamais un champ
   * de saisie). */
  version: number;
  translations: { locale: AppLocale; name: string }[];
}

function mapListItem(row: PrismaCityAdminRow): AdminCityListItem {
  const he = row.translations.find((t) => t.locale === "he") ?? row.translations[0];
  return {
    id: row.id,
    slug: row.slug,
    name: he?.name ?? row.slug,
    isActive: row.isActive,
    branchCount: row._count?.branches ?? 0,
    updatedAt: row.updatedAt.toISOString(),
    translationStatus: computeTranslationStatus(row.translations, (t) => t.name.trim().length > 0),
  };
}

function mapDetail(row: PrismaCityAdminRow): AdminCityDetail {
  return {
    id: row.id,
    slug: row.slug,
    latitude: row.latitude,
    longitude: row.longitude,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
    translations: locales.map((locale) => {
      const t = row.translations.find((entry) => entry.locale === locale);
      return { locale, name: t?.name ?? "" };
    }),
  };
}

export async function listAdminCities(): Promise<AdminCityListItem[]> {
  const rows = (await prisma.city.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { branches: true } } },
  })) as PrismaCityAdminRow[];
  return rows.map(mapListItem);
}

export async function getAdminCityById(id: string): Promise<AdminCityDetail | null> {
  const row = (await prisma.city.findUnique({
    where: { id },
    include: { translations: true },
  })) as PrismaCityAdminRow | null;
  return row ? mapDetail(row) : null;
}

export async function createCity(input: CityInput): Promise<{ id: string }> {
  const created = (await prisma.city.create({
    data: {
      slug: input.slug,
      latitude: input.latitude,
      longitude: input.longitude,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      translations: { create: input.translations.map((t) => ({ locale: t.locale, name: t.name })) },
    },
  })) as { id: string };
  invalidatePublicBranchCaches();
  return { id: created.id };
}

export async function updateCity(id: string, expectedVersion: number, input: CityInput): Promise<void> {
  // Pré-vérification rapide (404 explicite) HORS transaction — jamais la
  // source de vérité pour la concurrence (le verrou atomique ci-dessous
  // l'est), seulement un échec rapide et un message clair pour le cas
  // courant "id inexistant", sans ouvrir de transaction pour rien.
  const existing = (await prisma.city.findUnique({ where: { id } })) as { version: number } | null;
  if (!existing) throw new AdminNotFoundError("Ville introuvable");
  if (existing.version !== expectedVersion) {
    throw new AdminConflictError("Cette ville a été modifiée entre-temps par un autre utilisateur");
  }

  // Phase 11, §16ter (durcissement de la concurrence optimiste) — le verrou
  // RÉEL est le `updateMany` gardé ci-dessous, PREMIÈRE opération de la
  // transaction : `WHERE id = ? AND version = expectedVersion`, avec
  // `version: { increment: 1 }` dans le même `UPDATE` atomique (jamais
  // `expectedVersion + 1` calculé côté JS, ce qui réintroduirait une race).
  // Postgres pose un verrou ligne sur `cities` dès cet `UPDATE` ; une
  // transaction concurrente touchant la même ligne attend le commit/rollback
  // de celle-ci avant de réévaluer SA PROPRE clause `WHERE version = ...`
  // contre la valeur déjà committée — qui ne correspond alors plus : `count`
  // vaut 0, `AdminConflictError` est levée, ROLLBACK automatique AVANT toute
  // suppression de relation enfant. Comparaison et écriture sont ainsi UNE
  // SEULE opération atomique, jamais deux étapes séparables (voir la
  // pré-vérification ci-dessus, qui n'est qu'un raccourci UX, jamais la
  // source de vérité — §17).
  //
  // `updatedAt` (champ d'affichage uniquement désormais, jamais comparé dans
  // une clause `WHERE`) est mis à jour UNE SEULE FOIS avec le même `now`,
  // dans le verrou ET la mise à jour finale ci-dessous — un seul changement
  // de version cohérent par mutation réussie (voir le schéma pour le
  // rationale complet : `version` et `updatedAt` ne sont jamais deux
  // mécanismes de concurrence concurrents).
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const guarded = await tx.city.updateMany({
      where: { id, version: expectedVersion },
      data: { version: { increment: 1 }, updatedAt: now },
    });
    if (guarded.count === 0) {
      throw new AdminConflictError("Cette ville a été modifiée entre-temps par un autre utilisateur");
    }

    await tx.cityTranslation.deleteMany({ where: { cityId: id } });
    await tx.city.update({
      where: { id },
      data: {
        slug: input.slug,
        latitude: input.latitude,
        longitude: input.longitude,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        updatedAt: now,
        translations: { create: input.translations.map((t) => ({ locale: t.locale, name: t.name })) },
      },
    });
  });
  invalidatePublicBranchCaches();
}

export async function setCityActive(id: string, isActive: boolean): Promise<void> {
  const existing = await prisma.city.findUnique({ where: { id } });
  if (!existing) throw new AdminNotFoundError("Ville introuvable");
  await prisma.city.update({ where: { id }, data: { isActive } });
  invalidatePublicBranchCaches();
}

export async function hardDeleteCity(id: string): Promise<void> {
  const branchCount = await prisma.branch.count({ where: { cityId: id } });
  if (branchCount > 0) {
    throw new AdminRelationInUseError(
      `Impossible de supprimer : ${branchCount} magasin(s) référencent encore cette ville. Désactivez-la plutôt.`
    );
  }
  const existing = await prisma.city.findUnique({ where: { id } });
  if (!existing) throw new AdminNotFoundError("Ville introuvable");

  // Phase 11, §16 — regroupées en une seule transaction (même correctif que
  // `updateCity` ci-dessus).
  await prisma.$transaction(async (tx) => {
    await tx.cityTranslation.deleteMany({ where: { cityId: id } });
    await tx.city.delete({ where: { id } });
  });
  invalidatePublicBranchCaches();
}

export async function listCityOptions(): Promise<{ id: string; label: string }[]> {
  const rows = (await prisma.city.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, translations: { where: { locale: "he" } } },
  })) as { id: string; translations: { name: string }[] }[];
  return rows.map((row) => ({ id: row.id, label: row.translations[0]?.name ?? row.id }));
}
