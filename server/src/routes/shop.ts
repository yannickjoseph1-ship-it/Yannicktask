import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { badRequest, notFound } from '../lib/errors.js';
import { importCatalog, parseCatalogFile } from '../services/catalog-import.js';
import { createCheckoutSession, createPortalSession, devSetSubscription } from '../services/stripe.js';
import { config } from '../config.js';

export const shopRouter = Router();
shopRouter.use(requireAuth, requireRole('SHOP'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function myShop(userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId } });
  if (!shop) throw notFound('Magasin introuvable');
  return shop;
}

shopRouter.get('/me', async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    const [productCount, leadCount] = await Promise.all([
      prisma.product.count({ where: { shopId: shop.id, active: true } }),
      prisma.quoteLine.count({ where: { shopId: shop.id } }),
    ]);
    res.json({ shop, stats: { productCount, leadCount }, stripeEnabled: config.stripe.enabled });
  } catch (e) {
    next(e);
  }
});

const shopUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  city: z.string().max(80).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  website: z.url().nullable().optional(),
});

shopRouter.put('/me', validateBody(shopUpdateSchema), async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    const updated = await prisma.shop.update({ where: { id: shop.id }, data: req.body as z.infer<typeof shopUpdateSchema> });
    res.json({ shop: updated });
  } catch (e) {
    next(e);
  }
});

// ------------------------------ Catalogue -------------------------------

/** POST /shop/catalog/upload — multipart "file" (CSV ou JSON) ou body JSON { products: [...] }. */
shopRouter.post('/catalog/upload', upload.single('file'), async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    let rows: Record<string, unknown>[];
    if (req.file) {
      rows = parseCatalogFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body && Array.isArray((req.body as { products?: unknown }).products)) {
      rows = (req.body as { products: Record<string, unknown>[] }).products;
    } else {
      throw badRequest('Fournir un fichier "file" (CSV/JSON) ou un body { products: [...] }');
    }
    if (rows.length === 0) throw badRequest('Aucune ligne à importer');
    if (rows.length > 5000) throw badRequest('Maximum 5000 produits par import');
    const report = await importCatalog(shop.id, rows);
    res.json({ report });
  } catch (e) {
    next(e);
  }
});

shopRouter.get('/products', async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize ?? 50)));
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const where = { shopId: shop.id, active: true, ...(category ? { category: category as never } : {}) };
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

shopRouter.delete('/products/:id', async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    const result = await prisma.product.updateMany({ where: { id: req.params.id as string, shopId: shop.id }, data: { active: false } });
    if (result.count === 0) throw notFound('Produit introuvable');
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

shopRouter.delete('/products', async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    const result = await prisma.product.updateMany({ where: { shopId: shop.id, active: true }, data: { active: false } });
    res.json({ deactivated: result.count });
  } catch (e) {
    next(e);
  }
});

// ------------------------------- Leads ----------------------------------

/** GET /shop/leads — lignes de devis clients pointant vers les produits du magasin. */
shopRouter.get('/leads', async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    const lines = await prisma.quoteLine.findMany({
      where: { shopId: shop.id },
      include: {
        product: { select: { name: true, externalRef: true } },
        quote: { select: { id: true, createdAt: true, totalCents: true, aquarium: { select: { name: true, volumeL: true, waterType: true } } } },
      },
      orderBy: { quote: { createdAt: 'desc' } },
      take: 200,
    });
    res.json({ leads: lines });
  } catch (e) {
    next(e);
  }
});

// ---------------------------- Abonnement --------------------------------

const tierSchema = z.object({ tier: z.enum(['STANDARD', 'PREMIUM']) });

shopRouter.get('/subscription', async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    res.json({
      tier: shop.subscriptionTier,
      status: shop.subscriptionStatus,
      currentPeriodEnd: shop.currentPeriodEnd,
      stripeEnabled: config.stripe.enabled,
      plans: [
        { tier: 'STANDARD', label: 'Standard', priceEur: 29, features: ['Catalogue illimité', 'Apparition dans les recommandations', 'Leads clients'] },
        { tier: 'PREMIUM', label: 'Premium', priceEur: 79, features: ['Tout Standard', 'Priorité dans les recommandations à produit équivalent', 'Mise en avant des offres groupées'] },
      ],
    });
  } catch (e) {
    next(e);
  }
});

/** POST /shop/subscription/checkout { tier } → URL Stripe Checkout. */
shopRouter.post('/subscription/checkout', validateBody(tierSchema), async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    const { tier } = req.body as z.infer<typeof tierSchema>;
    res.json(await createCheckoutSession(shop.id, tier));
  } catch (e) {
    next(e);
  }
});

/** POST /shop/subscription/portal → URL du portail de facturation Stripe. */
shopRouter.post('/subscription/portal', async (req, res, next) => {
  try {
    const shop = await myShop(req.auth!.sub);
    res.json(await createPortalSession(shop.id));
  } catch (e) {
    next(e);
  }
});

/** POST /shop/subscription/dev { tier } — simulation hors production quand Stripe n'est pas configuré. */
shopRouter.post('/subscription/dev', validateBody(z.object({ tier: z.enum(['NONE', 'STANDARD', 'PREMIUM']) })), async (req, res, next) => {
  try {
    if (config.isProd || config.stripe.enabled) throw badRequest('Simulation désactivée : utiliser Stripe Checkout');
    const shop = await myShop(req.auth!.sub);
    await devSetSubscription(shop.id, (req.body as { tier: 'NONE' | 'STANDARD' | 'PREMIUM' }).tier);
    res.json({ shop: await prisma.shop.findUnique({ where: { id: shop.id } }) });
  } catch (e) {
    next(e);
  }
});
