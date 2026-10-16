import type {
  AquariumConfig, CatalogProduct, PricePreference, Requirement, ScoreBreakdown, ScoredProduct,
} from '../types.js';
import { numAttr } from './normalize.js';

/** Poids des composantes du score "soft" (somme = 1). */
export const WEIGHTS = { tags: 0.35, targets: 0.35, price: 0.2, species: 0.1 } as const;
/** Bonus additif accordé aux magasins premium (mise en avant). */
export const PREMIUM_BOOST = 0.05;

/** Filtres éliminatoires : un produit qui échoue n'est jamais proposé. */
export function passesHardFilters(req: Requirement, p: CatalogProduct, config: AquariumConfig): boolean {
  if (p.category !== req.category) return false;
  if (p.stockQty <= 0) return false;
  if (p.waterTypes.length > 0 && !p.waterTypes.includes(config.waterType)) return false;
  if (req.hard.speciesSlug && p.speciesSlug !== req.hard.speciesSlug) return false;
  if (req.hard.tags && !req.hard.tags.every((t) => p.tags.includes(t))) return false;
  if (req.hard.volumeL !== undefined) {
    if (p.minVolumeL != null && config.volumeL < p.minVolumeL) return false;
    if (p.maxVolumeL != null && config.volumeL > p.maxVolumeL) return false;
  }
  return true;
}

function tagScore(req: Requirement, p: CatalogProduct): number {
  const soft = req.soft.tags ?? {};
  const keys = Object.keys(soft);
  if (keys.length === 0) return 1;
  let total = 0;
  let got = 0;
  for (const k of keys) {
    total += soft[k];
    if (p.tags.includes(k)) got += soft[k];
  }
  return total === 0 ? 1 : got / total;
}

/**
 * Proximité d'un attribut numérique à sa cible. Sous-dimensionner (ex. filtre
 * trop faible) est pénalisé plus fort que sur-dimensionner, selon le besoin.
 */
function targetScore(req: Requirement, p: CatalogProduct): number {
  const targets = req.soft.targets ?? {};
  const keys = Object.keys(targets);
  if (keys.length === 0) return 1;
  let sum = 0;
  for (const k of keys) {
    const { value, underPenalty = 1, overPenalty = 1 } = targets[k];
    const actual = numAttr(p.attributes, k);
    if (actual === undefined || value <= 0) {
      sum += 0.4; // attribut non renseigné : neutre-bas, le produit reste éligible
      continue;
    }
    const rel = (actual - value) / value;
    const penalty = rel < 0 ? -rel * underPenalty : rel * overPenalty;
    sum += Math.max(0, 1 - penalty);
  }
  return sum / keys.length;
}

/**
 * Score prix relatif aux autres candidats éligibles du même besoin.
 * ECO favorise le moins cher, PREMIUM le plus cher (gamme haute), STANDARD la médiane.
 */
function priceScore(p: CatalogProduct, minCents: number, maxCents: number, pref: PricePreference): number {
  if (maxCents <= minCents) return 1;
  const t = (p.priceCents - minCents) / (maxCents - minCents); // 0 = moins cher, 1 = plus cher
  switch (pref) {
    case 'ECO':
      return 1 - t;
    case 'PREMIUM':
      return 0.4 + 0.6 * t;
    default:
      return 1 - Math.abs(t - 0.4) * 1.2; // optimum légèrement sous la médiane
  }
}

function speciesScore(req: Requirement, p: CatalogProduct): number {
  const slugs = req.soft.speciesSlugs ?? [];
  if (slugs.length === 0 || p.compatibleSpecies.length === 0) return 0.5;
  const hits = slugs.filter((s) => p.compatibleSpecies.includes(s)).length;
  return hits / slugs.length;
}

export function quantityFor(req: Requirement, p: CatalogProduct): number {
  if (!req.amount) return req.quantity;
  const per = numAttr(p.attributes, req.amount.attribute);
  if (!per || per <= 0) return req.quantity;
  return Math.max(1, Math.ceil(req.amount.value / per));
}

export function scoreCandidates(
  req: Requirement,
  candidates: CatalogProduct[],
  config: AquariumConfig,
): ScoredProduct[] {
  const pref = config.pricePreference ?? 'STANDARD';
  // Le prix est comparé par unité "équivalente" (ex. prix / kg pour le substrat)
  const unitCost = (p: CatalogProduct) => {
    if (!req.amount) return p.priceCents;
    const per = numAttr(p.attributes, req.amount.attribute);
    return per && per > 0 ? p.priceCents / per : p.priceCents;
  };
  const costs = candidates.map(unitCost);
  const minC = Math.min(...costs);
  const maxC = Math.max(...costs);

  const scored = candidates.map((p, i) => {
    const breakdown: ScoreBreakdown = {
      tags: tagScore(req, p),
      targets: targetScore(req, p),
      price: priceScore({ ...p, priceCents: costs[i] }, minC, maxC, pref),
      species: speciesScore(req, p),
      premiumBoost: p.shopTier === 'PREMIUM' ? PREMIUM_BOOST : 0,
    };
    const base =
      breakdown.tags * WEIGHTS.tags +
      breakdown.targets * WEIGHTS.targets +
      breakdown.price * WEIGHTS.price +
      breakdown.species * WEIGHTS.species;
    const quantity = quantityFor(req, p);
    return {
      product: p,
      score: Math.min(1, base + breakdown.premiumBoost),
      breakdown,
      quantity,
      lineTotalCents: quantity * p.priceCents,
    };
  });

  // Tri : score desc → premium d'abord → moins cher → nom (déterminisme)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const tierRank = (t: string) => (t === 'PREMIUM' ? 0 : t === 'STANDARD' ? 1 : 2);
    if (tierRank(a.product.shopTier) !== tierRank(b.product.shopTier)) {
      return tierRank(a.product.shopTier) - tierRank(b.product.shopTier);
    }
    if (a.lineTotalCents !== b.lineTotalCents) return a.lineTotalCents - b.lineTotalCents;
    return a.product.name.localeCompare(b.product.name);
  });
  return scored;
}
