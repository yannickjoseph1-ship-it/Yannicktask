import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { badRequest } from '../lib/errors.js';

/** Valide req.body avec un schéma zod et le remplace par la valeur parsée. */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest('Corps de requête invalide', result.error.issues));
    }
    req.body = result.data;
    next();
  };
}
