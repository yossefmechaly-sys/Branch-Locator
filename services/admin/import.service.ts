import { prisma } from "@/lib/prisma";
import { invalidatePublicBranchCaches } from "@/lib/admin/cache";
import {
  analyzeBranchImportRows,
  type BranchImportLookups,
  type ImportAnalysis,
} from "@/lib/import/branch-import";
import { HOURS_COLUMN_KEYS } from "@/lib/import/hours-format";
import type { BranchInput } from "@/lib/validators/branch";

/**
 * Exécution de l'import magasins (Phase 10, §24-§28) — SEULE couche qui
 * touche `prisma` pour l'import. `loadBranchImportLookups()` est appelée
 * fraîche à CHAQUE aperçu ET à CHAQUE exécution (jamais réutilisée d'un appel
 * à l'autre) : villes/services/magasins ont pu changer entre l'aperçu et la
 * confirmation (§25 : la revalidation à l'exécution doit refléter l'état réel
 * de la base, pas un instantané périmé).
 */

interface ExistingBranchRow {
  id: string;
  branchCode: string;
  slug: string;
}

export async function loadBranchImportLookups(): Promise<BranchImportLookups> {
  const cities = (await prisma.city.findMany({ select: { id: true, slug: true } })) as { id: string; slug: string }[];
  const services = (await prisma.service.findMany({ select: { id: true, slug: true } })) as { id: string; slug: string }[];
  const branches = (await prisma.branch.findMany({
    select: { id: true, branchCode: true, slug: true },
  })) as ExistingBranchRow[];

  return {
    cityIdBySlug: new Map(cities.map((c) => [c.slug, c.id])),
    serviceIdBySlug: new Map(services.map((s) => [s.slug, s.id])),
    existingByBranchCode: new Map(branches.map((b) => [b.branchCode, { id: b.id, slug: b.slug }])),
    existingBySlug: new Map(branches.map((b) => [b.slug, { id: b.id, branchCode: b.branchCode }])),
  };
}

/** Aperçu / dry-run (§25) — appelle EXACTEMENT le même moteur de validation
 * que l'exécution réelle (`analyzeBranchImportRows`), aucune écriture. */
export async function previewBranchImport(
  rawRows: Record<string, string>[],
  headerKeys: string[]
): Promise<ImportAnalysis> {
  const lookups = await loadBranchImportLookups();
  return analyzeBranchImportRows(rawRows, headerKeys, lookups);
}

