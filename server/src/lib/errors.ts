export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
export const badRequest = (m: string, d?: unknown) => new HttpError(400, m, d);
export const unauthorized = (m = 'Non authentifié') => new HttpError(401, m);
export const forbidden = (m = 'Accès refusé') => new HttpError(403, m);
export const notFound = (m = 'Introuvable') => new HttpError(404, m);
export const conflict = (m: string) => new HttpError(409, m);
export const paymentRequired = (m: string) => new HttpError(402, m);
