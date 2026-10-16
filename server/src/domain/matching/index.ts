import type {
  AquariumConfig, CatalogProduct, MatchLine, MatchResult, Requirement, ShopBundle, SpeciesIndex,
} from '../types.js';
import { deriveRequirements } from './requirements.js';
import { passesHardFilters, scoreCandidates } from './score.js';

export { deriveRequirements, deriveDimensions } from './requirements.js';
export { scoreCandidates, passesHardFilters, WEIGHTS, PREMIUM_BOOST } from './score.js';
export { normalizeTag, normalizeTags } from './normalize.js';

export interface MatchOptions {
  /** Nombre d'alternatives renvoyées par besoin. */
  alternatives?: number;
  /** Devise attendue ; les produits dans une autre devise sont ignorés. */
  currency?: string;
}

/**
 * Moteur de matching : configuration client → produits réels du catalogue.
 *
 * 1. dérive les besoins (deriveRequirements)
 * 2. pour chaque besoin, filtre les produits éligibles (filtres durs) puis les
 *    score (tags, attributs techniques, prix, compatibilité espèces, bonus premium)
 * 3. agrège : meilleur mix multi-magasins + offres "tout chez un seul magasin"
 */
export function matchConfiguration(
  config: AquariumConfig,
  species: SpeciesIndex,
  catalog: CatalogProduct[],
  options: MatchOptions = {},
): MatchResult {
  const currency = options.currency ?? 'EUR';
  const nAlt = options.alternatives ?? 3;
  const requirements = deriveRequirements(config, species);
  const products = catalog.filter((p) => p.currency === currency);

  const lines: MatchLine[] = requirements.map((req) => {
    const eligible = products.filter((p) => passesHardFilters(req, p, config));
    const scored = scoreCandidates(req, eligible, config);
    const best = scored[0] ?? null;
    return {
      requirement: req,
      best,
      alternatives: scored.slice(1, 1 + nAlt),
      status: best ? 'MATCHED' : 'UNMATCHED',
    };
  });

  const mandatory = lines.filter((l) => !l.requirement.optional);
  const matchedMandatory = mandatory.filter((l) => l.status === 'MATCHED').length;
  const coverage = mandatory.length === 0 ? 1 : matchedMandatory / mandatory.length;

  const byCategory: Record<string, number> = {};
  let totalCents = 0;
  for (const l of lines) {
    if (!l.best) continue;
    totalCents += l.best.lineTotalCents;
    byCategory[l.requirement.category] = (byCategory[l.requirement.category] ?? 0) + l.best.lineTotalCents;
  }

  return {
    currency,
    lines,
    totalCents,
    coverage,
    byCategory,
    unmatched: lines.filter((l) => l.status === 'UNMATCHED').map((l) => l.requirement),
    byShop: buildShopBundles(requirements, lines, config, products),
  };
}

/**
 * Pour chaque magasin, le meilleur produit par besoin parmi SON catalogue.
 * Permet au client de tout acheter au même endroit.
 */
function buildShopBundles(
  requirements: Requirement[],
  lines: MatchLine[],
  config: AquariumConfig,
  products: CatalogProduct[],
): ShopBundle[] {
  const shops = new Map<string, { name: string; tier: CatalogProduct['shopTier'] }>();
  for (const p of products) shops.set(p.shopId, { name: p.shopName, tier: p.shopTier });

  const mandatoryKeys = new Set(requirements.filter((r) => !r.optional).map((r) => r.key));
  const bundles: ShopBundle[] = [];

  for (const [shopId, info] of shops) {
    const shopProducts = products.filter((p) => p.shopId === shopId);
    let matched = 0;
    let total = 0;
    const bundleLines = lines.map((line) => {
      const req = line.requirement;
      // Réutilise le classement global : premier candidat de ce magasin
      const fromGlobal = [line.best, ...line.alternatives].find((s) => s && s.product.shopId === shopId) ?? null;
      let pick = fromGlobal;
      if (!pick) {
        const eligible = shopProducts.filter((p) => passesHardFilters(req, p, config));
        pick = scoreCandidates(req, eligible, config)[0] ?? null;
      }
      if (pick) {
        total += pick.lineTotalCents;
        if (mandatoryKeys.has(req.key)) matched += 1;
      }
      return { requirementKey: req.key, product: pick };
    });
    bundles.push({
      shopId,
      shopName: info.name,
      shopTier: info.tier,
      coverage: mandatoryKeys.size === 0 ? 1 : matched / mandatoryKeys.size,
      matchedCount: bundleLines.filter((l) => l.product).length,
      totalCents: total,
      lines: bundleLines,
    });
  }

  // Couverture desc → premium d'abord → total asc
  bundles.sort((a, b) => {
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    const rank = (t: string) => (t === 'PREMIUM' ? 0 : 1);
    if (rank(a.shopTier) !== rank(b.shopTier)) return rank(a.shopTier) - rank(b.shopTier);
    return a.totalCents - b.totalCents;
  });
  return bundles;
}
