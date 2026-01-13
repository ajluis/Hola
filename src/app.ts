import express from 'express';
import { errorHandler, requestLogger } from './middleware/index.js';
import { healthRoutes, webhookRoutes } from './routes/index.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Routes
  app.use(healthRoutes);
  app.use('/webhooks', webhookRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
}
