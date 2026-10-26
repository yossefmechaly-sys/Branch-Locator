-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('he', 'en', 'ru', 'fr', 'es');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('SEARCH', 'BRANCH_VIEW', 'WAZE_CLICK', 'GOOGLE_MAPS_CLICK', 'APPLE_MAPS_CLICK', 'PHONE_CLICK', 'WHATSAPP_CLICK', 'GEOLOCATION_USED', 'FILTER_USED', 'LANGUAGE_CHANGED');

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_translations" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "city_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "whatsappNumber" TEXT,
    "whatsappGroupUrl" TEXT,
    "wazeUrlOverride" TEXT,
    "mainImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_translations" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,

    CONSTRAINT "branch_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_opening_hours" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openingTime" TEXT,
    "closingTime" TEXT,
    "openingTime2" TEXT,
    "closingTime2" TEXT,

    CONSTRAINT "branch_opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_opening_hours" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openingTime" TEXT,
    "closingTime" TEXT,
    "openingTime2" TEXT,
    "closingTime2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "special_opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_translations" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "service_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_services" (
    "branchId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "branch_services_pkey" PRIMARY KEY ("branchId","serviceId")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "image" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "appliesToAll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_translations" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ctaLabel" TEXT,

    CONSTRAINT "promotion_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_branches" (
    "promotionId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "promotion_branches_pkey" PRIMARY KEY ("promotionId","branchId")
);

-- CreateTable
CREATE TABLE "branch_images" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_aliases" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "search_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "branchId" TEXT,
    "locale" "Locale",
    "query" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "city_translations_cityId_locale_key" ON "city_translations"("cityId", "locale");

-- CreateIndex
CREATE INDEX "city_translations_locale_name_idx" ON "city_translations"("locale", "name");

-- CreateIndex
CREATE UNIQUE INDEX "branches_slug_key" ON "branches"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "branches_branchCode_key" ON "branches"("branchCode");

-- CreateIndex
CREATE INDEX "branches_cityId_idx" ON "branches"("cityId");

-- CreateIndex
CREATE INDEX "branches_isActive_idx" ON "branches"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "branch_translations_branchId_locale_key" ON "branch_translations"("branchId", "locale");

-- CreateIndex
CREATE INDEX "branch_translations_locale_idx" ON "branch_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "branch_opening_hours_branchId_dayOfWeek_key" ON "branch_opening_hours"("branchId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "special_opening_hours_branchId_date_idx" ON "special_opening_hours"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "service_translations_serviceId_locale_key" ON "service_translations"("serviceId", "locale");

-- CreateIndex
CREATE INDEX "promotions_status_startDate_endDate_idx" ON "promotions"("status", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_translations_promotionId_locale_key" ON "promotion_translations"("promotionId", "locale");

-- CreateIndex
CREATE INDEX "search_aliases_locale_alias_idx" ON "search_aliases"("locale", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "analytics_events_type_createdAt_idx" ON "analytics_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_branchId_idx" ON "analytics_events"("branchId");

-- AddForeignKey
ALTER TABLE "city_translations" ADD CONSTRAINT "city_translations_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_translations" ADD CONSTRAINT "branch_translations_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_opening_hours" ADD CONSTRAINT "branch_opening_hours_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_opening_hours" ADD CONSTRAINT "special_opening_hours_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_translations" ADD CONSTRAINT "service_translations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_services" ADD CONSTRAINT "branch_services_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_services" ADD CONSTRAINT "branch_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_translations" ADD CONSTRAINT "promotion_translations_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_branches" ADD CONSTRAINT "promotion_branches_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_branches" ADD CONSTRAINT "promotion_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_images" ADD CONSTRAINT "branch_images_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_aliases" ADD CONSTRAINT "search_aliases_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
