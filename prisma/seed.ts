/**
 * Seed Prisma — Phase 3.
 *
 * Peuple la base avec 7 villes, 10 services, 12 magasins DEMO (tous marqués
 * `isDemo: true`) et 8 promotions (Phase 9 : dont 5 avec produit/prix
 * structurés), entièrement traduites en he/en/ru/fr/es. Les
 * données brutes vivent dans `seed-data.ts` ; ce fichier ne fait que les insérer
 * via Prisma Client, de façon idempotente (upsert par slug — peut être relancé
 * sans dupliquer les données).
 *
 * Exécution : `npx prisma db seed` (ou automatiquement après `prisma migrate dev`).
 */

import { PrismaClient, type Locale } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { locales } from "../types/i18n";
import { buildOpeningHoursFromPattern } from "../lib/opening-hours/patterns";
import { BRANCHES, CITIES, PROMOTIONS, SERVICES } from "./seed-data";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function seedCities() {
  const cityIdBySlug = new Map<string, string>();

  for (const city of CITIES) {
    const record = await prisma.city.upsert({
      where: { slug: city.slug },
      create: {
        slug: city.slug,
        latitude: city.latitude,
        longitude: city.longitude,
        translations: {
          create: locales.map((locale) => ({
            locale: locale as Locale,
            name: city.translations[locale].name,
          })),
        },
      },
      update: {
        latitude: city.latitude,
        longitude: city.longitude,
      },
    });
    cityIdBySlug.set(city.slug, record.id);
  }

  console.log(`  Villes : ${cityIdBySlug.size}`);
  return cityIdBySlug;
}

async function seedServices() {
  const serviceIdBySlug = new Map<string, string>();

  for (const [index, service] of SERVICES.entries()) {
    const record = await prisma.service.upsert({
      where: { slug: service.slug },
      create: {
        slug: service.slug,
        icon: service.icon,
        sortOrder: index,
        translations: {
          create: locales.map((locale) => ({
            locale: locale as Locale,
            name: service.translations[locale].name,
            description: service.translations[locale].description,
          })),
        },
      },
      update: { icon: service.icon, sortOrder: index },
    });
    serviceIdBySlug.set(service.slug, record.id);
  }

  console.log(`  Services : ${serviceIdBySlug.size}`);
  return serviceIdBySlug;
}

async function seedBranches(
  cityIdBySlug: Map<string, string>,
  serviceIdBySlug: Map<string, string>
) {
  const branchIdBySlug = new Map<string, string>();

  for (const branch of BRANCHES) {
    const cityId = cityIdBySlug.get(branch.citySlug);
    if (!cityId) {
      throw new Error(`Ville inconnue pour le magasin ${branch.slug} : ${branch.citySlug}`);
    }

    const serviceConnections = branch.serviceSlugs.map((slug) => {
      const serviceId = serviceIdBySlug.get(slug);
      if (!serviceId) {
        throw new Error(`Service inconnu "${slug}" référencé par ${branch.slug}`);
      }
      return { serviceId };
    });

    // Upsert manuel : on supprime les enregistrements dépendants puis on les
    // recrée, plus simple et plus sûr qu'un diff fin pour un script de seed.
    const existing = await prisma.branch.findUnique({ where: { slug: branch.slug } });
    if (existing) {
      await prisma.branchOpeningHours.deleteMany({ where: { branchId: existing.id } });
      await prisma.specialOpeningHours.deleteMany({ where: { branchId: existing.id } });
      await prisma.branchService.deleteMany({ where: { branchId: existing.id } });
      await prisma.branchImage.deleteMany({ where: { branchId: existing.id } });
      await prisma.searchAlias.deleteMany({ where: { branchId: existing.id } });
    }

    const record = await prisma.branch.upsert({
      where: { slug: branch.slug },
      create: {
        slug: branch.slug,
        branchCode: branch.branchCode,
        cityId,
        district: branch.district,
        address: branch.address,
        postalCode: branch.postalCode,
        latitude: branch.latitude,
        longitude: branch.longitude,
        phone: branch.phone,
        email: branch.email,
        whatsappNumber: branch.whatsappNumber,
        mainImage: branch.mainImage,
        isActive: true,
        isDemo: true,
        sortOrder: branch.sortOrder,
        translations: {
          create: locales.map((locale) => ({
            locale: locale as Locale,
            displayName: branch.translations[locale].displayName,
            description: branch.translations[locale].description,
            seoTitle: branch.translations[locale].seoTitle,
            seoDescription: branch.translations[locale].seoDescription,
          })),
        },
        openingHours: { create: buildOpeningHoursFromPattern(branch.hoursPattern) },
        specialHours: {
          create: branch.specialHours.map((special) => ({
            date: new Date(`${special.date}T00:00:00.000Z`),
            title: special.title.he,
            isClosed: special.isClosed,
            openingTime: special.openingTime ?? null,
            closingTime: special.closingTime ?? null,
          })),
        },
        services: { create: serviceConnections },
        images: {
          create: branch.images.map((image, index) => ({
            imageUrl: image.url,
            alt: image.alt.he,
            sortOrder: index,
          })),
        },
        searchAliases: {
          create: branch.searchAliases.map((alias) => ({
            locale: alias.locale as Locale,
            alias: alias.alias,
          })),
        },
      },
      update: {
        cityId,
        district: branch.district,
        address: branch.address,
        postalCode: branch.postalCode,
        latitude: branch.latitude,
        longitude: branch.longitude,
        phone: branch.phone,
        email: branch.email,
        whatsappNumber: branch.whatsappNumber,
        mainImage: branch.mainImage,
        sortOrder: branch.sortOrder,
        openingHours: { create: buildOpeningHoursFromPattern(branch.hoursPattern) },
        specialHours: {
          create: branch.specialHours.map((special) => ({
            date: new Date(`${special.date}T00:00:00.000Z`),
            title: special.title.he,
            isClosed: special.isClosed,
            openingTime: special.openingTime ?? null,
            closingTime: special.closingTime ?? null,
          })),
        },
        services: { create: serviceConnections },
        images: {
          create: branch.images.map((image, index) => ({
            imageUrl: image.url,
            alt: image.alt.he,
            sortOrder: index,
          })),
        },
        searchAliases: {
          create: branch.searchAliases.map((alias) => ({
            locale: alias.locale as Locale,
            alias: alias.alias,
          })),
        },
      },
    });

    branchIdBySlug.set(branch.slug, record.id);
  }

  console.log(`  Magasins : ${branchIdBySlug.size}`);
  return branchIdBySlug;
}

