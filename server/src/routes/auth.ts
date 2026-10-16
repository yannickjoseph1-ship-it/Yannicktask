import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, signToken, verifyPassword } from '../lib/auth.js';
import { conflict, unauthorized } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const authRouter = Router();

const registerSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('CLIENT'),
    email: z.email(),
    password: z.string().min(8, '8 caractères minimum'),
    displayName: z.string().min(1).max(80),
  }),
  z.object({
    role: z.literal('SHOP'),
    email: z.email(),
    password: z.string().min(8, '8 caractères minimum'),
    displayName: z.string().min(1).max(80),
    shop: z.object({
      name: z.string().min(1).max(120),
      city: z.string().max(80).optional(),
      description: z.string().max(1000).optional(),
      website: z.url().optional(),
    }),
  }),
]);

const loginSchema = z.object({ email: z.email(), password: z.string().min(1) });

const publicUser = { id: true, email: true, role: true, displayName: true, createdAt: true } as const;

/** POST /auth/register — crée un compte client ou magasin. */
authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof registerSchema>;
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflict('Un compte existe déjà avec cet email');

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: body.role,
        displayName: body.displayName,
        ...(body.role === 'SHOP' ? { shop: { create: body.shop } } : {}),
      },
      select: { ...publicUser, shop: { select: { id: true, name: true, subscriptionTier: true, subscriptionStatus: true } } },
    });
    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.status(201).json({ token, user });
  } catch (e) {
    next(e);
  }
});

/** POST /auth/login */
authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { shop: { select: { id: true, name: true, subscriptionTier: true, subscriptionStatus: true } } },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) throw unauthorized('Identifiants incorrects');
    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    const { passwordHash: _ph, ...safe } = user;
    res.json({ token, user: safe });
  } catch (e) {
    next(e);
  }
});

/** GET /auth/me */
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.sub },
      select: { ...publicUser, shop: { select: { id: true, name: true, city: true, subscriptionTier: true, subscriptionStatus: true, currentPeriodEnd: true } } },
    });
    if (!user) throw unauthorized();
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
