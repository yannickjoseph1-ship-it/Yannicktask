/**
 * Seed de démonstration :
 *  - référentiel espèces
 *  - 1 client démo, 3 magasins (premium, standard, sans abonnement)
 *  - catalogues générés via le même importeur que l'upload magasin
 *
 * Comptes : client@demo.fr / password123 — aqualyon@demo.fr, recif@demo.fr, nord@demo.fr / password123
 */
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/auth.js';
import { importCatalog } from '../src/services/catalog-import.js';
import { SPECIES } from './species-data.js';

type Row = Record<string, unknown>;

/** Génère un catalogue réaliste pour un magasin, avec variation de prix. */
function buildCatalog(prefix: string, priceFactor: number, opts: { marine: boolean; fishSlugs: string[]; plantSlugs: string[]; invertSlugs: string[] }): Row[] {
  const rows: Row[] = [];
  const price = (p: number) => Math.round(p * priceFactor * 100) / 100;
  const push = (r: Row) => rows.push({ ...r, ref: `${prefix}-${r.ref}` });

  // Bacs
  for (const [vol, L, p] of [[30, 40, 59], [60, 60, 99], [100, 80, 169], [180, 100, 299], [240, 120, 399], [350, 130, 649], [450, 150, 899]] as const) {
    push({ ref: `tank-${vol}`, name: `Aquarium ${vol} L (${L} cm)`, category: 'TANK', price: price(p), stock: 5, tags: 'glass|kit', attributes: { volumeL: vol, lengthCm: L } });
  }
  if (opts.marine) push({ ref: 'tank-marine-250', name: 'Bac récifal 250 L avec décantation', category: 'TANK', price: price(1290), stock: 2, tags: 'marine|sump', water_types: 'MARINE', attributes: { volumeL: 250, lengthCm: 120 } });

  // Filtres
  push({ ref: 'filter-int-200', name: 'Filtre interne 200 L/h', category: 'FILTER', price: price(19.9), stock: 20, tags: 'internal|gentle-flow|shrimp-safe', min_volume_l: 10, max_volume_l: 50, attributes: { flowLph: 200 } });
  push({ ref: 'filter-int-400', name: 'Filtre interne 400 L/h', category: 'FILTER', price: price(29.9), stock: 20, tags: 'internal', min_volume_l: 40, max_volume_l: 100, attributes: { flowLph: 400 } });
  push({ ref: 'filter-ext-600', name: 'Filtre externe 600 L/h', category: 'FILTER', price: price(89), stock: 8, tags: 'external|quiet', min_volume_l: 60, max_volume_l: 150, attributes: { flowLph: 600 } });
  push({ ref: 'filter-ext-1000', name: 'Filtre externe 1000 L/h', category: 'FILTER', price: price(139), stock: 6, tags: 'external|quiet|strong-flow', min_volume_l: 120, max_volume_l: 300, attributes: { flowLph: 1000 } });
  push({ ref: 'filter-ext-1500', name: 'Filtre externe 1500 L/h', category: 'FILTER', price: price(199), stock: 4, tags: 'external|strong-flow', min_volume_l: 250, max_volume_l: 600, attributes: { flowLph: 1500 } });
  push({ ref: 'filter-sponge', name: 'Filtre exhausteur double', category: 'FILTER', price: price(14.9), stock: 30, tags: 'sponge|gentle-flow|shrimp-safe', min_volume_l: 10, max_volume_l: 80, attributes: { flowLph: 250 } });
  if (opts.marine) push({ ref: 'skimmer-300', name: 'Écumeur interne 300 L', category: 'FILTER', price: price(179), stock: 3, tags: 'skimmer|marine', water_types: 'MARINE', min_volume_l: 100, max_volume_l: 300, attributes: { flowLph: 2500 } });

  // Chauffages
  for (const [w, p, lo, hi] of [[25, 15.9, 10, 30], [50, 18.9, 25, 60], [100, 22.9, 50, 120], [150, 26.9, 100, 200], [200, 29.9, 150, 300], [300, 36.9, 250, 450]] as const) {
    push({ ref: `heater-${w}`, name: `Chauffage ${w} W`, category: 'HEATER', price: price(p), stock: 15, min_volume_l: lo, max_volume_l: hi, attributes: { powerW: w } });
  }

  // Éclairage
  for (const [len, lm, p, lo, hi, tags] of [
    [40, 600, 29.9, 10, 40, 'led'], [60, 1200, 44.9, 30, 80, 'led'], [80, 2200, 69.9, 60, 150, 'led|plant-growth'],
    [100, 3600, 99, 100, 250, 'led|plant-growth|high-light'], [120, 5400, 149, 150, 400, 'led|plant-growth|high-light'],
  ] as const) {
    push({ ref: `light-${len}`, name: `Rampe LED ${len} cm`, category: 'LIGHT', price: price(p), stock: 10, tags, min_volume_l: lo, max_volume_l: hi, attributes: { lengthCm: len, lumens: lm } });
  }
  if (opts.marine) push({ ref: 'light-reef-90', name: 'Rampe LED récifale 90 cm', category: 'LIGHT', price: price(329), stock: 2, tags: 'led|reef|high-light', water_types: 'MARINE', min_volume_l: 100, max_volume_l: 400, attributes: { lengthCm: 90, lumens: 9000 } });

  // Substrats
  push({ ref: 'sand-10', name: 'Sable de Loire 10 kg', category: 'SUBSTRATE', price: price(12.9), stock: 40, tags: 'sand|fine-sand', attributes: { weightKg: 10 } });
  push({ ref: 'gravel-10', name: 'Gravier naturel 10 kg', category: 'SUBSTRATE', price: price(11.9), stock: 40, tags: 'gravel', attributes: { weightKg: 10 } });
  push({ ref: 'soil-3', name: 'Sol nutritif 3 kg', category: 'SUBSTRATE', price: price(14.9), stock: 30, tags: 'plant-substrate', attributes: { weightKg: 3 } });
  push({ ref: 'soil-9', name: 'Sol nutritif 9 kg', category: 'SUBSTRATE', price: price(34.9), stock: 20, tags: 'plant-substrate', attributes: { weightKg: 9 } });
  if (opts.marine) push({ ref: 'aragonite-10', name: 'Sable aragonite 10 kg', category: 'SUBSTRATE', price: price(29.9), stock: 10, tags: 'aragonite|sand|marine', water_types: 'MARINE', attributes: { weightKg: 10 } });

  // CO2
  push({ ref: 'co2-kit', name: 'Kit CO2 bouteille 2 kg + détendeur', category: 'CO2', price: price(189), stock: 5, tags: 'co2-kit', min_volume_l: 50, max_volume_l: 500 });
  push({ ref: 'co2-nano', name: 'Kit CO2 nano jetable', category: 'CO2', price: price(49.9), stock: 10, tags: 'co2-kit|nano', min_volume_l: 10, max_volume_l: 80 });

  // Décor
  push({ ref: 'driftwood-m', name: 'Racine Mopani M', category: 'DECOR', price: price(19.9), stock: 10, tags: 'driftwood|wood' });
  push({ ref: 'driftwood-l', name: 'Racine araignée L', category: 'DECOR', price: price(39.9), stock: 5, tags: 'driftwood|wood|large' });
  push({ ref: 'rock-dragon', name: 'Roche Dragon (le kg)', category: 'DECOR', price: price(6.9), stock: 50, tags: 'rock|hardscape' });
  push({ ref: 'rock-seiryu', name: 'Roche Seiryu (le kg)', category: 'DECOR', price: price(8.9), stock: 50, tags: 'rock|hardscape' });
  push({ ref: 'cave-ceramic', name: 'Grotte céramique', category: 'DECOR', price: price(9.9), stock: 20, tags: 'cave|ceramic', compatible_species: 'ancistrus|german-blue-ram|kuhli-loach' });
  push({ ref: 'background-poster', name: 'Poster de fond 100×50', category: 'DECOR', price: price(7.9), stock: 20, tags: 'background' });
  if (opts.marine) push({ ref: 'live-rock', name: 'Pierre vivante (le kg)', category: 'DECOR', price: price(14.9), stock: 60, tags: 'live-rock|rock|marine', water_types: 'MARINE' });

  // Vivant & plantes
  const livestockPrices: Record<string, number> = {
    'neon-tetra': 1.9, 'cardinal-tetra': 2.9, guppy: 3.5, endler: 2.9, platy: 3.2, 'betta-splendens': 12.9, 'dwarf-gourami': 7.9,
    'corydoras-paleatus': 4.5, 'corydoras-panda': 5.9, otocinclus: 3.9, ancistrus: 6.9, 'harlequin-rasbora': 2.5, 'zebra-danio': 2.2,
    'tiger-barb': 2.9, 'cherry-barb': 2.9, angelfish: 9.9, discus: 49, 'german-blue-ram': 9.9, 'kuhli-loach': 4.9, goldfish: 4.9,
    'white-cloud-minnow': 1.9, oscar: 14.9, 'hillstream-loach': 12.9, 'bumblebee-goby': 5.9, 'figure-8-puffer': 14.9,
    clownfish: 29, 'royal-gramma': 39, firefish: 29, 'yellow-tang': 89,
    'red-cherry-shrimp': 2.5, 'amano-shrimp': 3.9, 'nerite-snail': 3.5, 'cleaner-shrimp': 34,
  };
  const marineSlugs = new Set(['clownfish', 'royal-gramma', 'firefish', 'yellow-tang', 'cleaner-shrimp', 'caulerpa']);
  const brackish = new Set(['bumblebee-goby', 'figure-8-puffer']);
  const waterOf = (slug: string) => (marineSlugs.has(slug) ? 'MARINE' : brackish.has(slug) ? 'BRACKISH' : 'FRESH');
  for (const slug of opts.fishSlugs) {
    const sp = SPECIES.find((s) => s.slug === slug)!;
    push({ ref: `fish-${slug}`, name: sp.commonName, category: 'FISH', price: price(livestockPrices[slug] ?? 4.9), stock: 30, species_slug: slug, water_types: waterOf(slug) });
  }
  for (const slug of opts.invertSlugs) {
    const sp = SPECIES.find((s) => s.slug === slug)!;
    push({ ref: `inv-${slug}`, name: sp.commonName, category: 'INVERTEBRATE', price: price(livestockPrices[slug] ?? 3.5), stock: 50, species_slug: slug, water_types: waterOf(slug) });
  }
  for (const slug of opts.plantSlugs) {
    const sp = SPECIES.find((s) => s.slug === slug)!;
    const p = sp.needsCo2 ? 7.9 : sp.rooted === false ? 6.9 : 4.9;
    push({ ref: `plant-${slug}`, name: `${sp.commonName} (pot)`, category: 'PLANT', price: price(p), stock: 25, species_slug: slug, water_types: waterOf(slug) });
  }

  // Consommables & accessoires
  push({ ref: 'conditioner-250', name: 'Conditionneur d\'eau 250 ml', category: 'WATER_TREATMENT', price: price(8.9), stock: 40, tags: 'conditioner' });
  push({ ref: 'fertilizer-500', name: 'Engrais liquide plantes 500 ml', category: 'WATER_TREATMENT', price: price(12.9), stock: 30, tags: 'fertilizer' });
  if (opts.marine) push({ ref: 'salt-10', name: 'Sel marin récifal 10 kg', category: 'WATER_TREATMENT', price: price(44.9), stock: 10, tags: 'marine-salt|marine', water_types: 'MARINE', attributes: { weightKg: 10 } });
  push({ ref: 'food-flakes', name: 'Flocons tropicaux 100 g', category: 'FOOD', price: price(5.9), stock: 50, tags: 'flakes|tropical' });
  push({ ref: 'food-wafers', name: 'Pastilles de fond 100 g', category: 'FOOD', price: price(6.9), stock: 50, tags: 'sinking|vegetable', compatible_species: 'corydoras-paleatus|corydoras-panda|ancistrus|otocinclus|kuhli-loach' });
  push({ ref: 'food-shrimp', name: 'Granulés crevettes 50 g', category: 'FOOD', price: price(7.9), stock: 30, tags: 'shrimp|sinking', compatible_species: 'red-cherry-shrimp|amano-shrimp' });
  push({ ref: 'air-pump', name: 'Pompe à air 100 L/h', category: 'ACCESSORY', price: price(14.9), stock: 20, tags: 'air-pump' });
  push({ ref: 'thermometer', name: 'Thermomètre digital', category: 'ACCESSORY', price: price(4.9), stock: 50, tags: 'thermometer' });
  push({ ref: 'net', name: 'Épuisette 10 cm', category: 'ACCESSORY', price: price(2.9), stock: 50, tags: 'net' });
  push({ ref: 'test-kit', name: 'Kit de tests NO2/NO3/pH/GH/KH', category: 'ACCESSORY', price: price(29.9), stock: 10, tags: 'test-kit' });
  if (opts.marine) push({ ref: 'wave-maker', name: 'Pompe de brassage 4000 L/h', category: 'ACCESSORY', price: price(49.9), stock: 8, tags: 'wave-maker|marine', water_types: 'MARINE' });

  return rows;
}

