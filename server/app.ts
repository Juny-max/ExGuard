import express from 'express';
import { productsRouter } from './routes/products.js';
import { batchesRouter } from './routes/batches.js';
import { alertsRouter, disposalRouter, tenantsRouter } from './routes/alerts.js';
import { getDatabaseStatus } from './db/supabaseClient.js';

export function createExpressApp() {
  const app = express();

  app.use(express.json());

  // Health and DB status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: getDatabaseStatus(),
    });
  });

  // API Routes
  app.use('/api/tenants', tenantsRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/batches', batchesRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/disposal', disposalRouter);

  return app;
}
