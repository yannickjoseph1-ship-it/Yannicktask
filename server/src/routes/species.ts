import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { DECOR_SLUGS, EQUIPMENT_SLUGS } from '../domain/matching/requirements.js';

export const speciesRouter = Router();

/** GET /species?waterType=FRESH&kind=FISH — référentiel public. */
speciesRouter.get('/', async (req, res, next) => {
  try {
    const waterType = typeof req.query.waterType === 'string' ? req.query.waterType : undefined;
    const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    const rows = await prisma.species.findMany({
      where: {
        ...(waterType ? { waterType: waterType as 'FRESH' | 'MARINE' | 'BRACKISH' } : {}),
        ...(kind ? { kind: kind as 'FISH' | 'INVERTEBRATE' | 'PLANT' } : {}),
      },
      orderBy: [{ kind: 'asc' }, { commonName: 'asc' }],
    });
    res.json({ species: rows });
  } catch (e) {
    next(e);
  }
});

/** GET /species/options — slugs de décor et de matériel sélectionnables. */
speciesRouter.get('/options', (_req, res) => {
  res.json({
    decor: Object.entries(DECOR_SLUGS).map(([slug, label]) => ({ slug, label })),
    equipment: Object.entries(EQUIPMENT_SLUGS).map(([slug, d]) => ({ slug, label: d.label, category: d.category })),
  });
});
