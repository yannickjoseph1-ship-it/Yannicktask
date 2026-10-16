import type { AquariumConfig, ConfigItem, SpeciesIndex, SpeciesRef } from '../types.js';
import { HEATER_THRESHOLD_C } from '../matching/requirements.js';

export type Severity = 'error' | 'warning' | 'info';

export interface CompatibilityIssue {
  severity: Severity;
  code: string;
  message: string;
  /** Slugs concernés */
  subjects: string[];
}

export interface CompatibilityReport {
  ok: boolean;
  errors: number;
  warnings: number;
  issues: CompatibilityIssue[];
  /** Plage de température / pH commune à tous les habitants, si elle existe */
  envelope: { tempMinC: number; tempMaxC: number; phMin: number; phMax: number } | null;
}

const WATER_LABEL: Record<string, string> = { FRESH: 'eau douce', MARINE: 'eau de mer', BRACKISH: 'eau saumâtre' };

interface Resolved { item: ConfigItem; sp: SpeciesRef }

function resolve(config: AquariumConfig, species: SpeciesIndex): { living: Resolved[]; unknown: string[] } {
  const living: Resolved[] = [];
  const unknown: string[] = [];
  for (const item of config.items) {
    if (item.kind !== 'FISH' && item.kind !== 'INVERTEBRATE' && item.kind !== 'PLANT') continue;
    const sp = species[item.refSlug];
    if (sp) living.push({ item, sp });
    else unknown.push(item.refSlug);
  }
  return { living, unknown };
}

function overlap(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
  return Math.max(aMin, bMin) <= Math.min(aMax, bMax);
}

/**
 * Vérifie la cohérence d'une configuration :
 *  - espèces ↔ bac (type d'eau, volume minimal, charge biologique)
 *  - espèces ↔ espèces (température, pH, tempérament, prédation, nageoires, flux, incompatibilités explicites)
 *  - espèces ↔ plantes (herbivores, besoins CO2 / lumière)
 *  - espèces ↔ matériel (chauffage, pompe à air, sel marin, CO2)
 */
