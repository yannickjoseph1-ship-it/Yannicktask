import { Router, raw } from 'express';
import { handleWebhook } from '../services/stripe.js';

export const webhooksRouter = Router();

/** POST /webhooks/stripe — body brut requis pour vérifier la signature. */
webhooksRouter.post('/stripe', raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    res.json(await handleWebhook(req.body as Buffer, Array.isArray(sig) ? sig[0] : sig));
  } catch (e) {
    next(e);
  }
});
