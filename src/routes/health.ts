import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';
import { checkRedisConnection } from '../config/redis.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const [dbHealthy, redisHealthy] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection(),
  ]);

  const status = dbHealthy && redisHealthy ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    status,
    database: dbHealthy ? 'connected' : 'disconnected',
    redis: redisHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
