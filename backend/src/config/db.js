import Redis from 'ioredis';
import env from './env.js';

let redis = null;
let redisConnected = false;

if (env.redisUrl) {
  redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  redis.on('connect', () => {
    redisConnected = true;
    console.log('Redis connected');
  });

  redis.on('error', (err) => {
    redisConnected = false;
    console.error('Redis connection error:', err.message || err);
  });
} else {
  console.warn('REDIS_URL not provided. Redis features will be unavailable.');
}

export const isRedisReady = () => Boolean(redis && redisConnected);

export { redis };
