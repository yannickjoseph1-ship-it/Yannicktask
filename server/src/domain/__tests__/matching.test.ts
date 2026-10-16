import { describe, expect, it } from 'vitest';
import { deriveRequirements, matchConfiguration, deriveDimensions } from '../matching/index.js';
import type { AquariumConfig, CatalogProduct } from '../types.js';
import { product, species } from './fixtures.js';

const config: AquariumConfig = {
  volumeL: 100,
  waterType: 'FRESH',
  pricePreference: 'STANDARD',
  items: [
    { kind: 'FISH', refSlug: 'neon-tetra', quantity: 10 },
    { kind: 'PLANT', refSlug: 'anubias', quantity: 3 },
    { kind: 'DECOR', refSlug: 'driftwood', quantity: 1 },
  ],
};

function catalog(): CatalogProduct[] {
  return [
    product({ name: 'Bac 60L', category: 'TANK', priceCents: 6000, attributes: { volumeL: 60 } }),
    product({ name: 'Bac 100L', category: 'TANK', priceCents: 12000, attributes: { volumeL: 100 } }),
    product({ name: 'Bac 240L', category: 'TANK', priceCents: 30000, attributes: { volumeL: 240 } }),
    product({ name: 'Filtre 300', category: 'FILTER', priceCents: 3000, minVolumeL: 30, maxVolumeL: 80, attributes: { flowLph: 300 } }),
    product({ name: 'Filtre 450', category: 'FILTER', priceCents: 5000, minVolumeL: 60, maxVolumeL: 150, attributes: { flowLph: 450 } }),
    product({ name: 'Filtre 1000', category: 'FILTER', priceCents: 9000, minVolumeL: 100, maxVolumeL: 300, attributes: { flowLph: 1000 } }),
    product({ name: 'Chauffage 100W', category: 'HEATER', priceCents: 2500, minVolumeL: 60, maxVolumeL: 150, attributes: { powerW: 100 } }),
    product({ name: 'Chauffage 25W', category: 'HEATER', priceCents: 1500, minVolumeL: 10, maxVolumeL: 40, attributes: { powerW: 25 } }),
    product({ name: 'Rampe LED 80cm', category: 'LIGHT', priceCents: 7000, minVolumeL: 60, maxVolumeL: 200, tags: ['plant-growth'], attributes: { lumens: 2500, lengthCm: 80 } }),
    product({ name: 'Sable 10kg', category: 'SUBSTRATE', priceCents: 1500, tags: ['sand'], attributes: { weightKg: 10 } }),
    product({ name: 'Sol nutritif 9L', category: 'SUBSTRATE', priceCents: 3500, tags: ['plant-substrate'], attributes: { weightKg: 9 } }),
    product({ name: 'Néon bleu', category: 'FISH', priceCents: 250, speciesSlug: 'neon-tetra', waterTypes: ['FRESH'] }),
    product({ name: 'Anubias nana', category: 'PLANT', priceCents: 700, speciesSlug: 'anubias' }),
    product({ name: 'Racine Mopani', category: 'DECOR', priceCents: 2200, tags: ['driftwood'] }),
    product({ name: 'Conditionneur', category: 'WATER_TREATMENT', priceCents: 800, tags: ['conditioner'] }),
    product({ name: 'Flocons', category: 'FOOD', priceCents: 600 }),
  ];
}

describe('deriveDimensions', () => {
  it('derives plausible dimensions from the volume', () => {
    const d = deriveDimensions({ volumeL: 100, waterType: 'FRESH', items: [] });
    expect((d.lengthCm * d.widthCm * d.heightCm) / 1000).toBeGreaterThan(85);
    expect((d.lengthCm * d.widthCm * d.heightCm) / 1000).toBeLessThan(115);
    expect(d.lengthCm).toBeGreaterThan(d.widthCm);
  });
});

