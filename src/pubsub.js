import Redis from 'ioredis';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'apollo-server-express';
import redisConfig from '../config/redis';

/**
 * Why dateReviver? refer following link https://github.com/davidyaha/graphql-redis-subscriptions#using-a-custom-reviver
 */
const dateReviver = (key, value) => {
  const isISO8601Z = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/;
  if (typeof value === 'string' && isISO8601Z.test(value)) {
    const tempDateNumber = Date.parse(value);
    if (!isNaN(tempDateNumber)) {
      return new Date(tempDateNumber);
    }
  }
  return value;
};

/**
 * Initializing PubSub from Apollo or Redis based on current environment.
 * Reason : 
 *   This is because in case of having multiple instances, Apollo creates separate pubSub client
 *  per instance. Which would only publish data if client is connected to only that particular
 *  instance on which pubSub was earlier initialized.
 *   So to avoid any such situation while in production we initialize centralized Redis
 *  PubSub Client.
 */
const pubsub = (process.env.NODE_ENV !== 'production' || process.env.ENABLE_APOLLO_PUBSUB)
  ? new PubSub()
  : (
    new RedisPubSub({
      publisher: new Redis(redisConfig),
      subscriber: new Redis(redisConfig),
      reviver: dateReviver,
    })
  );

export default pubsub;
