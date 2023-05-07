import { CacheController } from '../../../controllers';

const cacheKeys = async (_root, params) => {
  const { pattern } = params;
  const cacheClient = new CacheController({
    bypass: true,
  });
  const cachKeys = await cacheClient.keys(pattern);
  return {
    meta: cachKeys.length || 0,
    keys: cachKeys,
  };
};

const getCache = async (_root, params) => {
  const { key } = params;
  const cacheClient = new CacheController({
    bypass: true,
  });
  const cacheData = await cacheClient.get(key);
  return JSON.stringify(cacheData);
};

const purgeCache = async (_root, params) => {
  try {
    const { pattern } = params;
    const cacheClient = new CacheController({
      bypass: true,
    });
    let keysToFlush = [];
    if (pattern) {
      keysToFlush = await cacheClient.keys(pattern);
      if (keysToFlush && keysToFlush.length) {
        await cacheClient.destroy(keysToFlush);
      }
    } else {
      await cacheClient.flushall();
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
