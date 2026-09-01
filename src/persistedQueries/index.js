import crypto from 'crypto';
import fs from 'fs';
import { ApolloError } from 'apollo-server-errors';
import { log } from '../../utils';

/**
 * Computes a SHA256 hex digest for a GraphQL query string.
 *
 * @param {string} queryString
 * @returns {string} SHA256 hash
 */
export const computeQueryHash = (queryString = '') => {
  const normalized = queryString.trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

/**
 * Manager class for storing, retrieving, and safelisting persisted queries.
 */
export class PersistedQueryManager {
  constructor({ safelistOnly = false } = {}) {
    this.cache = new Map();
    this.safelist = new Set();
    this.safelistOnly = safelistOnly;
  }

  /**
   * Registers a query with its SHA256 hash.
   *
   * @param {string} hash
   * @param {string} query
   * @param {boolean} [isSafelisted=false]
   */
  registerQuery(hash, query, isSafelisted = false) {
    if (!hash || !query) return;
    this.cache.set(hash, query);
    if (isSafelisted) {
      this.safelist.add(hash);
    }
  }

  /**
   * Retrieves a query by its SHA256 hash.
   *
   * @param {string} hash
   * @returns {string|null}
   */
  getQuery(hash) {
    return this.cache.get(hash) || null;
  }

  /**
   * Checks whether a query hash exists in cache.
   *
   * @param {string} hash
   * @returns {boolean}
   */
  hasQuery(hash) {
    return this.cache.has(hash);
  }

  /**
   * Checks whether a query hash is in the approved safelist.
   *
   * @param {string} hash
   * @returns {boolean}
   */
  isSafelisted(hash) {
    return this.safelist.has(hash);
  }

  /**
   * Loads a manifest of persisted queries (e.g. from a build artifact or file).
   * Supports both:
   *   - `{ [hash]: query }`
   *   - `[{ hash, query }]` or `{ operations: [{ hash, query }] }`
   *
   * @param {string|Object} manifestOrPath
   */
  loadManifest(manifestOrPath) {
    let manifestData = manifestOrPath;

    if (typeof manifestOrPath === 'string') {
      if (fs.existsSync(manifestOrPath)) {
        const raw = fs.readFileSync(manifestOrPath, 'utf8');
        manifestData = JSON.parse(raw);
      } else {
        log(`Persisted queries manifest file not found: ${manifestOrPath}`, 'error');
        return;
      }
    }

    if (!manifestData || typeof manifestData !== 'object') return;

    if (Array.isArray(manifestData)) {
      manifestData.forEach((item) => {
        if (item.hash && item.query) {
          this.registerQuery(item.hash, item.query, true);
        }
      });
    } else if (Array.isArray(manifestData.operations)) {
      manifestData.operations.forEach((item) => {
        if (item.hash && item.query) {
          this.registerQuery(item.hash, item.query, true);
        }
      });
    } else {
      Object.keys(manifestData).forEach((hash) => {
        const query = manifestData[hash];
        if (typeof query === 'string') {
          this.registerQuery(hash, query, true);
        }
      });
    }

    log(`Loaded ${this.safelist.size} persisted queries into safelist`, 'status');
  }

  /**
   * Clears the in-memory cache and safelist (useful for tests).
   */
  clear() {
    this.cache.clear();
    this.safelist.clear();
  }
}

// Global default manager
export const defaultQueryManager = new PersistedQueryManager();

// Load manifest from environment path if configured
if (process.env.PERSISTED_QUERIES_MANIFEST) {
  defaultQueryManager.loadManifest(process.env.PERSISTED_QUERIES_MANIFEST);
}

/**
 * Creates an Apollo Server plugin enforcing Automatic Persisted Queries (APQ) and Safelisting.
 *
 * @param {Object} [options]
 * @param {PersistedQueryManager} [options.manager] - Custom manager instance
 * @param {boolean} [options.safelistOnly] - Enforce safelist only (disables arbitrary queries)
 * @returns {Object} Apollo Server Plugin
 */
export const createPersistedQueryPlugin = (options = {}) => {
  const manager = options.manager || defaultQueryManager;
  const isSafelistOnly = options.safelistOnly !== undefined
    ? options.safelistOnly
    : process.env.PERSISTED_QUERIES_ONLY === 'true';

  return {
    async requestDidStart() {
      return {
        async didResolveSource(requestContext) {
          const { request } = requestContext;
          const persistedQueryExt = request.extensions && request.extensions.persistedQuery;

          // Case 1: Client sent persistedQuery extension
          if (persistedQueryExt) {
            const { sha256Hash } = persistedQueryExt;

            if (!sha256Hash) {
              throw new ApolloError('Invalid persisted query extension: missing sha256Hash', 'GRAPHQL_VALIDATION_FAILED');
            }

            // If safelist-only mode is active, query hash must be in the approved safelist
            if (isSafelistOnly && !manager.isSafelisted(sha256Hash)) {
              throw new ApolloError(
                'PersistedQueryNotSupported: This query hash is not in the approved safelist.',
                'PERSISTED_QUERY_NOT_SUPPORTED',
              );
            }

            // If client did not provide the query string, resolve from cache
            if (!request.query) {
              const cachedQuery = manager.getQuery(sha256Hash);
              if (cachedQuery) {
                request.query = cachedQuery;
                requestContext.source = cachedQuery;
              } else {
                throw new ApolloError('PersistedQueryNotFound', 'PERSISTED_QUERY_NOT_FOUND');
              }
            } else {
              // Client provided both hash and query string: verify hash and cache it
              const expectedHash = computeQueryHash(request.query);
              if (expectedHash !== sha256Hash) {
                throw new ApolloError('provided sha256Hash does not match query', 'GRAPHQL_VALIDATION_FAILED');
              }
              manager.registerQuery(sha256Hash, request.query, false);
            }
            return;
          }

          // Case 2: Client did not send persistedQuery extension
          // If in safelist-only production mode, reject arbitrary queries (except introspection if allowed)
          if (isSafelistOnly) {
            const isIntrospection = request.query && (
              request.query.includes('__schema') || request.query.includes('__type')
            );

            if (!isIntrospection) {
              throw new ApolloError(
                'PersistedQueryNotSupported: Arbitrary GraphQL queries are disabled. Only approved persisted queries are permitted.',
                'PERSISTED_QUERY_NOT_SUPPORTED',
              );
            }
          }
        },
      };
    },
  };
};

export default {
  computeQueryHash,
  PersistedQueryManager,
  defaultQueryManager,
  createPersistedQueryPlugin,
};
