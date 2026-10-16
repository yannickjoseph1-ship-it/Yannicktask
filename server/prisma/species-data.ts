/** Référentiel espèces de démonstration (valeurs indicatives, usage MVP). */
import type { Prisma } from '../src/generated/prisma/client.js';

type S = Prisma.SpeciesCreateInput;

const fish = (s: Partial<S> & Pick<S, 'slug' | 'commonName' | 'minVolumeL' | 'adultSizeCm' | 'color'>): S => ({
  kind: 'FISH', waterType: 'FRESH', tempMinC: 22, tempMaxC: 27, phMin: 6.0, phMax: 7.5, temperament: 'PEACEFUL',
  minGroupSize: 1, flowPreference: 'MEDIUM', ...s,
});
const plant = (s: Partial<S> & Pick<S, 'slug' | 'commonName' | 'adultSizeCm'>): S => ({
  kind: 'PLANT', waterType: 'FRESH', minVolumeL: 10, tempMinC: 20, tempMaxC: 28, phMin: 6.0, phMax: 7.5,
  lightNeed: 'MEDIUM', rooted: true, color: '#3f9d4a', ...s,
});
const invert = (s: Partial<S> & Pick<S, 'slug' | 'commonName' | 'adultSizeCm' | 'color'>): S => ({
  kind: 'INVERTEBRATE', waterType: 'FRESH', minVolumeL: 10, tempMinC: 20, tempMaxC: 27, phMin: 6.5, phMax: 7.8,
  minGroupSize: 6, flowPreference: 'LOW', ...s,
});

