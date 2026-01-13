import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: config.REDIS_URL,
  });

  redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  await redisClient.connect();
  return redisClient;
}

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}
