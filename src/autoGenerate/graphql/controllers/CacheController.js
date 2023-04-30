import fetch from 'node-fetch';
import { get } from 'lodash';
import { log } from '../../../../utils';
import redis from '../../../redis';
import MasterController from './MasterController';
import { STELLATE_PURGE_CONFIG, STELLATE_PURGE_TOKEN } from '../../../../constants';

class CacheController extends MasterController {
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
      try {
        return JSON.parse(data);
      } catch (e) {
        log(e);
        return data || '';
      }
    }
    return null;
  }

  async set(obj, { hkey, maxAge, maxAgeUnit = 'EX' } = {}) {
    try {
      if (this.validateRedisConn()) {
        await this.redis.set(hkey, JSON.stringify(obj), maxAgeUnit, maxAge);
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

  clearStellateEdgeCache({
    typeName, mutationResolverName, inputParams,
  }) {
    // eslint-disable-next-line no-unused-vars
    const _redis = this.redis;
    try {
      if (typeName && STELLATE_PURGE_TOKEN) {
        /**
         * Building Purge Query -
         * Example:
         * typeName -> Topic
         * Query -> mutation { purgeTopic(id:["123"]) } or mutation { purgeTopic }
         */
        const stellateGraphqlQuery = {
          query: `mutation { 
            purge${typeName}${((mutationResolverName !== 'addMutationResolver') && get(inputParams, 'id')) ? `(id:["${get(inputParams, 'id')}"])` : ''}
          }`,
          extensions: {
            source: 'tekie-backend',
          },
        };
        fetch(STELLATE_PURGE_CONFIG.STELLATE_ENDPOINT, {
          headers: STELLATE_PURGE_CONFIG.STELLATE_HEADERS,
          method: 'POST',
          body: JSON.stringify(stellateGraphqlQuery),
        }).then(() => {
          log(`Purged ${typeName} cache ${get(inputParams, 'id') ? `with id: ${get(inputParams, 'id')}` : ''}`, 'stellate');
        }).catch((e) => {
          log(e, 'stellate');
        });
      }
    } catch (e) {
      log(e);
    }
  }

  async flushall() {
    if (this.validateRedisConn()) await redis.flushall();
  }
}

export default CacheController;
