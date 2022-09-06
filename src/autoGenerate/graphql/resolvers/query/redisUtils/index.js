import { RedisController } from '../../../controllers';

const cacheKeys = async (_root, params) => {
  const { pattern } = params;
  const redisClient = new RedisController({
    bypass: true,
  });
  const cachKeys = await redisClient.keys(pattern);
  return {
    meta: cachKeys.length || 0,
    keys: cachKeys,
  };
};

const getCache = async (_root, params) => {
  const { key } = params;
  const redisClient = new RedisController({
    bypass: true,
  });
  const cacheData = await redisClient.get(key);
  return JSON.stringify(cacheData);
};

const purgeCache = async (_root, params) => {
  try {
    const { pattern } = params;
    const redisClient = new RedisController({
      bypass: true,
    });
    let keysToFlush = [];
    if (pattern) {
      keysToFlush = await redisClient.keys(pattern);
      await redisClient.destroy(keysToFlush);
    } else {
      await redisClient.flushall();
    }
    return {
      result: true,
    };
  } catch (e) {
    return {
      result: false,
      error: e,
    };
  }
};

export default { cacheKeys, purgeCache, getCache };
