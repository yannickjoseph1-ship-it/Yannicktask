export type WaterType = 'FRESH' | 'MARINE' | 'BRACKISH';
export type SpeciesKind = 'FISH' | 'INVERTEBRATE' | 'PLANT';
export type ItemKind = 'FISH' | 'INVERTEBRATE' | 'PLANT' | 'DECOR' | 'EQUIPMENT';
export type PricePreference = 'ECO' | 'STANDARD' | 'PREMIUM';
export type Role = 'CLIENT' | 'SHOP';
export type SubscriptionTier = 'NONE' | 'STANDARD' | 'PREMIUM';

export interface User {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  shop?: { id: string; name: string; subscriptionTier: SubscriptionTier; subscriptionStatus: string } | null;
}

export interface Species {
  id: string;
  slug: string;
  commonName: string;
  scientificName?: string | null;
  kind: SpeciesKind;
  waterType: WaterType;
  minVolumeL: number;
  tempMinC: number;
  tempMaxC: number;
  adultSizeCm: number;
  minGroupSize: number;
  lightNeed?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  needsCo2: boolean;
  rooted: boolean;
  tags: string[];
  color: string;
}

export interface ConfigItem {
  kind: ItemKind;
  refSlug: string;
  quantity: number;
}

export interface AquariumConfig {
  volumeL: number;
  waterType: WaterType;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  pricePreference: PricePreference;
  items: ConfigItem[];
}

export interface SavedAquarium extends AquariumConfig {
  id: string;
  name: string;
  updatedAt: string;
}

export interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  subjects: string[];
}

export interface CompatibilityReport {
  ok: boolean;
  errors: number;
  warnings: number;
  issues: CompatibilityIssue[];
  envelope: { tempMinC: number; tempMaxC: number; phMin: number; phMax: number } | null;
}

export interface CatalogProduct {
  id: string;
  shopId: string;
  shopName: string;
  shopTier: SubscriptionTier;
  name: string;
  brand?: string | null;
  category: string;
  priceCents: number;
  currency: string;
  tags: string[];
  attributes: Record<string, unknown>;
}

export interface ScoredProduct {
  product: CatalogProduct;
  score: number;
  breakdown: { tags: number; targets: number; price: number; species: number; premiumBoost: number };
  quantity: number;
  lineTotalCents: number;
}

export interface Requirement {
  key: string;
  category: string;
  label: string;
  quantity: number;
  amount?: { attribute: string; value: number; unit: string };
  optional: boolean;
  reason: string;
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

export interface Analysis {
  dimensions: { lengthCm: number; widthCm: number; heightCm: number };
  compatibility: CompatibilityReport;
  match: MatchResult;
  quoteId?: string;
}

export interface Option { slug: string; label: string; category?: string }

export const WATER_LABELS: Record<WaterType, string> = { FRESH: 'Eau douce', MARINE: 'Eau de mer', BRACKISH: 'Eau saumâtre' };
export const CATEGORY_LABELS: Record<string, string> = {
  TANK: 'Bac', FILTER: 'Filtration', HEATER: 'Chauffage', LIGHT: 'Éclairage', SUBSTRATE: 'Substrat', CO2: 'CO2', DECOR: 'Décor',
  FISH: 'Poissons', INVERTEBRATE: 'Invertébrés', PLANT: 'Plantes', FOOD: 'Nourriture', WATER_TREATMENT: 'Traitement d\'eau', ACCESSORY: 'Accessoires',
};

export const euros = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
