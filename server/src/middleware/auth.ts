import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type JwtPayload } from '../lib/auth.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import type { Role } from '../generated/prisma/enums.js';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

/** Lit le JWT (Authorization: Bearer ...) et le vérifie. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(unauthorized('Token invalide ou expiré'));
  }
}

/** Restreint la route à un ou plusieurs rôles. À chaîner après requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden(`Réservé aux rôles : ${roles.join(', ')}`));
    next();
  };
}
