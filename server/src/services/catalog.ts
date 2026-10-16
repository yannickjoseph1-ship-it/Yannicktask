import { prisma } from '../lib/prisma.js';
import type { CatalogProduct, SpeciesIndex, SpeciesRef } from '../domain/types.js';

/**
 * Charge le catalogue "actif" vu par le moteur de matching :
 * uniquement les produits des magasins dont l'abonnement est ACTIF.
 */
export async function loadActiveCatalog(): Promise<CatalogProduct[]> {
  const products = await prisma.product.findMany({
    where: { active: true, stockQty: { gt: 0 }, shop: { subscriptionStatus: 'ACTIVE', subscriptionTier: { not: 'NONE' } } },
    include: { shop: { select: { id: true, name: true, subscriptionTier: true } } },
  });
  return products.map((p) => ({
    id: p.id,
    shopId: p.shop.id,
    shopName: p.shop.name,
    shopTier: p.shop.subscriptionTier,
    externalRef: p.externalRef,
    name: p.name,
    brand: p.brand,
    category: p.category,
    priceCents: Math.round(Number(p.price) * 100),
    currency: p.currency,
    stockQty: p.stockQty,
    tags: p.tags,
    compatibleSpecies: p.compatibleSpecies,
    speciesSlug: p.speciesSlug,
    waterTypes: p.waterTypes,
    minVolumeL: p.minVolumeL,
    maxVolumeL: p.maxVolumeL,
    attributes: (p.attributes ?? {}) as Record<string, unknown>,
    imageUrl: p.imageUrl,
  }));
}

export async function loadSpeciesIndex(): Promise<SpeciesIndex> {
  const rows = await prisma.species.findMany();
  const index: SpeciesIndex = {};
  for (const s of rows) index[s.slug] = toSpeciesRef(s);
  return index;
}

export function toSpeciesRef(s: Awaited<ReturnType<typeof prisma.species.findMany>>[number]): SpeciesRef {
  return {
    slug: s.slug,
    commonName: s.commonName,
    scientificName: s.scientificName,
    kind: s.kind,
    waterType: s.waterType,
    minVolumeL: s.minVolumeL,
    tempMinC: s.tempMinC,
    tempMaxC: s.tempMaxC,
    phMin: s.phMin,
    phMax: s.phMax,
    adultSizeCm: s.adultSizeCm,
    temperament: s.temperament,
    minGroupSize: s.minGroupSize,
    eatsPlants: s.eatsPlants,
    finNipper: s.finNipper,
    longFins: s.longFins,
    predatorThresholdCm: s.predatorThresholdCm,
    flowPreference: s.flowPreference,
    lightNeed: s.lightNeed,
    needsCo2: s.needsCo2,
    rooted: s.rooted,
    incompatibleWith: s.incompatibleWith,
    tags: s.tags,
    color: s.color,
  };
}