export function checkCompatibility(config: AquariumConfig, species: SpeciesIndex): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];
  const { living, unknown } = resolve(config, species);
  const animals = living.filter((l) => l.sp.kind !== 'PLANT');
  const plants = living.filter((l) => l.sp.kind === 'PLANT');
  const equipment = new Set(config.items.filter((i) => i.kind === 'EQUIPMENT').map((i) => i.refSlug));

  for (const slug of unknown) {
    issues.push({ severity: 'warning', code: 'UNKNOWN_SPECIES', message: `Espèce inconnue : ${slug}`, subjects: [slug] });
  }

  // --- Espèce ↔ bac ----------------------------------------------------
  for (const { sp } of living) {
    if (sp.waterType !== config.waterType) {
      issues.push({
        severity: 'error',
        code: 'WATER_TYPE',
        message: `${sp.commonName} vit en ${WATER_LABEL[sp.waterType]}, le bac est en ${WATER_LABEL[config.waterType]}.`,
        subjects: [sp.slug],
      });
    }
    if (sp.minVolumeL > config.volumeL) {
      issues.push({
        severity: 'error',
        code: 'MIN_VOLUME',
        message: `${sp.commonName} nécessite au moins ${sp.minVolumeL} L (bac : ${config.volumeL} L).`,
        subjects: [sp.slug],
      });
    }
  }

  // Charge biologique (règle empirique : 1 cm de poisson adulte par litre)
  const bioloadCm = animals.reduce((sum, a) => sum + a.sp.adultSizeCm * a.item.quantity, 0);
  if (animals.length && bioloadCm > config.volumeL * 1.5) {
    issues.push({
      severity: 'error',
      code: 'OVERSTOCKED',
      message: `Surpopulation : ${Math.round(bioloadCm)} cm de poissons pour ${config.volumeL} L (max conseillé ≈ ${config.volumeL} cm).`,
      subjects: animals.map((a) => a.sp.slug),
    });
  } else if (animals.length && bioloadCm > config.volumeL) {
    issues.push({
      severity: 'warning',
      code: 'HIGH_BIOLOAD',
      message: `Population dense : ${Math.round(bioloadCm)} cm de poissons pour ${config.volumeL} L. Prévoir une filtration généreuse.`,
      subjects: animals.map((a) => a.sp.slug),
    });
  }

  // Bancs
  for (const { item, sp } of animals) {
    if (item.quantity < sp.minGroupSize) {
      issues.push({
        severity: 'warning',
        code: 'GROUP_SIZE',
        message: `${sp.commonName} vit en groupe : prévoir au moins ${sp.minGroupSize} individus (${item.quantity} choisi${item.quantity > 1 ? 's' : ''}).`,
        subjects: [sp.slug],
      });
    }
  }

  // --- Espèce ↔ espèce (paires) ---------------------------------------
  const seenPairs = new Set<string>();
  for (let i = 0; i < living.length; i++) {
    for (let j = i + 1; j < living.length; j++) {
      const a = living[i].sp;
      const b = living[j].sp;
      const pairKey = [a.slug, b.slug].sort().join('|');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      if (a.incompatibleWith.includes(b.slug) || b.incompatibleWith.includes(a.slug)) {
        issues.push({
          severity: 'error',
          code: 'INCOMPATIBLE',
          message: `${a.commonName} et ${b.commonName} sont incompatibles.`,
          subjects: [a.slug, b.slug],
        });
      }
      if (!overlap(a.tempMinC, a.tempMaxC, b.tempMinC, b.tempMaxC)) {
        issues.push({
          severity: 'error',
          code: 'TEMPERATURE',
          message: `${a.commonName} (${a.tempMinC}–${a.tempMaxC} °C) et ${b.commonName} (${b.tempMinC}–${b.tempMaxC} °C) n'ont pas de plage de température commune.`,
          subjects: [a.slug, b.slug],
        });
      }
      if (!overlap(a.phMin, a.phMax, b.phMin, b.phMax)) {
        issues.push({
          severity: 'warning',
          code: 'PH',
          message: `${a.commonName} (pH ${a.phMin}–${a.phMax}) et ${b.commonName} (pH ${b.phMin}–${b.phMax}) préfèrent des pH différents.`,
          subjects: [a.slug, b.slug],
        });
      }

      const bothAnimals = a.kind !== 'PLANT' && b.kind !== 'PLANT';
      if (bothAnimals) {
        // Prédation
        for (const [pred, prey] of [[a, b], [b, a]] as const) {
          if (pred.predatorThresholdCm != null && prey.adultSizeCm <= pred.predatorThresholdCm) {
            issues.push({
              severity: 'error',
              code: 'PREDATION',
              message: `${pred.commonName} risque de manger ${prey.commonName} (${prey.adultSizeCm} cm).`,
              subjects: [pred.slug, prey.slug],
            });
          }
        }
        // Tempérament
        const agg = [a, b].find((s) => s.temperament === 'AGGRESSIVE');
        const peace = [a, b].find((s) => s.temperament === 'PEACEFUL');
        if (agg && peace && agg !== peace) {
          issues.push({
            severity: 'warning',
            code: 'TEMPERAMENT',
            message: `${agg.commonName} est agressif et peut harceler ${peace.commonName}.`,
            subjects: [agg.slug, peace.slug],
          });
        } else if (a.temperament === 'AGGRESSIVE' && b.temperament === 'AGGRESSIVE') {
          issues.push({
            severity: 'warning',
            code: 'TEMPERAMENT',
            message: `${a.commonName} et ${b.commonName} sont tous deux territoriaux : prévoir un grand bac et des cachettes.`,
            subjects: [a.slug, b.slug],
          });
        }
        // Nageoires longues vs mordilleurs
        for (const [nipper, victim] of [[a, b], [b, a]] as const) {
          if (nipper.finNipper && victim.longFins) {
            issues.push({
              severity: 'warning',
              code: 'FIN_NIPPING',
              message: `${nipper.commonName} mordille les nageoires : ${victim.commonName} aux longues nageoires en souffrira.`,
              subjects: [nipper.slug, victim.slug],
            });
          }
        }
        // Courant
        if ((a.flowPreference === 'LOW' && b.flowPreference === 'HIGH') || (a.flowPreference === 'HIGH' && b.flowPreference === 'LOW')) {
          issues.push({
            severity: 'warning',
            code: 'FLOW',
            message: `${a.commonName} et ${b.commonName} n'ont pas les mêmes besoins en courant.`,
            subjects: [a.slug, b.slug],
          });
        }
      }
    }
  }

  // --- Espèce ↔ plantes -----------------------------------------------
  if (plants.length) {
    for (const { sp } of animals) {
      if (sp.eatsPlants) {
        issues.push({
          severity: 'warning',
          code: 'PLANT_EATER',
          message: `${sp.commonName} mange ou déracine les plantes.`,
          subjects: [sp.slug, ...plants.map((p) => p.sp.slug)],
        });
      }
    }
    const co2Plants = plants.filter((p) => p.sp.needsCo2);
    if (co2Plants.length) {
      issues.push({
        severity: 'info',
        code: 'CO2_RECOMMENDED',
        message: `${co2Plants.map((p) => p.sp.commonName).join(', ')} : injection de CO2 recommandée (ajoutée au budget).`,
        subjects: co2Plants.map((p) => p.sp.slug),
      });
    }
    if (plants.some((p) => p.sp.lightNeed === 'HIGH')) {
      issues.push({
        severity: 'info',
        code: 'HIGH_LIGHT',
        message: 'Au moins une plante exige un éclairage intense : la rampe sera dimensionnée en conséquence.',
        subjects: plants.filter((p) => p.sp.lightNeed === 'HIGH').map((p) => p.sp.slug),
      });
    }
  }

  // --- Espèce ↔ matériel ----------------------------------------------
  const needsHeater = living.some((l) => l.sp.tempMinC >= HEATER_THRESHOLD_C);
  if (needsHeater) {
    issues.push({
      severity: 'info',
      code: 'HEATER_REQUIRED',
      message: 'Espèces tropicales : un chauffage est nécessaire (ajouté au budget).',
      subjects: living.filter((l) => l.sp.tempMinC >= HEATER_THRESHOLD_C).map((l) => l.sp.slug),
    });
  }
  const labyrinth = animals.filter((a) => a.sp.tags.includes('labyrinth'));
  if (labyrinth.length && equipment.has('air-pump')) {
    issues.push({
      severity: 'warning',
      code: 'AIR_PUMP_FLOW',
      message: `${labyrinth.map((a) => a.sp.commonName).join(', ')} préfère une eau calme : limiter le bullage de la pompe à air.`,
      subjects: labyrinth.map((a) => a.sp.slug),
    });
  }
  if (config.waterType === 'MARINE' && animals.some((a) => a.sp.tags.includes('reef')) ) {
    issues.push({
      severity: 'info',
      code: 'REEF',
      message: 'Bac récifal : prévoir brassage et éclairage spécifiques.',
      subjects: animals.filter((a) => a.sp.tags.includes('reef')).map((a) => a.sp.slug),
    });
  }

  // --- Enveloppe environnementale -------------------------------------
  let envelope: CompatibilityReport['envelope'] = null;
  if (living.length) {
    const tempMinC = Math.max(...living.map((l) => l.sp.tempMinC));
    const tempMaxC = Math.min(...living.map((l) => l.sp.tempMaxC));
    const phMin = Math.max(...living.map((l) => l.sp.phMin));
    const phMax = Math.min(...living.map((l) => l.sp.phMax));
    if (tempMinC <= tempMaxC && phMin <= phMax) envelope = { tempMinC, tempMaxC, phMin, phMax };
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  return { ok: errors === 0, errors, warnings, issues, envelope };
}
