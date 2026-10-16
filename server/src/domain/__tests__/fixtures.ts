import type { CatalogProduct, SpeciesIndex, SpeciesRef } from '../types.js';

const base: Omit<SpeciesRef, 'slug' | 'commonName' | 'kind' | 'waterType' | 'minVolumeL' | 'adultSizeCm'> = {
  tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, temperament: 'PEACEFUL', minGroupSize: 1,
  eatsPlants: false, finNipper: false, longFins: false, flowPreference: 'MEDIUM', needsCo2: false,
  rooted: true, incompatibleWith: [], tags: [],
};

export const species: SpeciesIndex = {
  'neon-tetra': { ...base, slug: 'neon-tetra', commonName: 'Néon bleu', kind: 'FISH', waterType: 'FRESH', minVolumeL: 60, adultSizeCm: 3.5, minGroupSize: 8, tempMinC: 22, tempMaxC: 26 },
  'betta-splendens': { ...base, slug: 'betta-splendens', commonName: 'Combattant', kind: 'FISH', waterType: 'FRESH', minVolumeL: 20, adultSizeCm: 6, temperament: 'SEMI_AGGRESSIVE', longFins: true, flowPreference: 'LOW', tags: ['labyrinth'], tempMinC: 24, tempMaxC: 30 },
  'tiger-barb': { ...base, slug: 'tiger-barb', commonName: 'Barbus de Sumatra', kind: 'FISH', waterType: 'FRESH', minVolumeL: 100, adultSizeCm: 7, minGroupSize: 8, finNipper: true, temperament: 'SEMI_AGGRESSIVE' },
  'oscar': { ...base, slug: 'oscar', commonName: 'Oscar', kind: 'FISH', waterType: 'FRESH', minVolumeL: 400, adultSizeCm: 35, temperament: 'AGGRESSIVE', predatorThresholdCm: 8, eatsPlants: true },
  'goldfish': { ...base, slug: 'goldfish', commonName: 'Poisson rouge', kind: 'FISH', waterType: 'FRESH', minVolumeL: 100, adultSizeCm: 25, tempMinC: 10, tempMaxC: 22, eatsPlants: true, minGroupSize: 2 },
  'clownfish': { ...base, slug: 'clownfish', commonName: 'Poisson-clown', kind: 'FISH', waterType: 'MARINE', minVolumeL: 100, adultSizeCm: 9, phMin: 8, phMax: 8.4, tags: ['reef'] },
  'red-cherry-shrimp': { ...base, slug: 'red-cherry-shrimp', commonName: 'Crevette Red Cherry', kind: 'INVERTEBRATE', waterType: 'FRESH', minVolumeL: 10, adultSizeCm: 2.5, minGroupSize: 6, tempMinC: 18, tempMaxC: 28 },
  'anubias': { ...base, slug: 'anubias', commonName: 'Anubias', kind: 'PLANT', waterType: 'FRESH', minVolumeL: 10, adultSizeCm: 15, lightNeed: 'LOW', rooted: false, tempMinC: 20 },
  'rotala': { ...base, slug: 'rotala', commonName: 'Rotala', kind: 'PLANT', waterType: 'FRESH', minVolumeL: 30, adultSizeCm: 30, lightNeed: 'HIGH', needsCo2: true },
};

let seq = 0;
export function product(p: Partial<CatalogProduct> & Pick<CatalogProduct, 'category' | 'priceCents' | 'name'>): CatalogProduct {
  seq += 1;
  return {
    id: p.id ?? `p${seq}`,
    shopId: p.shopId ?? 'shopA',
    shopName: p.shopName ?? 'Aqua Shop A',
    shopTier: p.shopTier ?? 'STANDARD',
    externalRef: p.externalRef ?? `ref-${seq}`,
    currency: p.currency ?? 'EUR',
    stockQty: p.stockQty ?? 10,
    tags: p.tags ?? [],
    compatibleSpecies: p.compatibleSpecies ?? [],
    speciesSlug: p.speciesSlug ?? null,
    waterTypes: p.waterTypes ?? [],
    minVolumeL: p.minVolumeL ?? null,
    maxVolumeL: p.maxVolumeL ?? null,
    attributes: p.attributes ?? {},
    brand: p.brand ?? null,
    imageUrl: null,
    name: p.name,
    category: p.category,
    priceCents: p.priceCents,
  };
}
