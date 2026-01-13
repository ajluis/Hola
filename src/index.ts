import { createApp } from './app.js';
import { config } from './config/index.js';
import { checkDatabaseConnection, closeDatabaseConnection } from './config/database.js';
import { checkRedisConnection, closeRedisConnection } from './config/redis.js';
import { schedulerService } from './services/index.js';

async function main() {
  console.log('Starting Hola server...');

  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  console.log('Database connected');

  // Check Redis connection
  const redisConnected = await checkRedisConnection();
  if (!redisConnected) {
    console.error('Failed to connect to Redis');
    process.exit(1);
  }
  console.log('Redis connected');

  // Start scheduler
  schedulerService.start();

  // Create and start server
  const app = createApp();

  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`Server running on http://${config.HOST}:${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);

    // Stop scheduler
    schedulerService.stop();

    server.close(async () => {
      console.log('HTTP server closed');

      await Promise.all([closeDatabaseConnection(), closeRedisConnection()]);

      console.log('All connections closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
