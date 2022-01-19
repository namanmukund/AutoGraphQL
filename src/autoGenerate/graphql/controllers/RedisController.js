import redis from '../../../redis';
import MasterController from './MasterController';

class RedisController extends MasterController {
  constructor(authentication) {
    const model = '';
    super(model, authentication);
    this.redis = redis;
  }

  async get(hkey) {
    let data = await this.redis.get(hkey);
    return JSON.parse(data);
  }
 
  async set(obj, { hkey , maxAge } = {}) {
    try {
      await this.redis.set(hkey, JSON.stringify(obj), 'EX', maxAge)
    } catch (e) {
      console.log(e)
    }
    return hkey;
  }

  async destroy(hkey) {
    await this.redis.del(hkey);
  }

  async flush() {
    await redis.flushall();
  }
}

export default RedisController;
