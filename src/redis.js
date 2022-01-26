import Redis from 'ioredis';
import redisConfig from '../config/redis';
import { log } from '../utils';

const redisClient = new Redis(redisConfig);

redisClient
  .on('error', (error) => {
    log(`Failed to connect to Redis client. Error being ${error}`);
    redisClient.quit();
  })
  .on('reconnecting', () => {
    log('Redis client reconnecting!');
  })
  .on('close', () => {
    log('Redis client disconnected!');
  })
  .on('connect', () => log('Redis client connected'));

export default redisClient;