const FRESH_FISH = SPECIES.filter((s) => s.kind === 'FISH' && s.waterType === 'FRESH').map((s) => s.slug);
const FRESH_INV = SPECIES.filter((s) => s.kind === 'INVERTEBRATE' && s.waterType === 'FRESH').map((s) => s.slug);
const FRESH_PLANTS = SPECIES.filter((s) => s.kind === 'PLANT' && s.waterType === 'FRESH').map((s) => s.slug);
const MARINE_FISH = SPECIES.filter((s) => s.kind === 'FISH' && s.waterType !== 'FRESH').map((s) => s.slug);
const MARINE_INV = SPECIES.filter((s) => s.kind === 'INVERTEBRATE' && s.waterType === 'MARINE').map((s) => s.slug);

async function main() {
  console.log('→ Référentiel espèces');
  for (const s of SPECIES) {
    await prisma.species.upsert({ where: { slug: s.slug }, create: s, update: s });
  }

  const passwordHash = await hashPassword('password123');
  console.log('→ Comptes démo');
  await prisma.user.upsert({
    where: { email: 'client@demo.fr' },
    create: { email: 'client@demo.fr', passwordHash, role: 'CLIENT', displayName: 'Camille (client démo)' },
    update: {},
  });

  const shops = [
    { email: 'aqualyon@demo.fr', name: 'Aqua Lyon', city: 'Lyon', tier: 'PREMIUM' as const, prefix: 'AL', factor: 1.0, marine: false, fish: FRESH_FISH, inv: FRESH_INV, plants: FRESH_PLANTS },
    { email: 'recif@demo.fr', name: 'Récif & Co', city: 'Marseille', tier: 'STANDARD' as const, prefix: 'RC', factor: 0.95, marine: true, fish: [...MARINE_FISH, ...FRESH_FISH.slice(0, 12)], inv: [...MARINE_INV, ...FRESH_INV.slice(0, 2)], plants: [...FRESH_PLANTS.slice(0, 8), 'caulerpa'] },
    { email: 'nord@demo.fr', name: 'Poissons du Nord', city: 'Lille', tier: 'NONE' as const, prefix: 'PN', factor: 0.85, marine: false, fish: FRESH_FISH.slice(0, 8), inv: FRESH_INV, plants: FRESH_PLANTS.slice(0, 5) },
  ];

  for (const s of shops) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email, passwordHash, role: 'SHOP', displayName: s.name,
        shop: { create: { name: s.name, city: s.city, description: `${s.name} — magasin de démonstration`, subscriptionTier: s.tier, subscriptionStatus: s.tier === 'NONE' ? 'INACTIVE' : 'ACTIVE', currentPeriodEnd: s.tier === 'NONE' ? null : new Date(Date.now() + 30 * 86400000) } },
      },
      update: {},
      include: { shop: true },
    });
    const rows = buildCatalog(s.prefix, s.factor, { marine: s.marine, fishSlugs: s.fish, invertSlugs: s.inv, plantSlugs: s.plants });
    const report = await importCatalog(user.shop!.id, rows);
    console.log(`→ ${s.name} (${s.tier}) : ${report.imported} produits importés${report.errors.length ? `, ${report.errors.length} erreurs` : ''}`);
    for (const e of report.errors) console.warn('   ligne', e.row, e.message);
  }

  console.log('✔ Seed terminé. Comptes : client@demo.fr, aqualyon@demo.fr, recif@demo.fr, nord@demo.fr (mot de passe : password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
