import { describe, expect, it } from 'vitest';
import { checkCompatibility } from '../compatibility/index.js';
import type { AquariumConfig } from '../types.js';
import { species } from './fixtures.js';

const codes = (r: ReturnType<typeof checkCompatibility>) => r.issues.map((i) => i.code);

describe('checkCompatibility', () => {
  it('accepts a sane community tank', () => {
    const cfg: AquariumConfig = {
      volumeL: 120, waterType: 'FRESH',
      items: [
        { kind: 'FISH', refSlug: 'neon-tetra', quantity: 10 },
        { kind: 'INVERTEBRATE', refSlug: 'red-cherry-shrimp', quantity: 10 },
        { kind: 'PLANT', refSlug: 'anubias', quantity: 3 },
      ],
    };
    const r = checkCompatibility(cfg, species);
    expect(r.ok).toBe(true);
    expect(r.errors).toBe(0);
    expect(r.envelope).toEqual({ tempMinC: 22, tempMaxC: 26, phMin: 6, phMax: 7.5 });
  });

  it('flags water type mismatch and minimum volume', () => {
    const cfg: AquariumConfig = { volumeL: 30, waterType: 'FRESH', items: [{ kind: 'FISH', refSlug: 'clownfish', quantity: 2 }] };
    const r = checkCompatibility(cfg, species);
    expect(r.ok).toBe(false);
    expect(codes(r)).toEqual(expect.arrayContaining(['WATER_TYPE', 'MIN_VOLUME']));
  });

  it('detects temperature incompatibility between species', () => {
    const cfg: AquariumConfig = { volumeL: 200, waterType: 'FRESH', items: [
      { kind: 'FISH', refSlug: 'goldfish', quantity: 2 },
      { kind: 'FISH', refSlug: 'betta-splendens', quantity: 1 },
    ] };
    const r = checkCompatibility(cfg, species);
    expect(codes(r)).toContain('TEMPERATURE');
    expect(r.envelope).toBeNull();
  });

  it('detects predation, aggression and fin nipping', () => {
    const cfg: AquariumConfig = { volumeL: 500, waterType: 'FRESH', items: [
      { kind: 'FISH', refSlug: 'oscar', quantity: 1 },
      { kind: 'FISH', refSlug: 'neon-tetra', quantity: 10 },
      { kind: 'FISH', refSlug: 'tiger-barb', quantity: 8 },
      { kind: 'FISH', refSlug: 'betta-splendens', quantity: 1 },
    ] };
    const r = checkCompatibility(cfg, species);
    const c = codes(r);
    expect(c).toContain('PREDATION');
    expect(c).toContain('TEMPERAMENT');
    expect(c).toContain('FIN_NIPPING');
    expect(r.issues.find((i) => i.code === 'FIN_NIPPING')!.subjects).toEqual(['tiger-barb', 'betta-splendens']);
  });

  it('warns on group size and overstocking', () => {
    const r1 = checkCompatibility({ volumeL: 100, waterType: 'FRESH', items: [{ kind: 'FISH', refSlug: 'neon-tetra', quantity: 3 }] }, species);
    expect(codes(r1)).toContain('GROUP_SIZE');
    const r2 = checkCompatibility({ volumeL: 100, waterType: 'FRESH', items: [{ kind: 'FISH', refSlug: 'neon-tetra', quantity: 50 }] }, species);
    expect(codes(r2)).toContain('OVERSTOCKED');
    expect(r2.ok).toBe(false);
    const r3 = checkCompatibility({ volumeL: 100, waterType: 'FRESH', items: [{ kind: 'FISH', refSlug: 'neon-tetra', quantity: 32 }] }, species);
    expect(codes(r3)).toContain('HIGH_BIOLOAD');
    expect(r3.ok).toBe(true);
  });

  it('cross-checks plants and equipment', () => {
    const cfg: AquariumConfig = { volumeL: 200, waterType: 'FRESH', items: [
      { kind: 'FISH', refSlug: 'goldfish', quantity: 2 },
      { kind: 'PLANT', refSlug: 'rotala', quantity: 5 },
      { kind: 'FISH', refSlug: 'betta-splendens', quantity: 1 },
      { kind: 'EQUIPMENT', refSlug: 'air-pump', quantity: 1 },
    ] };
    const c = codes(checkCompatibility(cfg, species));
    expect(c).toEqual(expect.arrayContaining(['PLANT_EATER', 'CO2_RECOMMENDED', 'HIGH_LIGHT', 'AIR_PUMP_FLOW', 'HEATER_REQUIRED']));
  });

  it('reports unknown species as a warning without crashing', () => {
    const r = checkCompatibility({ volumeL: 100, waterType: 'FRESH', items: [{ kind: 'FISH', refSlug: 'nope', quantity: 1 }] }, species);
    expect(codes(r)).toEqual(['UNKNOWN_SPECIES']);
    expect(r.ok).toBe(true);
  });
});
