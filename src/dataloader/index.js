import DataLoader from 'dataloader';
import defaultModels from '../autoGenerate/models';

/**
 * Creates request-scoped DataLoaders for all compiled database models.
 * Ensures that batching and per-request memoization occur within a single GraphQL execution tick,
 * completely avoiding cross-request cache leaks or stale data issues across tenants.
 *
 * @param {Object} [models=defaultModels] - Map of compiled models
 * @returns {Object} Request-scoped DataLoader container
 */
export const createDataLoaders = (models = defaultModels) => {
  const loaders = {};

  /**
   * Lazily retrieve or initialize a DataLoader for a given model
   * @param {string} modelName
   * @returns {DataLoader|null}
   */
  const getLoader = (modelName) => {
    if (!modelName) return null;
    if (loaders[modelName]) return loaders[modelName];

    const Model = models && models[modelName];
    if (!Model || typeof Model.find !== 'function') {
      return null;
    }

    loaders[modelName] = new DataLoader(
      async (ids) => {
        if (!ids || ids.length === 0) return [];
        const stringIds = ids.map((id) => String(id));

        // Single batched database query using $in
        const docs = await Model.find({ id: { $in: stringIds } }).lean().exec();

        const docMap = new Map();
        if (Array.isArray(docs)) {
          docs.forEach((doc) => {
            if (doc && doc.id !== undefined && doc.id !== null) {
              docMap.set(String(doc.id), doc);
            }
          });
        }

        // DataLoader requires the returned array to match the exact order and length of requested ids
        return stringIds.map((id) => docMap.get(id) || null);
      },
      {
        // Cache within this single request tick
        cache: true,
        cacheKeyFn: (key) => String(key),
      },
    );

    return loaders[modelName];
  };

  // Pre-initialize loaders for available models
  if (models && typeof models === 'object') {
    Object.keys(models).forEach((modelName) => {
      getLoader(modelName);
    });
  }

  return {
    getLoader,
    loaders,
    /**
     * Clear cached entry or all entries for a model
     * @param {string} modelName
     * @param {string|number} [id]
     */
    clear: (modelName, id) => {
      const loader = loaders[modelName];
      if (loader) {
        if (id !== undefined && id !== null) {
          loader.clear(String(id));
        } else {
          loader.clearAll();
        }
      }
    },
    clearAll: () => {
      Object.keys(loaders).forEach((modelName) => {
        loaders[modelName].clearAll();
      });
    },
  };
};

export default createDataLoaders;
