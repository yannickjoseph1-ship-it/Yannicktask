import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { normalizeTags } from '../domain/matching/normalize.js';
import { PRODUCT_CATEGORIES } from '../domain/types.js';
import { prisma, type Prisma } from '../lib/prisma.js';
import { badRequest } from '../lib/errors.js';

/**
 * Import de catalogue magasin (CSV ou JSON).
 *
 * Colonnes / clés acceptées :
 *  ref*, name*, category*, price*, currency, stock, brand, image_url,
 *  tags (a|b|c), compatible_species (slug|slug), species_slug,
 *  water_types (FRESH|MARINE|BRACKISH), min_volume_l, max_volume_l,
 *  attributes (JSON) ou colonnes attr_* (ex. attr_flowLph=450)
 */

const listField = z.union([z.array(z.string()), z.string()]).optional();
const numField = z.union([z.number(), z.string()]).optional();

const rowSchema = z.object({
  ref: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.union([z.number(), z.string()]),
  currency: z.string().optional(),
  stock: numField,
  brand: z.string().optional(),
  image_url: z.string().optional(),
  tags: listField,
  compatible_species: listField,
  species_slug: z.string().optional(),
  water_types: listField,
  min_volume_l: numField,
  max_volume_l: numField,
  attributes: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
}).loose();

export interface ImportReport {
  total: number;
  imported: number;
  errors: { row: number; message: string }[];
}

export interface NormalizedRow {
  externalRef: string;
  name: string;
  brand: string | null;
  category: (typeof PRODUCT_CATEGORIES)[number];
  price: number;
  currency: string;
  stockQty: number;
  imageUrl: string | null;
  tags: string[];
  compatibleSpecies: string[];
  speciesSlug: string | null;
  waterTypes: ('FRESH' | 'MARINE' | 'BRACKISH')[];
  minVolumeL: number | null;
  maxVolumeL: number | null;
  attributes: Record<string, unknown>;
}

function toNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toList(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v).split(/[|;,]/).map((s) => s.trim()).filter(Boolean);
}

/** Normalise une ligne brute (CSV ou JSON) ; lève une erreur descriptive si invalide. */
export function normalizeRow(raw: Record<string, unknown>): NormalizedRow {
  // Les en-têtes CSV sont tolérants à la casse et aux tirets
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) lower[k.trim().toLowerCase().replace(/[\s-]+/g, '_')] = v;

  const parsed = rowSchema.safeParse(lower);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  const r = parsed.data;

  const category = r.category.toUpperCase().replace(/[\s-]+/g, '_') as NormalizedRow['category'];
  if (!PRODUCT_CATEGORIES.includes(category)) throw new Error(`Catégorie inconnue "${r.category}" (attendu : ${PRODUCT_CATEGORIES.join(', ')})`);

  const price = toNumber(r.price);
  if (price === null || price < 0) throw new Error(`Prix invalide "${r.price}"`);

  let attributes: Record<string, unknown> = {};
  if (typeof r.attributes === 'string' && r.attributes.trim()) {
    try {
      attributes = JSON.parse(r.attributes);
    } catch {
      throw new Error('Colonne attributes : JSON invalide');
    }
  } else if (r.attributes && typeof r.attributes === 'object') {
    attributes = r.attributes;
  }
  // Colonnes attr_* : la casse du suffixe est conservée (attr_flowLph → flowLph)
  for (const [k, v] of Object.entries(raw)) {
    const key = k.trim();
    if (/^attr[_-]/i.test(key) && v !== '' && v !== undefined && v !== null) {
      const n = toNumber(v);
      attributes[key.slice(5)] = n ?? v;
    }
  }

  const waterTypes = toList(r.water_types).map((w) => w.toUpperCase()).filter((w): w is NormalizedRow['waterTypes'][number] =>
    ['FRESH', 'MARINE', 'BRACKISH'].includes(w),
  );

  const stock = toNumber(r.stock);
  return {
    externalRef: r.ref.trim(),
    name: r.name.trim(),
    brand: r.brand?.trim() || null,
    category,
    price: Math.round(price * 100) / 100,
    currency: (r.currency?.trim().toUpperCase() || 'EUR').slice(0, 3),
    stockQty: stock === null ? 0 : Math.max(0, Math.floor(stock)),
    imageUrl: r.image_url?.trim() || null,
    tags: normalizeTags(toList(r.tags)),
    compatibleSpecies: normalizeTags(toList(r.compatible_species)),
    speciesSlug: r.species_slug ? normalizeTags([r.species_slug])[0] ?? null : null,
    waterTypes,
    minVolumeL: toNumber(r.min_volume_l),
    maxVolumeL: toNumber(r.max_volume_l),
    attributes,
  };
}

/** Parse un fichier CSV ou JSON en lignes brutes. */
export function parseCatalogFile(buffer: Buffer, filename: string, mimetype?: string): Record<string, unknown>[] {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  const isJson = filename.toLowerCase().endsWith('.json') || mimetype === 'application/json' || text.trim().startsWith('[') || text.trim().startsWith('{');
  if (isJson) {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw badRequest('JSON invalide');
    }
    const rows = Array.isArray(data) ? data : (data as { products?: unknown }).products;
    if (!Array.isArray(rows)) throw badRequest('Le JSON doit être un tableau de produits ou { "products": [...] }');
    return rows as Record<string, unknown>[];
  }
  const delimiter = text.split('\n')[0]?.includes(';') ? ';' : ',';
  try {
    return parse(text, { columns: true, skip_empty_lines: true, trim: true, delimiter, relax_column_count: true, bom: true });
  } catch (e) {
    throw badRequest('CSV invalide', (e as Error).message);
  }
}

/** Upsert des lignes dans le catalogue du magasin (clé : shopId + ref). */
export async function importCatalog(shopId: string, rows: Record<string, unknown>[]): Promise<ImportReport> {
  const report: ImportReport = { total: rows.length, imported: 0, errors: [] };
  const normalized: { index: number; row: NormalizedRow }[] = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      normalized.push({ index: i, row: normalizeRow(rows[i]) });
    } catch (e) {
      report.errors.push({ row: i + 1, message: (e as Error).message });
    }
  }

  // Dédoublonnage par ref dans le fichier (la dernière ligne gagne)
  const byRef = new Map<string, NormalizedRow>();
  for (const { row } of normalized) byRef.set(row.externalRef, row);

  await prisma.$transaction(
    [...byRef.values()].map((row) =>
      prisma.product.upsert({
        where: { shopId_externalRef: { shopId, externalRef: row.externalRef } },
        create: { shopId, ...row, attributes: row.attributes as Prisma.InputJsonObject, active: true },
        update: { ...row, attributes: row.attributes as Prisma.InputJsonObject, active: true },
      }),
    ),
  );
  report.imported = byRef.size;
  return report;
}