export const SPECIES: S[] = [
  // ------------------------- Poissons eau douce -------------------------
  fish({ slug: 'neon-tetra', commonName: 'Néon bleu', scientificName: 'Paracheirodon innesi', minVolumeL: 60, adultSizeCm: 3.5, minGroupSize: 8, tempMinC: 20, tempMaxC: 26, phMin: 5.5, phMax: 7.5, color: '#2f7cff', tags: ['schooling'] }),
  fish({ slug: 'cardinal-tetra', commonName: 'Néon cardinal', scientificName: 'Paracheirodon axelrodi', minVolumeL: 80, adultSizeCm: 4, minGroupSize: 8, tempMinC: 24, tempMaxC: 29, phMin: 4.5, phMax: 7.0, color: '#e33b3b', tags: ['schooling'] }),
  fish({ slug: 'guppy', commonName: 'Guppy', scientificName: 'Poecilia reticulata', minVolumeL: 40, adultSizeCm: 4.5, minGroupSize: 3, tempMinC: 22, tempMaxC: 28, phMin: 6.8, phMax: 8.0, longFins: true, color: '#ff9f1c' }),
  fish({ slug: 'endler', commonName: 'Guppy Endler', scientificName: 'Poecilia wingei', minVolumeL: 30, adultSizeCm: 3, minGroupSize: 3, tempMinC: 22, tempMaxC: 28, phMin: 6.8, phMax: 8.0, color: '#ffd166' }),
  fish({ slug: 'platy', commonName: 'Platy', scientificName: 'Xiphophorus maculatus', minVolumeL: 60, adultSizeCm: 6, minGroupSize: 3, tempMinC: 20, tempMaxC: 26, phMin: 7.0, phMax: 8.2, color: '#ff6b35' }),
  fish({ slug: 'betta-splendens', commonName: 'Combattant', scientificName: 'Betta splendens', minVolumeL: 20, adultSizeCm: 6, tempMinC: 24, tempMaxC: 30, phMin: 6.0, phMax: 7.5, temperament: 'SEMI_AGGRESSIVE', longFins: true, flowPreference: 'LOW', incompatibleWith: ['guppy', 'tiger-barb'], tags: ['labyrinth'], color: '#c1121f' }),
  fish({ slug: 'dwarf-gourami', commonName: 'Gourami nain', scientificName: 'Trichogaster lalius', minVolumeL: 60, adultSizeCm: 8, tempMinC: 24, tempMaxC: 28, phMin: 6.0, phMax: 7.5, flowPreference: 'LOW', tags: ['labyrinth'], color: '#2a9d8f' }),
  fish({ slug: 'corydoras-paleatus', commonName: 'Corydoras poivré', scientificName: 'Corydoras paleatus', minVolumeL: 80, adultSizeCm: 6, minGroupSize: 6, tempMinC: 18, tempMaxC: 25, phMin: 6.0, phMax: 7.5, tags: ['bottom-dweller', 'digger'], color: '#8d99ae' }),
  fish({ slug: 'corydoras-panda', commonName: 'Corydoras panda', scientificName: 'Corydoras panda', minVolumeL: 80, adultSizeCm: 5, minGroupSize: 6, tempMinC: 20, tempMaxC: 25, phMin: 6.0, phMax: 7.5, tags: ['bottom-dweller', 'digger'], color: '#edf2f4' }),
  fish({ slug: 'otocinclus', commonName: 'Otocinclus', scientificName: 'Otocinclus affinis', minVolumeL: 60, adultSizeCm: 4, minGroupSize: 6, tempMinC: 21, tempMaxC: 26, phMin: 6.0, phMax: 7.5, tags: ['herbivore', 'algae-eater'], color: '#a0a0a0' }),
  fish({ slug: 'ancistrus', commonName: 'Ancistrus', scientificName: 'Ancistrus sp.', minVolumeL: 100, adultSizeCm: 12, tempMinC: 22, tempMaxC: 27, phMin: 6.0, phMax: 7.5, tags: ['bottom-dweller', 'herbivore', 'cave-dweller', 'algae-eater'], color: '#4a4e69' }),
  fish({ slug: 'harlequin-rasbora', commonName: 'Rasbora arlequin', scientificName: 'Trigonostigma heteromorpha', minVolumeL: 60, adultSizeCm: 4.5, minGroupSize: 8, tempMinC: 22, tempMaxC: 27, phMin: 6.0, phMax: 7.5, tags: ['schooling'], color: '#f4a261' }),
  fish({ slug: 'zebra-danio', commonName: 'Danio zébré', scientificName: 'Danio rerio', minVolumeL: 80, adultSizeCm: 5, minGroupSize: 8, tempMinC: 18, tempMaxC: 26, phMin: 6.5, phMax: 7.5, flowPreference: 'HIGH', finNipper: true, tags: ['schooling'], color: '#c7d3dd' }),
  fish({ slug: 'tiger-barb', commonName: 'Barbus de Sumatra', scientificName: 'Puntigrus tetrazona', minVolumeL: 120, adultSizeCm: 7, minGroupSize: 8, tempMinC: 22, tempMaxC: 27, phMin: 6.0, phMax: 7.5, temperament: 'SEMI_AGGRESSIVE', finNipper: true, tags: ['schooling'], color: '#e9c46a' }),
  fish({ slug: 'cherry-barb', commonName: 'Barbus cerise', scientificName: 'Puntius titteya', minVolumeL: 60, adultSizeCm: 5, minGroupSize: 6, tempMinC: 22, tempMaxC: 27, phMin: 6.0, phMax: 7.5, tags: ['schooling'], color: '#d62828' }),
  fish({ slug: 'angelfish', commonName: 'Scalaire', scientificName: 'Pterophyllum scalare', minVolumeL: 200, adultSizeCm: 15, minGroupSize: 4, tempMinC: 24, tempMaxC: 29, phMin: 6.0, phMax: 7.5, temperament: 'SEMI_AGGRESSIVE', longFins: true, predatorThresholdCm: 3.5, color: '#dee2e6' }),
  fish({ slug: 'discus', commonName: 'Discus', scientificName: 'Symphysodon sp.', minVolumeL: 300, adultSizeCm: 18, minGroupSize: 5, tempMinC: 27, tempMaxC: 31, phMin: 5.5, phMax: 7.0, flowPreference: 'LOW', color: '#f77f00' }),
  fish({ slug: 'german-blue-ram', commonName: 'Ramirezi', scientificName: 'Mikrogeophagus ramirezi', minVolumeL: 80, adultSizeCm: 6, minGroupSize: 2, tempMinC: 25, tempMaxC: 30, phMin: 5.5, phMax: 7.0, tags: ['cave-dweller'], color: '#4895ef' }),
  fish({ slug: 'kuhli-loach', commonName: 'Loche kuhli', scientificName: 'Pangio kuhlii', minVolumeL: 80, adultSizeCm: 10, minGroupSize: 5, tempMinC: 22, tempMaxC: 28, phMin: 5.5, phMax: 7.0, tags: ['bottom-dweller', 'digger'], color: '#9c6644' }),
  fish({ slug: 'goldfish', commonName: 'Poisson rouge', scientificName: 'Carassius auratus', minVolumeL: 100, adultSizeCm: 25, minGroupSize: 2, tempMinC: 10, tempMaxC: 22, phMin: 7.0, phMax: 8.0, eatsPlants: true, tags: ['digger'], color: '#ff7b00' }),
  fish({ slug: 'white-cloud-minnow', commonName: 'Néon du pauvre', scientificName: 'Tanichthys albonubes', minVolumeL: 50, adultSizeCm: 4, minGroupSize: 8, tempMinC: 14, tempMaxC: 22, phMin: 6.5, phMax: 7.5, tags: ['schooling'], color: '#b5e48c' }),
  fish({ slug: 'oscar', commonName: 'Oscar', scientificName: 'Astronotus ocellatus', minVolumeL: 400, adultSizeCm: 35, tempMinC: 23, tempMaxC: 28, phMin: 6.0, phMax: 8.0, temperament: 'AGGRESSIVE', predatorThresholdCm: 10, eatsPlants: true, tags: ['digger'], color: '#6a040f' }),
  fish({ slug: 'hillstream-loach', commonName: 'Loche de torrent', scientificName: 'Sewellia lineolata', minVolumeL: 80, adultSizeCm: 6, minGroupSize: 3, tempMinC: 20, tempMaxC: 24, phMin: 6.5, phMax: 7.5, flowPreference: 'HIGH', tags: ['bottom-dweller', 'algae-eater'], color: '#6c757d' }),
  // ----------------------------- Saumâtre -------------------------------
  fish({ slug: 'bumblebee-goby', commonName: 'Gobie abeille', scientificName: 'Brachygobius doriae', waterType: 'BRACKISH', minVolumeL: 40, adultSizeCm: 4, minGroupSize: 4, tempMinC: 24, tempMaxC: 28, phMin: 7.5, phMax: 8.5, tags: ['bottom-dweller'], color: '#ffba08' }),
  fish({ slug: 'figure-8-puffer', commonName: 'Tétrodon 8', scientificName: 'Dichotomyctere biocellatus', waterType: 'BRACKISH', minVolumeL: 60, adultSizeCm: 8, tempMinC: 24, tempMaxC: 28, phMin: 7.5, phMax: 8.5, temperament: 'AGGRESSIVE', finNipper: true, predatorThresholdCm: 3, color: '#90be6d' }),
  // ------------------------------ Marin ---------------------------------
  fish({ slug: 'clownfish', commonName: 'Poisson-clown', scientificName: 'Amphiprion ocellaris', waterType: 'MARINE', minVolumeL: 100, adultSizeCm: 9, minGroupSize: 2, tempMinC: 24, tempMaxC: 27, phMin: 8.0, phMax: 8.4, tags: ['reef'], color: '#ff6d00' }),
  fish({ slug: 'royal-gramma', commonName: 'Gramma royal', scientificName: 'Gramma loreto', waterType: 'MARINE', minVolumeL: 120, adultSizeCm: 8, tempMinC: 24, tempMaxC: 27, phMin: 8.0, phMax: 8.4, tags: ['reef', 'cave-dweller'], color: '#9d4edd' }),
  fish({ slug: 'firefish', commonName: 'Poisson de feu', scientificName: 'Nemateleotris magnifica', waterType: 'MARINE', minVolumeL: 100, adultSizeCm: 8, tempMinC: 24, tempMaxC: 27, phMin: 8.0, phMax: 8.4, tags: ['reef'], color: '#ff4d6d' }),
  fish({ slug: 'yellow-tang', commonName: 'Chirurgien jaune', scientificName: 'Zebrasoma flavescens', waterType: 'MARINE', minVolumeL: 350, adultSizeCm: 20, tempMinC: 24, tempMaxC: 27, phMin: 8.0, phMax: 8.4, temperament: 'SEMI_AGGRESSIVE', flowPreference: 'HIGH', tags: ['reef', 'herbivore'], color: '#ffd60a' }),
  // --------------------------- Invertébrés ------------------------------
  invert({ slug: 'red-cherry-shrimp', commonName: 'Crevette Red Cherry', scientificName: 'Neocaridina davidi', adultSizeCm: 2.5, minGroupSize: 10, tempMinC: 18, tempMaxC: 28, color: '#ef233c' }),
  invert({ slug: 'amano-shrimp', commonName: 'Crevette Amano', scientificName: 'Caridina multidentata', adultSizeCm: 5, minGroupSize: 5, tempMinC: 18, tempMaxC: 27, tags: ['algae-eater'], color: '#b7b7a4' }),
  invert({ slug: 'nerite-snail', commonName: 'Escargot nérite', scientificName: 'Neritina natalensis', adultSizeCm: 2.5, minGroupSize: 1, tempMinC: 20, tempMaxC: 28, phMin: 7.0, phMax: 8.2, tags: ['algae-eater'], color: '#432818' }),
  invert({ slug: 'cleaner-shrimp', commonName: 'Crevette nettoyeuse', scientificName: 'Lysmata amboinensis', waterType: 'MARINE', minVolumeL: 100, adultSizeCm: 6, minGroupSize: 1, tempMinC: 24, tempMaxC: 27, phMin: 8.0, phMax: 8.4, tags: ['reef'], color: '#f8961e' }),
  // ------------------------------ Plantes -------------------------------
  plant({ slug: 'anubias-nana', commonName: 'Anubias nana', scientificName: 'Anubias barteri var. nana', adultSizeCm: 12, lightNeed: 'LOW', rooted: false, color: '#2d6a4f' }),
  plant({ slug: 'java-fern', commonName: 'Fougère de Java', scientificName: 'Microsorum pteropus', adultSizeCm: 25, lightNeed: 'LOW', rooted: false, color: '#40916c' }),
  plant({ slug: 'java-moss', commonName: 'Mousse de Java', scientificName: 'Taxiphyllum barbieri', adultSizeCm: 5, lightNeed: 'LOW', rooted: false, tempMinC: 15, color: '#52b788' }),
  plant({ slug: 'amazon-sword', commonName: 'Épée d\'Amazonie', scientificName: 'Echinodorus bleheri', adultSizeCm: 45, minVolumeL: 100, lightNeed: 'MEDIUM', color: '#2d6a4f' }),
  plant({ slug: 'vallisneria', commonName: 'Vallisnérie', scientificName: 'Vallisneria spiralis', adultSizeCm: 50, minVolumeL: 60, lightNeed: 'MEDIUM', tempMinC: 15, phMax: 8.5, color: '#74c69d' }),
  plant({ slug: 'cryptocoryne-wendtii', commonName: 'Cryptocoryne wendtii', scientificName: 'Cryptocoryne wendtii', adultSizeCm: 20, lightNeed: 'LOW', color: '#6b4226' }),
  plant({ slug: 'rotala-rotundifolia', commonName: 'Rotala', scientificName: 'Rotala rotundifolia', adultSizeCm: 35, lightNeed: 'HIGH', needsCo2: true, color: '#e76f51' }),
  plant({ slug: 'hemianthus-cuba', commonName: 'Hemianthus Cuba (HC)', scientificName: 'Hemianthus callitrichoides', adultSizeCm: 3, lightNeed: 'HIGH', needsCo2: true, color: '#80ed99' }),
  plant({ slug: 'dwarf-hairgrass', commonName: 'Eleocharis naine', scientificName: 'Eleocharis parvula', adultSizeCm: 8, lightNeed: 'HIGH', needsCo2: true, color: '#95d5b2' }),
  plant({ slug: 'ludwigia-repens', commonName: 'Ludwigia', scientificName: 'Ludwigia repens', adultSizeCm: 40, lightNeed: 'MEDIUM', color: '#bc4749' }),
  plant({ slug: 'hornwort', commonName: 'Cératophylle', scientificName: 'Ceratophyllum demersum', adultSizeCm: 60, lightNeed: 'LOW', rooted: false, tempMinC: 10, color: '#588157' }),
  plant({ slug: 'hygrophila-polysperma', commonName: 'Hygrophila', scientificName: 'Hygrophila polysperma', adultSizeCm: 40, lightNeed: 'LOW', color: '#6a994e' }),
  plant({ slug: 'cabomba', commonName: 'Cabomba', scientificName: 'Cabomba caroliniana', adultSizeCm: 50, lightNeed: 'HIGH', tempMinC: 18, color: '#386641' }),
  plant({ slug: 'marimo', commonName: 'Boule de Marimo', scientificName: 'Aegagropila linnaei', adultSizeCm: 6, lightNeed: 'LOW', rooted: false, tempMinC: 10, tempMaxC: 25, color: '#2b9348' }),
  plant({ slug: 'caulerpa', commonName: 'Caulerpa (macro-algue)', scientificName: 'Caulerpa prolifera', waterType: 'MARINE', adultSizeCm: 20, lightNeed: 'MEDIUM', phMin: 8.0, phMax: 8.4, tempMinC: 23, tempMaxC: 27, rooted: false, color: '#55a630' }),
];
