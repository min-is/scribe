import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { HAS_REDIS_STORAGE } from '@/app/config';

const redis = HAS_REDIS_STORAGE ? Redis.fromEnv() : undefined;

// Create rate limiter for login attempts: 5 attempts per 15 minutes
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'ratelimit:login',
    })
  : undefined;

// Helper function to check rate limit
export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!loginRateLimiter) {
    // If Redis is not configured, allow the request
    return true;
  }

  const { success } = await loginRateLimiter.limit(identifier);
  return success;
}