describe('deriveRequirements', () => {
  it('produces one requirement per species/decor plus equipment', () => {
    const reqs = deriveRequirements(config, species);
    const keys = reqs.map((r) => r.key);
    expect(keys).toEqual(expect.arrayContaining(['tank', 'filter', 'heater', 'light', 'substrate', 'fish:neon-tetra', 'plant:anubias', 'decor:driftwood', 'food', 'conditioner']));
    expect(keys).not.toContain('co2');
    const filter = reqs.find((r) => r.key === 'filter')!;
    expect(filter.soft.targets?.flowLph.value).toBe(400);
    const heater = reqs.find((r) => r.key === 'heater')!;
    expect(heater.soft.targets?.powerW.value).toBe(100);
  });

  it('skips the heater for cold-water species and adds CO2 for demanding plants', () => {
    const cold: AquariumConfig = { volumeL: 200, waterType: 'FRESH', items: [{ kind: 'FISH', refSlug: 'goldfish', quantity: 2 }] };
    expect(deriveRequirements(cold, species).map((r) => r.key)).not.toContain('heater');
    const planted: AquariumConfig = { volumeL: 100, waterType: 'FRESH', items: [{ kind: 'PLANT', refSlug: 'rotala', quantity: 5 }] };
    const reqs = deriveRequirements(planted, species);
    expect(reqs.map((r) => r.key)).toContain('co2');
    expect(reqs.find((r) => r.key === 'substrate')!.soft.tags).toHaveProperty('plant-substrate');
    expect(reqs.find((r) => r.key === 'light')!.optional).toBe(false);
  });

  it('adds marine salt and a 10x flow target for marine tanks', () => {
    const marine: AquariumConfig = { volumeL: 200, waterType: 'MARINE', items: [{ kind: 'FISH', refSlug: 'clownfish', quantity: 2 }] };
    const reqs = deriveRequirements(marine, species);
    const salt = reqs.find((r) => r.key === 'marine-salt')!;
    expect(salt.amount).toEqual({ attribute: 'weightKg', value: 7, unit: 'kg' });
    expect(reqs.find((r) => r.key === 'filter')!.soft.targets?.flowLph.value).toBe(2000);
  });
});

