import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();
app.listen(config.port, () => {
  console.log(`Aqu.app API démarrée sur http://localhost:${config.port} (${config.env}, Stripe ${config.stripe.enabled ? 'activé' : 'simulé'})`);
});
