import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/errors.js';
import { config } from '../config.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  // Erreurs multer (fichier trop gros, etc.)
  if (err && typeof err === 'object' && 'code' in err && String((err as { code: string }).code).startsWith('LIMIT_')) {
    return res.status(400).json({ error: 'Fichier invalide', details: String((err as { message?: unknown }).message ?? err) });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erreur interne', details: config.isProd ? undefined : String(err) });
}
