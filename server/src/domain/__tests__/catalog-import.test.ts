import { describe, expect, it } from 'vitest';
import { normalizeRow, parseCatalogFile } from '../../services/catalog-import.js';

describe('normalizeRow', () => {
  it('normalizes a CSV-style row with attr_* columns, keeping attribute key case', () => {
    const row = normalizeRow({
      Ref: ' FIL-600 ', Name: 'Filtre externe', Category: 'filter', Price: '89,90', Currency: 'eur', Stock: '10',
      Tags: 'External | Quiet ; Débit Fort', compatible_species: 'Neon Tetra|betta-splendens', water_types: 'fresh|marine',
      min_volume_l: '60', max_volume_l: '150', attr_flowLph: '600', attr_note: 'x',
    });
    expect(row).toMatchObject({
      externalRef: 'FIL-600', name: 'Filtre externe', category: 'FILTER', price: 89.9, currency: 'EUR', stockQty: 10,
      tags: ['external', 'quiet', 'debit-fort'], compatibleSpecies: ['neon-tetra', 'betta-splendens'],
      waterTypes: ['FRESH', 'MARINE'], minVolumeL: 60, maxVolumeL: 150,
    });
    expect(row.attributes).toEqual({ flowLph: 600, note: 'x' });
  });

  it('accepts JSON attributes (object or string) and species_slug', () => {
    const a = normalizeRow({ ref: 'T1', name: 'Bac', category: 'TANK', price: 100, attributes: { volumeL: 100 } });
    expect(a.attributes).toEqual({ volumeL: 100 });
    const b = normalizeRow({ ref: 'T2', name: 'Bac', category: 'TANK', price: 100, attributes: '{"volumeL": 60}' });
    expect(b.attributes).toEqual({ volumeL: 60 });
    const c = normalizeRow({ ref: 'F1', name: 'Néon', category: 'FISH', price: 1.9, species_slug: 'Neon Tetra' });
    expect(c.speciesSlug).toBe('neon-tetra');
  });

  it('rejects invalid rows with a descriptive message', () => {
    expect(() => normalizeRow({ ref: 'X', name: 'Y', category: 'NOPE', price: 1 })).toThrow(/Catégorie inconnue/);
    expect(() => normalizeRow({ ref: 'X', name: 'Y', category: 'TANK', price: 'abc' })).toThrow(/Prix invalide/);
    expect(() => normalizeRow({ name: 'Y', category: 'TANK', price: 1 })).toThrow(/ref/);
    expect(() => normalizeRow({ ref: 'X', name: 'Y', category: 'TANK', price: 1, attributes: '{bad' })).toThrow(/JSON invalide/);
  });
});

describe('parseCatalogFile', () => {
  it('parses comma and semicolon CSV, with BOM', () => {
    const csv = '﻿ref;name;category;price\nA;Bac;TANK;10\nB;Filtre;FILTER;20\n';
    const rows = parseCatalogFile(Buffer.from(csv, 'utf8'), 'c.csv', 'text/csv');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ ref: 'A', category: 'TANK' });
  });

  it('parses JSON arrays and { products }', () => {
    expect(parseCatalogFile(Buffer.from('[{"ref":"A"}]'), 'c.json')).toEqual([{ ref: 'A' }]);
    expect(parseCatalogFile(Buffer.from('{"products":[{"ref":"B"}]}'), 'c.json')).toEqual([{ ref: 'B' }]);
    expect(() => parseCatalogFile(Buffer.from('{"nope":1}'), 'c.json')).toThrow();
  });
});
