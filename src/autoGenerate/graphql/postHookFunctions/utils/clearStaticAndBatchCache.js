import { callLocalGraphqlApi } from '../../../../api';

const clearStaticAndBatchCache = (context) => {
  const batchAndSessionCachePattern = 'batch*';
  const staticCachePattern = 'static*';
  const purgeCacheQuery = `
    query purgeCache {
        purgeStaticCache: purgeCache(pattern:"${staticCachePattern}") {
            result
        }
        purgeBatchCache: purgeCache(pattern:"${batchAndSessionCachePattern}") {
            result
        }
    }
    `;
  callLocalGraphqlApi(purgeCacheQuery, {}, context);
};

export default clearStaticAndBatchCache;
