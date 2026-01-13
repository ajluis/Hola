import { getRedisClient } from '../config/redis.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 1000, maxRequests: number = 1) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const redis = await getRedisClient();
    const key = `ratelimit:${identifier}`;
    const now = Date.now();

    // Simple sliding window using sorted sets
    const windowStart = now - this.windowMs;

    // Remove old entries
    await redis.zRemRangeByScore(key, 0, windowStart);

    // Count current requests in window
    const count = await redis.zCard(key);

    if (count >= this.maxRequests) {
      // Get oldest entry to calculate retry time
      const oldest = await redis.zRange(key, 0, 0);
      const oldestTime = oldest.length > 0 ? parseInt(oldest[0], 10) : now;
      const retryAfterMs = Math.max(0, oldestTime + this.windowMs - now);

      return {
        allowed: false,
        remaining: 0,
        retryAfterMs,
      };
    }

    // Add current request
    await redis.zAdd(key, { score: now, value: now.toString() });
    await redis.expire(key, Math.ceil(this.windowMs / 1000) + 1);

    return {
      allowed: true,
      remaining: this.maxRequests - count - 1,
      retryAfterMs: 0,
    };
  }
}

// Per-user rate limiter (1 message per second)
export const userRateLimiter = new RateLimiter(1000, 1);