describe('matchConfiguration', () => {
  it('picks the closest product per requirement and totals the budget', () => {
    const result = matchConfiguration(config, species, catalog());
    const pick = (key: string) => result.lines.find((l) => l.requirement.key === key)!.best!;

    expect(pick('tank').product.name).toBe('Bac 100L');
    expect(pick('filter').product.name).toBe('Filtre 450');
    expect(pick('heater').product.name).toBe('Chauffage 100W');
    expect(pick('fish:neon-tetra').quantity).toBe(10);
    expect(pick('fish:neon-tetra').lineTotalCents).toBe(2500);
    expect(pick('decor:driftwood').product.name).toBe('Racine Mopani');
    expect(pick('substrate').product.name).toBe('Sable 10kg'); // anubias n'est pas enracinée

    expect(result.coverage).toBe(1);
    expect(result.unmatched).toHaveLength(0);
    const sum = result.lines.reduce((s, l) => s + (l.best?.lineTotalCents ?? 0), 0);
    expect(result.totalCents).toBe(sum);
    expect(result.byCategory.FISH).toBe(2500);
  });

  it('never matches a product that fails a hard filter', () => {
    const cat = [
      product({ name: 'Filtre marin', category: 'FILTER', priceCents: 100, waterTypes: ['MARINE'], attributes: { flowLph: 400 } }),
      product({ name: 'Filtre épuisé', category: 'FILTER', priceCents: 100, stockQty: 0, attributes: { flowLph: 400 } }),
      product({ name: 'Filtre nano', category: 'FILTER', priceCents: 100, minVolumeL: 10, maxVolumeL: 30, attributes: { flowLph: 400 } }),
      product({ name: 'Guppy', category: 'FISH', priceCents: 100, speciesSlug: 'guppy' }),
      product({ name: 'Roche', category: 'DECOR', priceCents: 100, tags: ['rock'] }),
    ];
    const result = matchConfiguration(config, species, cat);
    const line = (k: string) => result.lines.find((l) => l.requirement.key === k)!;
    expect(line('filter').status).toBe('UNMATCHED');
    expect(line('fish:neon-tetra').status).toBe('UNMATCHED');
    expect(line('decor:driftwood').status).toBe('UNMATCHED');
    expect(result.coverage).toBeLessThan(1);
    expect(result.unmatched.map((r) => r.key)).toContain('tank');
  });

  it('computes quantity from the required amount (substrate in kg)', () => {
    const cfg: AquariumConfig = { volumeL: 200, waterType: 'FRESH', items: [{ kind: 'PLANT', refSlug: 'rotala', quantity: 3 }] };
    const cat = [
      product({ name: 'Sol 3kg', category: 'SUBSTRATE', priceCents: 1200, tags: ['plant-substrate'], attributes: { weightKg: 3 } }),
      product({ name: 'Sol 9kg', category: 'SUBSTRATE', priceCents: 3300, tags: ['plant-substrate'], attributes: { weightKg: 9 } }),
    ];
    const result = matchConfiguration(cfg, species, cat);
    const line = result.lines.find((l) => l.requirement.key === 'substrate')!;
    const needed = line.requirement.amount!.value;
    expect(line.best!.quantity).toBe(Math.ceil(needed / 9));
    expect(line.best!.product.name).toBe('Sol 9kg'); // moins cher au kg
    const alt = line.alternatives[0];
    expect(alt.quantity).toBe(Math.ceil(needed / 3));
  });

  it('honours the price preference', () => {
    const cfgEco: AquariumConfig = { ...config, pricePreference: 'ECO', items: [] };
    const cfgPremium: AquariumConfig = { ...config, pricePreference: 'PREMIUM', items: [] };
    const cat = [
      product({ name: 'Rampe basique', category: 'LIGHT', priceCents: 3000, attributes: { lumens: 800, lengthCm: 60 } }),
      product({ name: 'Rampe pro', category: 'LIGHT', priceCents: 15000, attributes: { lumens: 800, lengthCm: 60 } }),
    ];
    expect(matchConfiguration(cfgEco, species, cat).lines.find((l) => l.requirement.key === 'light')!.best!.product.name).toBe('Rampe basique');
    expect(matchConfiguration(cfgPremium, species, cat).lines.find((l) => l.requirement.key === 'light')!.best!.product.name).toBe('Rampe pro');
  });

  it('gives premium shops priority when products are equivalent', () => {
    const cat = [
      product({ name: 'Racine A', category: 'DECOR', priceCents: 2000, tags: ['driftwood'], shopId: 'A', shopName: 'A', shopTier: 'STANDARD' }),
      product({ name: 'Racine B', category: 'DECOR', priceCents: 2000, tags: ['driftwood'], shopId: 'B', shopName: 'B', shopTier: 'PREMIUM' }),
      product({ name: 'Racine C', category: 'DECOR', priceCents: 2000, tags: ['driftwood'], shopId: 'C', shopName: 'C', shopTier: 'STANDARD' }),
    ];
    const result = matchConfiguration(config, species, cat);
    const line = result.lines.find((l) => l.requirement.key === 'decor:driftwood')!;
    expect(line.best!.product.shopId).toBe('B');
    expect(line.best!.breakdown.premiumBoost).toBeGreaterThan(0);
    expect(line.alternatives).toHaveLength(2);
  });

  it('does not let the premium boost override a clearly better product', () => {
    const cat = [
      product({ name: 'Filtre adapté', category: 'FILTER', priceCents: 5000, attributes: { flowLph: 400 }, shopTier: 'STANDARD', shopId: 'A' }),
      product({ name: 'Filtre trop faible', category: 'FILTER', priceCents: 5000, attributes: { flowLph: 120 }, shopTier: 'PREMIUM', shopId: 'B' }),
    ];
    const result = matchConfiguration(config, species, cat);
    expect(result.lines.find((l) => l.requirement.key === 'filter')!.best!.product.name).toBe('Filtre adapté');
  });

  it('builds per-shop bundles sorted by coverage then premium then price', () => {
    const full = catalog().map((p) => ({ ...p, shopId: 'full', shopName: 'Full', shopTier: 'STANDARD' as const }));
    const partial = catalog().filter((p) => p.category !== 'FISH').map((p) => ({ ...p, shopId: 'partial', shopName: 'Partial', shopTier: 'PREMIUM' as const }));
    const result = matchConfiguration(config, species, [...full, ...partial]);
    expect(result.byShop.map((b) => b.shopId)).toEqual(['full', 'partial']);
    expect(result.byShop[0].coverage).toBe(1);
    expect(result.byShop[1].coverage).toBeLessThan(1);
    expect(result.byShop[1].lines.find((l) => l.requirementKey === 'fish:neon-tetra')!.product).toBeNull();
    expect(result.byShop[0].totalCents).toBeGreaterThan(0);
  });

  it('ignores products in another currency', () => {
    const cat = [product({ name: 'Tank USD', category: 'TANK', priceCents: 100, currency: 'USD', attributes: { volumeL: 100 } })];
    const result = matchConfiguration(config, species, cat);
    expect(result.lines.find((l) => l.requirement.key === 'tank')!.status).toBe('UNMATCHED');
  });
});
