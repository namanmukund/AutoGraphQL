import { log } from '../../../../utils';
import redis from '../../../redis';
import MasterController from './MasterController';

class RedisController extends MasterController {
  REDIS_SUCCESS_STATE = ['ready', 'connect'];

  constructor(authentication) {
    const model = '';
    super(model, authentication);
    this.redis = redis;
  }

  validateRedisConn() {
    if (this.redis && this.REDIS_SUCCESS_STATE.includes(this.redis.status)) {
      return true;
    }
    return false;
  }

  async get(hkey) {
    if (this.validateRedisConn()) {
      const data = await this.redis.get(hkey);
      return JSON.parse(data);
    }
    return null;
  }

  async set(obj, { hkey, maxAge } = {}) {
    try {
      if (this.validateRedisConn()) {
        await this.redis.set(hkey, JSON.stringify(obj), 'EX', maxAge);
      }
    } catch (e) {
      log(e);
    }
    return hkey;
  }

  async keys(pattern) {
    try {
      if (this.validateRedisConn()) {
        return await this.redis.keys(pattern);
      }
    } catch (e) {
      log(e);
    }
    return [];
  }

  async destroy(hkey) {
    if (this.validateRedisConn()) await this.redis.del(hkey);
  }

  async flushall() {
    if (this.validateRedisConn()) await redis.flushall();
  }
}

export default RedisController;