export interface ExecuteImportResult {
  analysis: ImportAnalysis;
  created: number;
  updated: number;
  /** `true` si au moins une ligne valide a réellement été écrite — `false`
   * si le fichier ne contenait que des lignes en erreur/ignorées (aucune
   * transaction ouverte dans ce cas, §28). */
  wrote: boolean;
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

/**
 * Exécute l'import (§24 Confirmation → Import). Stratégie de transaction
 * (§28, préférence explicite utilisateur pour le MVP) : « validation complète
 * d'abord, puis transaction contrôlée » — comprise ici comme (1) TOUTES les
 * lignes sont validées d'abord (`analyzeBranchImportRows`, aucune écriture
 * pendant cette phase), (2) les lignes en ERREUR sont exclues individuellement
 * (jamais bloquantes pour les autres lignes du fichier), (3) mais l'écriture
 * des lignes VALIDES se fait dans UNE SEULE transaction Prisma — soit toutes
 * les lignes valides sont écrites, soit AUCUNE (si la transaction échoue en
 * cours de route pour une raison infrastructurelle), jamais un état
 * intermédiaire où la moitié des lignes valides seraient écrites et l'autre
 * moitié non (« import partiellement corrompu », littéralement la formulation
 * de l'utilisateur). Ni un pur all-or-nothing sur le FICHIER entier (une
 * seule ligne en erreur ne doit jamais bloquer les 300 autres lignes valides
 * du même fichier), ni des écritures non transactionnelles ligne par ligne.
 */
export async function executeBranchImport(
  rawRows: Record<string, string>[],
  headerKeys: string[],
  actorId: string,
  actorEmail: string
): Promise<ExecuteImportResult> {
  const lookups = await loadBranchImportLookups();
  const analysis = analyzeBranchImportRows(rawRows, headerKeys, lookups);
  // Même test que `validateImportRow`/`parseWeeklyHours` (§29) — détermine si
  // CE fichier touche les horaires du tout ; sert ci-dessous à ne JAMAIS
  // vider les horaires existants d'un magasin mis à jour quand le fichier ne
  // fournit aucune colonne d'horaires (cohérent avec l'avertissement déjà
  // affiché à l'aperçu : « les horaires existants ne seront pas modifiés »).
  const headerHasHoursColumns = HOURS_COLUMN_KEYS.some((key) => headerKeys.includes(key));

  const toCreate = analysis.rows.filter((r) => r.action === "create" && r.data);
  const toUpdate = analysis.rows.filter((r) => r.action === "update" && r.data);

  if (toCreate.length === 0 && toUpdate.length === 0) {
    return { analysis, created: 0, updated: 0, wrote: false };
  }

  const affectedSlugs = new Set<string>();
  const auditEntries: { entityId: string; action: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of toCreate) {
      const input = row.data!;
      const created = (await tx.branch.create({
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
          // Importé depuis un fichier admin : jamais marqué DEMO (même
          // principe que la création manuelle, §22 Phase 8).
          isDemo: false,
          sortOrder: input.sortOrder,
          translations: { create: translationsCreateInput(input) },
          openingHours: { create: input.openingHours },
          services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
        },
      })) as { id: string };

      affectedSlugs.add(input.slug);
      auditEntries.push({ entityId: created.id, action: "branch.import.create" });
    }

    for (const row of toUpdate) {
      const input = row.data!;
      const branchId = row.matchedBranchId!;

      // Purge + recréation des collections enfant liées aux champs importés
      // uniquement (§29 : les horaires ne sont réécrits QUE si le fichier
      // fournit des colonnes d'horaires — voir `parseWeeklyHours`, qui
      // renvoie `null`/`[]` selon le cas ; ici `input.openingHours` reflète
      // déjà ce choix). Les images restent INTOUCHÉES par l'import (hors
      // périmètre §23 : « si raisonnable » — la galerie photo n'a pas
      // d'équivalent texte raisonnable dans une cellule de tableur).
      if (headerHasHoursColumns) await tx.branchOpeningHours.deleteMany({ where: { branchId } });
      await tx.branchService.deleteMany({ where: { branchId } });
      await tx.branchTranslation.deleteMany({ where: { branchId } });

      await tx.branch.update({
        where: { id: branchId },
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
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          translations: { create: translationsCreateInput(input) },
          // N'écrit une nouvelle collection d'horaires QUE si le fichier en
          // fournissait une (voir `headerHasHoursColumns` ci-dessus) — sinon
          // `input.openingHours` vaut `[]` par construction et ce `create`
          // vide serait un no-op de toute façon, mais on l'omet explicitement
          // pour que l'intention reste lisible ici sans redescendre dans
          // `validateImportRow`.
          ...(headerHasHoursColumns ? { openingHours: { create: input.openingHours } } : {}),
          services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
        },
      });

      affectedSlugs.add(input.slug);
      auditEntries.push({ entityId: branchId, action: "branch.import.update" });
    }
  });

  // Invalidation ET audit APRÈS le commit réussi de la transaction (§20/§18 —
  // jamais avant une écriture dont on ne sait pas encore si elle aboutira).
  invalidatePublicBranchCaches(Array.from(affectedSlugs));
  for (const entry of auditEntries) {
    try {
      await prisma.auditLog.create({
        data: { actorId, actorEmail, action: entry.action, entityType: "Branch", entityId: entry.entityId },
      });
    } catch (error) {
      console.error("[audit] échec d'écriture (import déjà appliqué, non bloquant) :", error);
    }
  }

  return { analysis, created: toCreate.length, updated: toUpdate.length, wrote: true };
}