async function seedPromotions(branchIdBySlug: Map<string, string>) {
  let count = 0;

  for (const promo of PROMOTIONS) {
    const branchConnections = promo.branchSlugs.map((slug) => {
      const branchId = branchIdBySlug.get(slug);
      if (!branchId) {
        throw new Error(`Magasin inconnu "${slug}" référencé par la promotion ${promo.slug}`);
      }
      return { branchId };
    });

    // Identification par `slug` (Phase 9, §1/§21) — remplace l'ancienne
    // identification par `image` : `slug` est désormais unique en base
    // (migration `20260830010000_promotion_pricing`), donc un identifiant
    // stable et lisible plutôt qu'un chemin d'image utilisé par convention.
    const existing = await prisma.promotion.findFirst({ where: { slug: promo.slug } });
    if (existing) {
      await prisma.promotionBranch.deleteMany({ where: { promotionId: existing.id } });
      await prisma.promotionTranslation.deleteMany({ where: { promotionId: existing.id } });
      await prisma.promotion.delete({ where: { id: existing.id } });
    }

    await prisma.promotion.create({
      data: {
        slug: promo.slug,
        image: promo.image,
        // Tarification structurée (§1/§2/§4/§5) — `undefined` pour les
        // promotions éditoriales sans produit (Prisma omet alors le champ,
        // qui reste `null`/valeur par défaut en base, jamais une valeur
        // inventée). `price`/`originalPrice` sont des chaînes décimales
        // ("29.90") : Prisma les convertit en `Decimal` côté colonne
        // `@db.Decimal(10,2)`, sans jamais transiter par un `Float` JS.
        price: promo.price,
        originalPrice: promo.originalPrice,
        currency: promo.currency ?? "ILS",
        unit: promo.unit ?? "UNIT",
        startDate: new Date(`${promo.startDate}T00:00:00.000Z`),
        endDate: new Date(`${promo.endDate}T23:59:59.000Z`),
        status: promo.status,
        appliesToAll: promo.appliesToAll,
        isFeatured: promo.isFeatured ?? false,
        priority: promo.priority ?? 0,
        isDemo: true,
        translations: {
          create: locales.map((locale) => ({
            locale: locale as Locale,
            productName: promo.translations[locale].productName,
            title: promo.translations[locale].title,
            description: promo.translations[locale].description,
            ctaLabel: promo.translations[locale].ctaLabel,
          })),
        },
        branches: { create: branchConnections },
      },
    });
    count += 1;
  }

  console.log(`  Promotions : ${count}`);
}

async function seedAdminUsers() {
  // Phase 9, §1 : « les utilisateurs DEMO ne doivent jamais être créés
  // automatiquement en production » — garde explicite sur `NODE_ENV`,
  // jamais une simple convention documentée mais non vérifiée. En
  // production, un `AdminUser` réel doit être créé manuellement (script
  // ponctuel / accès direct base), jamais par ce seed.
  if (process.env.NODE_ENV === "production") {
    console.log("  Comptes admin DEMO : ignorés (NODE_ENV=production, §1 Phase 9)");
    return;
  }

  // Mots de passe DEMO — à faire tourner avant tout déploiement réel (§56-58).
  const superAdminPassword = await bcrypt.hash("Demo1234!SuperAdmin", 12);
  const editorPassword = await bcrypt.hash("Demo1234!Editor", 12);

  await prisma.adminUser.upsert({
    where: { email: "admin@maayan2000-demo.local" },
    create: {
      email: "admin@maayan2000-demo.local",
      passwordHash: superAdminPassword,
      name: "Admin Démo",
      role: "SUPER_ADMIN",
    },
    update: {},
  });

  await prisma.adminUser.upsert({
    where: { email: "editor@maayan2000-demo.local" },
    create: {
      email: "editor@maayan2000-demo.local",
      passwordHash: editorPassword,
      name: "Éditeur Démo",
      role: "EDITOR",
    },
    update: {},
  });

  console.log("  Comptes admin DEMO : 2 (SUPER_ADMIN, EDITOR — voir README pour les identifiants)");
}

async function main() {
  console.log("Seed Maayan 2000 — données DEMO\n");

  console.log("Villes…");
  const cityIdBySlug = await seedCities();

  console.log("Services…");
  const serviceIdBySlug = await seedServices();

  console.log("Magasins…");
  const branchIdBySlug = await seedBranches(cityIdBySlug, serviceIdBySlug);

  console.log("Promotions…");
  await seedPromotions(branchIdBySlug);

  console.log("Comptes admin…");
  await seedAdminUsers();

  console.log("\nSeed terminé.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
