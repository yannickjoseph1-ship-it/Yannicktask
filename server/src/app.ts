import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { speciesRouter } from './routes/species.js';
import { aquariumsRouter } from './routes/aquariums.js';
import { shopRouter } from './routes/shop.js';
import { webhooksRouter } from './routes/webhooks.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.clientUrl === '*' ? true : [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'] }));

  // Les webhooks Stripe doivent recevoir le body brut : montés avant express.json()
  app.use('/api/webhooks', webhooksRouter);
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, stripe: config.stripe.enabled }));
  app.use('/api/auth', authRouter);
  app.use('/api/species', speciesRouter);
  app.use('/api/aquariums', aquariumsRouter);
  app.use('/api/shop', shopRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Route inconnue' }));
  app.use(errorHandler);
  return app;
}
