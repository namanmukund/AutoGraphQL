import Redis from 'ioredis';
import redisConfig from '../config/redis';
import { log } from '../utils';

const redisClient = new Redis({
  ...redisConfig,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redisClient
  .on('error', (error) => {
    // Log Redis error non-blockingly
    if (error.code === 'ECONNREFUSED') {
      log('Redis not reachable at configured host:port. Continuing without cache/pubsub.', 'status');
    } else {
      log(`Redis error: ${error.message}`, 'error');
    }
  })
  .on('connect', () => {
    if (!process.env.SECONDARY_APPLICATION_NAME) log('Redis client connected', 'status');
  });

export default redisClient;
