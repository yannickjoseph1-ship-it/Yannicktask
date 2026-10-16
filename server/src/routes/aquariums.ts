import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { notFound } from '../lib/errors.js';
import { checkCompatibility } from '../domain/compatibility/index.js';
import { matchConfiguration, deriveDimensions } from '../domain/matching/index.js';
import type { AquariumConfig } from '../domain/types.js';
import { loadActiveCatalog, loadSpeciesIndex } from '../services/catalog.js';

export const aquariumsRouter = Router();
aquariumsRouter.use(requireAuth, requireRole('CLIENT'));

const itemSchema = z.object({
  kind: z.enum(['FISH', 'INVERTEBRATE', 'PLANT', 'DECOR', 'EQUIPMENT']),
  refSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(500),
});

export const configSchema = z.object({
  volumeL: z.number().int().min(5).max(5000),
  waterType: z.enum(['FRESH', 'MARINE', 'BRACKISH']),
  lengthCm: z.number().int().min(10).max(500).nullable().optional(),
  widthCm: z.number().int().min(10).max(300).nullable().optional(),
  heightCm: z.number().int().min(10).max(300).nullable().optional(),
  pricePreference: z.enum(['ECO', 'STANDARD', 'PREMIUM']).optional(),
  items: z.array(itemSchema).max(100),
});

const aquariumSchema = configSchema.extend({ name: z.string().min(1).max(120) });

/** Analyse complète d'une configuration : compatibilité + matching + budget. */
export async function analyzeConfig(config: AquariumConfig) {
  const [species, catalog] = await Promise.all([loadSpeciesIndex(), loadActiveCatalog()]);
  const compatibility = checkCompatibility(config, species);
  const match = matchConfiguration(config, species, catalog);
  return { dimensions: deriveDimensions(config), compatibility, match };
}

/** POST /aquariums/preview — analyse sans sauvegarde (utilisé par le configurateur). */
aquariumsRouter.post('/preview', validateBody(configSchema), async (req, res, next) => {
  try {
    res.json(await analyzeConfig(req.body as AquariumConfig));
  } catch (e) {
    next(e);
  }
});

const aquariumInclude = { items: { include: { species: { select: { slug: true, commonName: true, kind: true, color: true } } } } } as const;

aquariumsRouter.get('/', async (req, res, next) => {
  try {
    const aquariums = await prisma.aquarium.findMany({
      where: { userId: req.auth!.sub },
      include: aquariumInclude,
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ aquariums });
  } catch (e) {
    next(e);
  }
});

async function speciesIdMap(items: z.infer<typeof itemSchema>[]) {
  const slugs = items.filter((i) => ['FISH', 'INVERTEBRATE', 'PLANT'].includes(i.kind)).map((i) => i.refSlug);
  const rows = await prisma.species.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  return new Map(rows.map((r) => [r.slug, r.id]));
}

aquariumsRouter.post('/', validateBody(aquariumSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof aquariumSchema>;
    const ids = await speciesIdMap(body.items);
    const aquarium = await prisma.aquarium.create({
      data: {
        userId: req.auth!.sub,
        name: body.name,
        volumeL: body.volumeL,
        waterType: body.waterType,
        lengthCm: body.lengthCm ?? null,
        widthCm: body.widthCm ?? null,
        heightCm: body.heightCm ?? null,
        pricePreference: body.pricePreference ?? 'STANDARD',
        items: { create: body.items.map((i) => ({ ...i, speciesId: ids.get(i.refSlug) ?? null })) },
      },
      include: aquariumInclude,
    });
    res.status(201).json({ aquarium });
  } catch (e) {
    next(e);
  }
});

async function ownedAquarium(id: string, userId: string) {
  const aquarium = await prisma.aquarium.findFirst({ where: { id, userId }, include: aquariumInclude });
  if (!aquarium) throw notFound('Aquarium introuvable');
  return aquarium;
}

aquariumsRouter.get('/:id', async (req, res, next) => {
  try {
    res.json({ aquarium: await ownedAquarium(req.params.id as string, req.auth!.sub) });
  } catch (e) {
    next(e);
  }
});

aquariumsRouter.put('/:id', validateBody(aquariumSchema), async (req, res, next) => {
  try {
    const existing = await ownedAquarium(req.params.id as string, req.auth!.sub);
    const body = req.body as z.infer<typeof aquariumSchema>;
    const ids = await speciesIdMap(body.items);
    const aquarium = await prisma.aquarium.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        volumeL: body.volumeL,
        waterType: body.waterType,
        lengthCm: body.lengthCm ?? null,
        widthCm: body.widthCm ?? null,
        heightCm: body.heightCm ?? null,
        pricePreference: body.pricePreference ?? 'STANDARD',
        items: { deleteMany: {}, create: body.items.map((i) => ({ ...i, speciesId: ids.get(i.refSlug) ?? null })) },
      },
      include: aquariumInclude,
    });
    res.json({ aquarium });
  } catch (e) {
    next(e);
  }
});

aquariumsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await ownedAquarium(req.params.id as string, req.auth!.sub);
    await prisma.aquarium.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/** POST /aquariums/:id/quote — lance le matching et persiste le devis (leads magasins). */
aquariumsRouter.post('/:id/quote', async (req, res, next) => {
  try {
    const aquarium = await ownedAquarium(req.params.id as string, req.auth!.sub);
    const config: AquariumConfig = {
      volumeL: aquarium.volumeL,
      waterType: aquarium.waterType,
      lengthCm: aquarium.lengthCm,
      widthCm: aquarium.widthCm,
      heightCm: aquarium.heightCm,
      pricePreference: aquarium.pricePreference,
      items: aquarium.items.map((i) => ({ kind: i.kind, refSlug: i.refSlug, quantity: i.quantity })),
    };
    const analysis = await analyzeConfig(config);
    const quote = await prisma.quote.create({
      data: {
        aquariumId: aquarium.id,
        totalCents: analysis.match.totalCents,
        currency: analysis.match.currency,
        coverage: analysis.match.coverage,
        lines: {
          create: analysis.match.lines.map((l) => ({
            requirementKey: l.requirement.key,
            label: l.requirement.label,
            category: l.requirement.category,
            quantity: l.best?.quantity ?? l.requirement.quantity,
            status: l.status,
            productId: l.best?.product.id ?? null,
            shopId: l.best?.product.shopId ?? null,
            unitPriceCents: l.best?.product.priceCents ?? null,
            score: l.best?.score ?? null,
          })),
        },
      },
    });
    res.status(201).json({ quoteId: quote.id, ...analysis });
  } catch (e) {
    next(e);
  }
});

aquariumsRouter.get('/:id/quotes', async (req, res, next) => {
  try {
    const aquarium = await ownedAquarium(req.params.id as string, req.auth!.sub);
    const quotes = await prisma.quote.findMany({
      where: { aquariumId: aquarium.id },
      include: { lines: { include: { product: { select: { name: true } }, shop: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ quotes });
  } catch (e) {
    next(e);
  }
});
