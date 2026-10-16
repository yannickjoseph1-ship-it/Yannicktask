import type {
  AquariumConfig, ConfigItem, ProductCategory, Requirement, SpeciesIndex, SpeciesRef,
} from '../types.js';

/**
 * Dérive la liste des besoins ("requirements") à partir de la configuration
 * client. Chaque besoin sera ensuite apparié à un produit du catalogue.
 *
 * Règles empiriques aquariophiles utilisées :
 *  - filtre : débit ≈ 4× le volume en eau douce, 10× en eau de mer
 *  - chauffage : ≈ 1 W / L (si une espèce demande > 22 °C)
 *  - éclairage : 10 / 25 / 45 lm par litre selon le besoin lumineux des plantes
 *  - substrat : ~5 cm d'épaisseur, densité ≈ 1,5 kg/L
 *  - sel marin : ≈ 35 g / L (bac marin)
 */

export const DECOR_SLUGS: Record<string, string> = {
  driftwood: 'Racine / bois flotté',
  rock: 'Roches',
  cave: 'Grotte / cachette',
  background: 'Poster de fond',
  'live-rock': 'Pierres vivantes',
  ornament: 'Ornement',
};

export const EQUIPMENT_SLUGS: Record<string, { category: ProductCategory; label: string; tags: string[] }> = {
  'air-pump': { category: 'ACCESSORY', label: 'Pompe à air', tags: ['air-pump'] },
  thermometer: { category: 'ACCESSORY', label: 'Thermomètre', tags: ['thermometer'] },
  net: { category: 'ACCESSORY', label: 'Épuisette', tags: ['net'] },
  'water-conditioner': { category: 'WATER_TREATMENT', label: 'Conditionneur d\'eau', tags: ['conditioner'] },
  fertilizer: { category: 'WATER_TREATMENT', label: 'Engrais plantes', tags: ['fertilizer'] },
  'test-kit': { category: 'ACCESSORY', label: 'Kit de tests', tags: ['test-kit'] },
  'protein-skimmer': { category: 'FILTER', label: 'Écumeur', tags: ['skimmer'] },
  'wave-maker': { category: 'ACCESSORY', label: 'Pompe de brassage', tags: ['wave-maker'] },
};

export interface DerivedDimensions { lengthCm: number; widthCm: number; heightCm: number }

/** Dimensions par défaut (ratio 2 : 1 : 1,1) pour un volume donné. */
export function deriveDimensions(config: AquariumConfig): DerivedDimensions {
  if (config.lengthCm && config.widthCm && config.heightCm) {
    return { lengthCm: config.lengthCm, widthCm: config.widthCm, heightCm: config.heightCm };
  }
  // V (cm³) = L * W * H avec L = 2W, H = 1.1W → V = 2.2 W³
  const w = Math.cbrt((config.volumeL * 1000) / 2.2);
  return {
    lengthCm: Math.round(2 * w),
    widthCm: Math.round(w),
    heightCm: Math.round(1.1 * w),
  };
}

/** Au-dessus de cette température minimale, l'espèce est considérée tropicale (chauffage requis). */
export const HEATER_THRESHOLD_C = 20;

const LIGHT_LM_PER_L: Record<string, number> = { LOW: 10, MEDIUM: 25, HIGH: 45 };
const LIGHT_RANK: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

function resolveSpecies(items: ConfigItem[], species: SpeciesIndex): { item: ConfigItem; sp: SpeciesRef }[] {
  const out: { item: ConfigItem; sp: SpeciesRef }[] = [];
  for (const item of items) {
    if (item.kind !== 'FISH' && item.kind !== 'INVERTEBRATE' && item.kind !== 'PLANT') continue;
    const sp = species[item.refSlug];
    if (sp) out.push({ item, sp });
  }
  return out;
}

