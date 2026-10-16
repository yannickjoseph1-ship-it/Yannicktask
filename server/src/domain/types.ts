/**
 * Types du domaine, indépendants de Prisma pour que le moteur de matching
 * et la vérification de compatibilité soient de pures fonctions testables.
 */

export type WaterType = 'FRESH' | 'MARINE' | 'BRACKISH';
export type SpeciesKind = 'FISH' | 'INVERTEBRATE' | 'PLANT';
export type Temperament = 'PEACEFUL' | 'SEMI_AGGRESSIVE' | 'AGGRESSIVE';
export type FlowPreference = 'LOW' | 'MEDIUM' | 'HIGH';
export type LightNeed = 'LOW' | 'MEDIUM' | 'HIGH';
export type ItemKind = 'FISH' | 'INVERTEBRATE' | 'PLANT' | 'DECOR' | 'EQUIPMENT';
export type PricePreference = 'ECO' | 'STANDARD' | 'PREMIUM';
export type SubscriptionTier = 'NONE' | 'STANDARD' | 'PREMIUM';

export type ProductCategory =
  | 'TANK'
  | 'FILTER'
  | 'HEATER'
  | 'LIGHT'
  | 'SUBSTRATE'
  | 'CO2'
  | 'DECOR'
  | 'FISH'
  | 'INVERTEBRATE'
  | 'PLANT'
  | 'FOOD'
  | 'WATER_TREATMENT'
  | 'ACCESSORY';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'TANK', 'FILTER', 'HEATER', 'LIGHT', 'SUBSTRATE', 'CO2', 'DECOR',
  'FISH', 'INVERTEBRATE', 'PLANT', 'FOOD', 'WATER_TREATMENT', 'ACCESSORY',
];

export interface SpeciesRef {
  slug: string;
  commonName: string;
  scientificName?: string | null;
  kind: SpeciesKind;
  waterType: WaterType;
  minVolumeL: number;
  tempMinC: number;
  tempMaxC: number;
  phMin: number;
  phMax: number;
  adultSizeCm: number;
  temperament: Temperament;
  minGroupSize: number;
  eatsPlants: boolean;
  finNipper: boolean;
  longFins: boolean;
  predatorThresholdCm?: number | null;
  flowPreference: FlowPreference;
  lightNeed?: LightNeed | null;
  needsCo2: boolean;
  rooted: boolean;
  incompatibleWith: string[];
  tags: string[];
  color?: string;
}

export type SpeciesIndex = Record<string, SpeciesRef>;

export interface ConfigItem {
  kind: ItemKind;
  /** Species.slug pour le vivant ; slug de décor ("driftwood") ou de matériel ("air-pump") sinon */
  refSlug: string;
  quantity: number;
}

export interface AquariumConfig {
  volumeL: number;
  waterType: WaterType;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  pricePreference?: PricePreference;
  items: ConfigItem[];
}

/** Produit catalogue tel que vu par le moteur (prix en centimes). */
export interface CatalogProduct {
  id: string;
  shopId: string;
  shopName: string;
  shopTier: SubscriptionTier;
  externalRef: string;
  name: string;
  brand?: string | null;
  category: ProductCategory;
  priceCents: number;
  currency: string;
  stockQty: number;
  tags: string[];
  compatibleSpecies: string[];
  speciesSlug?: string | null;
  waterTypes: WaterType[];
  minVolumeL?: number | null;
  maxVolumeL?: number | null;
  attributes: Record<string, unknown>;
  imageUrl?: string | null;
}

/** Besoin dérivé de la configuration, à satisfaire par un produit. */
export interface Requirement {
  key: string;
  category: ProductCategory;
  label: string;
  /** Quantité fixe (unités) ; ignorée si `amount` est défini. */
  quantity: number;
  /** Quantité dépendante du produit : ex. 12 kg de substrat → ceil(12 / weightKg) sacs. */
  amount?: { attribute: string; value: number; unit: string };
  hard: {
    speciesSlug?: string;
    /** Tous ces tags doivent être présents sur le produit. */
    tags?: string[];
    /** Le produit doit déclarer supporter ce volume (si min/max renseignés). */
    volumeL?: number;
  };
  soft: {
    /** Tags souhaités, chacun pondéré. */
    tags?: Record<string, number>;
    /** Cibles numériques sur `attributes` (ex. flowLph ≈ 4×volume). */
    targets?: Record<string, { value: number; underPenalty?: number; overPenalty?: number }>;
    /** Espèces de la config : bonus si le produit se déclare compatible. */
    speciesSlugs?: string[];
  };
  optional: boolean;
  reason: string;
}

export interface ScoreBreakdown {
  tags: number;
  targets: number;
  price: number;
  species: number;
  premiumBoost: number;
}

export interface ScoredProduct {
  product: CatalogProduct;
  score: number;
  breakdown: ScoreBreakdown;
  quantity: number;
  lineTotalCents: number;
}

export interface MatchLine {
  requirement: Requirement;
  best: ScoredProduct | null;
  alternatives: ScoredProduct[];
  status: 'MATCHED' | 'UNMATCHED';
}

export interface ShopBundle {
  shopId: string;
  shopName: string;
  shopTier: SubscriptionTier;
  coverage: number;
  matchedCount: number;
  totalCents: number;
  lines: { requirementKey: string; product: ScoredProduct | null }[];
}

export interface MatchResult {
  currency: string;
  lines: MatchLine[];
  totalCents: number;
  coverage: number;
  byCategory: Record<string, number>;
  unmatched: Requirement[];
  byShop: ShopBundle[];
}
