-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'SHOP');

-- CreateEnum
CREATE TYPE "WaterType" AS ENUM ('FRESH', 'MARINE', 'BRACKISH');

-- CreateEnum
CREATE TYPE "SpeciesKind" AS ENUM ('FISH', 'INVERTEBRATE', 'PLANT');

-- CreateEnum
CREATE TYPE "Temperament" AS ENUM ('PEACEFUL', 'SEMI_AGGRESSIVE', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "FlowPreference" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "LightNeed" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('TANK', 'FILTER', 'HEATER', 'LIGHT', 'SUBSTRATE', 'CO2', 'DECOR', 'FISH', 'INVERTEBRATE', 'PLANT', 'FOOD', 'WATER_TREATMENT', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('NONE', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "ItemKind" AS ENUM ('FISH', 'INVERTEBRATE', 'PLANT', 'DECOR', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "PricePreference" AS ENUM ('ECO', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "QuoteLineStatus" AS ENUM ('MATCHED', 'UNMATCHED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "description" TEXT,
    "website" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'NONE',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "externalRef" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "ProductCategory" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "compatibleSpecies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "speciesSlug" TEXT,
    "waterTypes" "WaterType"[] DEFAULT ARRAY[]::"WaterType"[],
    "minVolumeL" INTEGER,
    "maxVolumeL" INTEGER,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "scientificName" TEXT,
    "kind" "SpeciesKind" NOT NULL,
    "waterType" "WaterType" NOT NULL,
    "minVolumeL" INTEGER NOT NULL,
    "tempMinC" DOUBLE PRECISION NOT NULL,
    "tempMaxC" DOUBLE PRECISION NOT NULL,
    "phMin" DOUBLE PRECISION NOT NULL,
    "phMax" DOUBLE PRECISION NOT NULL,
    "adultSizeCm" DOUBLE PRECISION NOT NULL,
    "temperament" "Temperament" NOT NULL DEFAULT 'PEACEFUL',
    "minGroupSize" INTEGER NOT NULL DEFAULT 1,
    "eatsPlants" BOOLEAN NOT NULL DEFAULT false,
    "finNipper" BOOLEAN NOT NULL DEFAULT false,
    "longFins" BOOLEAN NOT NULL DEFAULT false,
    "predatorThresholdCm" DOUBLE PRECISION,
    "flowPreference" "FlowPreference" NOT NULL DEFAULT 'MEDIUM',
    "lightNeed" "LightNeed",
    "needsCo2" BOOLEAN NOT NULL DEFAULT false,
    "rooted" BOOLEAN NOT NULL DEFAULT true,
    "incompatibleWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color" TEXT NOT NULL DEFAULT '#8fb3c9',

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aquarium" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volumeL" INTEGER NOT NULL,
    "waterType" "WaterType" NOT NULL,
    "lengthCm" INTEGER,
    "widthCm" INTEGER,
    "heightCm" INTEGER,
    "pricePreference" "PricePreference" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aquarium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AquariumItem" (
    "id" TEXT NOT NULL,
    "aquariumId" TEXT NOT NULL,
    "kind" "ItemKind" NOT NULL,
    "refSlug" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "speciesId" TEXT,

    CONSTRAINT "AquariumItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "aquariumId" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "coverage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "requirementKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "QuoteLineStatus" NOT NULL,
    "productId" TEXT,
    "shopId" TEXT,
    "unitPriceCents" INTEGER,
    "score" DOUBLE PRECISION,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_userId_key" ON "Shop"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_stripeCustomerId_key" ON "Shop"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_stripeSubscriptionId_key" ON "Shop"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Product_category_active_idx" ON "Product"("category", "active");

-- CreateIndex
CREATE INDEX "Product_speciesSlug_idx" ON "Product"("speciesSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_externalRef_key" ON "Product"("shopId", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "Species"("slug");

-- CreateIndex
CREATE INDEX "AquariumItem_aquariumId_idx" ON "AquariumItem"("aquariumId");

-- CreateIndex
CREATE INDEX "QuoteLine_shopId_idx" ON "QuoteLine"("shopId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aquarium" ADD CONSTRAINT "Aquarium_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AquariumItem" ADD CONSTRAINT "AquariumItem_aquariumId_fkey" FOREIGN KEY ("aquariumId") REFERENCES "Aquarium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AquariumItem" ADD CONSTRAINT "AquariumItem_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_aquariumId_fkey" FOREIGN KEY ("aquariumId") REFERENCES "Aquarium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