export function deriveRequirements(config: AquariumConfig, species: SpeciesIndex): Requirement[] {
  const reqs: Requirement[] = [];
  const vol = Math.max(1, Math.round(config.volumeL));
  const dims = deriveDimensions(config);
  const living = resolveSpecies(config.items, species);
  const animals = living.filter((l) => l.sp.kind !== 'PLANT');
  const plants = living.filter((l) => l.sp.kind === 'PLANT');
  const speciesSlugs = living.map((l) => l.sp.slug);
  const isMarine = config.waterType === 'MARINE';

  // --- Bac -------------------------------------------------------------
  reqs.push({
    key: 'tank',
    category: 'TANK',
    label: `Aquarium ≈ ${vol} L`,
    quantity: 1,
    hard: {},
    soft: {
      targets: { volumeL: { value: vol, underPenalty: 2.5, overPenalty: 1.2 } },
      tags: isMarine ? { marine: 0.5 } : {},
    },
    optional: false,
    reason: `Volume cible ${vol} L (${dims.lengthCm}×${dims.widthCm}×${dims.heightCm} cm)`,
  });

  // --- Filtration ------------------------------------------------------
  const flowFactor = isMarine ? 10 : 4;
  const flowTags: Record<string, number> = {};
  const flows = animals.map((a) => a.sp.flowPreference);
  if (flows.includes('LOW') && !flows.includes('HIGH')) flowTags['gentle-flow'] = 1;
  if (flows.includes('HIGH') && !flows.includes('LOW')) flowTags['strong-flow'] = 1;
  if (animals.some((a) => a.sp.kind === 'INVERTEBRATE' || a.sp.adultSizeCm <= 3)) flowTags['shrimp-safe'] = 0.6;
  reqs.push({
    key: 'filter',
    category: 'FILTER',
    label: 'Filtre',
    quantity: 1,
    hard: { volumeL: vol },
    soft: {
      targets: { flowLph: { value: vol * flowFactor, underPenalty: 2, overPenalty: 0.8 } },
      tags: flowTags,
      speciesSlugs,
    },
    optional: false,
    reason: `Débit conseillé ≈ ${flowFactor}× le volume soit ${vol * flowFactor} L/h`,
  });

  // --- Chauffage -------------------------------------------------------
  const needsHeater = living.some((l) => l.sp.tempMinC >= HEATER_THRESHOLD_C) || isMarine;
  if (needsHeater) {
    reqs.push({
      key: 'heater',
      category: 'HEATER',
      label: 'Chauffage',
      quantity: 1,
      hard: { volumeL: vol },
      soft: { targets: { powerW: { value: vol, underPenalty: 2, overPenalty: 0.6 } } },
      optional: false,
      reason: `Puissance conseillée ≈ 1 W/L soit ${vol} W`,
    });
  }

  // --- Éclairage -------------------------------------------------------
  const maxLight = plants.reduce<string>((acc, p) => {
    const need = p.sp.lightNeed ?? 'LOW';
    return LIGHT_RANK[need] > LIGHT_RANK[acc] ? need : acc;
  }, 'LOW');
  const lightTags: Record<string, number> = {};
  if (plants.length > 0) lightTags['plant-growth'] = 1;
  if (maxLight === 'HIGH') lightTags['high-light'] = 0.8;
  if (isMarine) lightTags['reef'] = 0.8;
  reqs.push({
    key: 'light',
    category: 'LIGHT',
    label: 'Éclairage',
    quantity: 1,
    hard: { volumeL: vol },
    soft: {
      targets: {
        lumens: { value: vol * (plants.length ? LIGHT_LM_PER_L[maxLight] : 8), underPenalty: 1.5, overPenalty: 0.5 },
        lengthCm: { value: dims.lengthCm, underPenalty: 1.5, overPenalty: 1.5 },
      },
      tags: lightTags,
    },
    optional: plants.length === 0,
    reason: plants.length
      ? `Plantes à besoin lumineux ${maxLight}, cible ≈ ${LIGHT_LM_PER_L[maxLight]} lm/L`
      : 'Éclairage de confort (pas de plantes)',
  });

  // --- Substrat --------------------------------------------------------
  const surfaceCm2 = dims.lengthCm * dims.widthCm;
  const substrateKg = Math.max(1, Math.round((surfaceCm2 * 5) / 1000 * 1.5)); // 5 cm d'épaisseur, 1.5 kg/L
  const rootedPlants = plants.some((p) => p.sp.rooted);
  const diggers = animals.some((a) => a.sp.tags.includes('digger') || a.sp.tags.includes('bottom-dweller'));
  reqs.push({
    key: 'substrate',
    category: 'SUBSTRATE',
    label: rootedPlants ? 'Sol nutritif' : 'Sable / gravier',
    quantity: 1,
    amount: { attribute: 'weightKg', value: substrateKg, unit: 'kg' },
    hard: {},
    soft: {
      tags: {
        ...(rootedPlants ? { 'plant-substrate': 1 } : { sand: 0.5, gravel: 0.5 }),
        ...(diggers ? { 'fine-sand': 0.8 } : {}),
        ...(isMarine ? { aragonite: 1 } : {}),
      },
    },
    optional: false,
    reason: `≈ ${substrateKg} kg pour ${surfaceCm2} cm² sur 5 cm`,
  });

  // --- CO2 -------------------------------------------------------------
  if (plants.some((p) => p.sp.needsCo2)) {
    reqs.push({
      key: 'co2',
      category: 'CO2',
      label: 'Kit CO2',
      quantity: 1,
      hard: { volumeL: vol },
      soft: { tags: { 'co2-kit': 1 } },
      optional: true,
      reason: 'Au moins une plante exigeante en CO2',
    });
  }

  // --- Vivant & plantes -----------------------------------------------
  for (const { item, sp } of living) {
    const category: ProductCategory = sp.kind;
    reqs.push({
      key: `${sp.kind.toLowerCase()}:${sp.slug}`,
      category,
      label: `${sp.commonName} ×${item.quantity}`,
      quantity: item.quantity,
      hard: { speciesSlug: sp.slug },
      soft: {},
      optional: false,
      reason: sp.scientificName ? `${sp.scientificName}` : sp.commonName,
    });
  }

  // --- Décor -----------------------------------------------------------
  for (const item of config.items) {
    if (item.kind !== 'DECOR') continue;
    const label = DECOR_SLUGS[item.refSlug] ?? item.refSlug;
    reqs.push({
      key: `decor:${item.refSlug}`,
      category: 'DECOR',
      label: `${label} ×${item.quantity}`,
      quantity: item.quantity,
      hard: { tags: [item.refSlug] },
      soft: { speciesSlugs, tags: animals.some((a) => a.sp.tags.includes('cave-dweller')) ? { cave: 0.5 } : {} },
      optional: false,
      reason: 'Décor demandé par le client',
    });
  }

  // --- Matériel explicite ---------------------------------------------
  for (const item of config.items) {
    if (item.kind !== 'EQUIPMENT') continue;
    const def = EQUIPMENT_SLUGS[item.refSlug];
    if (!def) continue;
    reqs.push({
      key: `equipment:${item.refSlug}`,
      category: def.category,
      label: `${def.label} ×${item.quantity}`,
      quantity: item.quantity,
      hard: { tags: def.tags },
      soft: {},
      optional: false,
      reason: 'Matériel demandé par le client',
    });
  }

  // --- Consommables implicites ----------------------------------------
  if (isMarine) {
    const saltKg = Math.max(1, Math.ceil((vol * 35) / 1000));
    reqs.push({
      key: 'marine-salt',
      category: 'WATER_TREATMENT',
      label: 'Sel marin',
      quantity: 1,
      amount: { attribute: 'weightKg', value: saltKg, unit: 'kg' },
      hard: { tags: ['marine-salt'] },
      soft: {},
      optional: false,
      reason: `≈ 35 g/L soit ${saltKg} kg`,
    });
  }
  if (!config.items.some((i) => i.kind === 'EQUIPMENT' && i.refSlug === 'water-conditioner')) {
    reqs.push({
      key: 'conditioner',
      category: 'WATER_TREATMENT',
      label: 'Conditionneur d\'eau',
      quantity: 1,
      hard: { tags: ['conditioner'] },
      soft: {},
      optional: true,
      reason: 'Recommandé pour la mise en eau',
    });
  }
  if (animals.length > 0) {
    const foodTags: Record<string, number> = {};
    if (animals.some((a) => a.sp.tags.includes('herbivore'))) foodTags['vegetable'] = 1;
    if (animals.some((a) => a.sp.tags.includes('bottom-dweller'))) foodTags['sinking'] = 1;
    if (animals.some((a) => a.sp.kind === 'INVERTEBRATE')) foodTags['shrimp'] = 0.7;
    reqs.push({
      key: 'food',
      category: 'FOOD',
      label: 'Nourriture',
      quantity: 1,
      hard: {},
      soft: { tags: foodTags, speciesSlugs },
      optional: true,
      reason: 'Alimentation adaptée aux espèces choisies',
    });
  }

  return reqs;
}
