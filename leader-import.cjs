const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const apply = process.argv.includes('--apply');
if (process.argv.some(arg => arg.startsWith('--') && arg !== '--apply')) {
  throw new Error('Option inconnue');
}

process.loadEnvFile();

const dbUrl = new URL(process.env.DATABASE_URL);
if (dbUrl.pathname !== '/leader_branch_locator') {
  throw new Error('SÉCURITÉ : base PostgreSQL inattendue');
}

const stores = JSON.parse(fs.readFileSync('leader-import-plan.json', 'utf8'));
const citySlugs = JSON.parse(fs.readFileSync('leader-city-slugs.json', 'utf8'));

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

async function main() {
  const citiesHe = [...new Set(stores.map(s => s.cityHe))];

  if (stores.length !== 48 || citiesHe.length !== 30) {
    throw new Error('Nombre de magasins ou de villes incorrect');
  }

  if (new Set(stores.map(s => s.sourceId)).size !== 48 ||
      new Set(stores.map(s => s.slug)).size !== 48) {
    throw new Error('Identifiants de magasins en doublon');
  }

  for (const store of stores) {
    if (!citySlugs[store.cityHe]) {
      throw new Error(`Ville sans slug : ${store.cityHe}`);
    }
    if (!store.nameHe || !store.addressHe || !store.phone ||
        !Number.isFinite(store.latitude) ||
        !Number.isFinite(store.longitude) ||
        !Array.isArray(store.openingHours) ||
        store.openingHours.length !== 6) {
      throw new Error(`Données incomplètes : ${store.sourceId}`);
    }
    if (store.openingHours.some((h, i) =>
      h.dayOfWeek !== i ||
      h.isClosed !== false ||
      !/^\d{2}:\d{2}$/.test(h.openingTime) ||
      !/^\d{2}:\d{2}$/.test(h.closingTime) ||
      h.openingTime >= h.closingTime
    )) {
      throw new Error(`Horaires incorrects : ${store.sourceId}`);
    }
  }

  const existingCities = await prisma.city.findMany({
    include: { translations: true }
  });

  const existingBranches = await prisma.branch.findMany({
    select: { slug: true, branchCode: true }
  });

  if (existingBranches.length !== 0) {
    throw new Error('SÉCURITÉ : des magasins existent déjà. Import annulé.');
  }

  const bySlug = new Map(existingCities.map(c => [c.slug, c]));

  for (const cityHe of citiesHe) {
    const slug = citySlugs[cityHe];
    const existing = bySlug.get(slug);

    if (existing) {
      const he = existing.translations.find(t => t.locale === 'he');
      if (!he || he.name !== cityHe) {
        throw new Error(`Conflit sur la ville : ${slug}`);
      }
    }
  }

  const newCities = citiesHe.filter(c => !bySlug.has(citySlugs[c]));

  console.log('Base vérifiée : leader_branch_locator');
  console.log('Mode :', apply ? 'IMPORTATION RÉELLE' : 'SIMULATION');
  console.log('Magasins à créer :', stores.length);
  console.log('Villes à créer :', newCities.length);
  console.log('Villes à réutiliser :', citiesHe.length - newCities.length);
  console.log('Horaires à créer :', stores.reduce((n, s) => n + s.openingHours.length, 0));
  console.log('Traductions hébraïques de magasins :', stores.length);

  if (!apply) {
    console.log('SIMULATION TERMINÉE : aucune écriture PostgreSQL.');
    return;
  }

  await prisma.$transaction(async tx => {
    // Recontrôle dans la transaction.
    if (await tx.branch.count() !== 0) {
      throw new Error('Des magasins existent déjà : annulation.');
    }

    const cityIds = new Map();

    for (const cityHe of citiesHe) {
      const slug = citySlugs[cityHe];
      const existing = bySlug.get(slug);

      if (existing) {
        cityIds.set(cityHe, existing.id);
      } else {
        const city = await tx.city.create({
          data: {
            slug,
            isActive: true,
            translations: {
              create: [{ locale: 'he', name: cityHe }]
            }
          }
        });
        cityIds.set(cityHe, city.id);
      }
    }

    for (const store of stores) {
      const description = [
        store.accessibilityHe
          ? `נגישות:\n${store.accessibilityHe}`
          : '',
        `שעות פעילות ומועדים מיוחדים:\n${store.officialHoursHe}`,
        'לתשומת לבכם: ביום שישי מוצגות שעות הקיץ. שעות החורף עשויות להיות שונות.'
      ].filter(Boolean).join('\n\n');

      await tx.branch.create({
        data: {
          slug: store.slug,
          branchCode: store.branchCode,
          cityId: cityIds.get(store.cityHe),
          address: store.addressHe,
          phone: store.phone,
          latitude: store.latitude,
          longitude: store.longitude,
          isActive: false,
          isDemo: false,
          translations: {
            create: [{
              locale: 'he',
              displayName: store.nameHe,
              description
            }]
          },
          openingHours: {
            create: store.openingHours
          }
        }
      });
    }
  }, { timeout: 120000 });

  console.log('Importation terminée. Magasins créés INACTIFS pour contrôle.');
}

main()
  .catch(error => {
    console.error('ERREUR :', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
