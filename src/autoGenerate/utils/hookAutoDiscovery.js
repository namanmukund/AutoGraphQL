import fs from 'fs';
import path from 'path';
import { log } from '../../../utils/log';

/**
 * Discovers and loads user-defined lifecycle hooks from the root `hooks/` folder.
 *
 * @param {string} [customHooksDir] Optional custom hooks directory for testing
 * @returns {Object} Consolidated map of hook arrays keyed by `${mutationName}PreHook` / `${mutationName}PostHook`
 */
export const discoverAndLoadUserHooks = (customHooksDir = null) => {
  const hooksDir = customHooksDir || path.resolve(process.cwd(), 'hooks');
  const discoveredHooks = {};

  if (!fs.existsSync(hooksDir)) {
    return discoveredHooks;
  }

  const entries = fs.readdirSync(hooksDir, { withFileTypes: true });

  entries.forEach((entry) => {
    if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) {
      const fullPath = path.join(hooksDir, entry.name);
      try {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const exported = require(fullPath);
        const hookModule = exported.default || exported;

        if (typeof hookModule === 'object' && hookModule !== null) {
          Object.keys(hookModule).forEach((hookName) => {
            const hookFn = hookModule[hookName];
            if (typeof hookFn === 'function') {
              if (!discoveredHooks[hookName]) {
                discoveredHooks[hookName] = [];
              }
              discoveredHooks[hookName].push(hookFn);
            } else if (Array.isArray(hookFn)) {
              if (!discoveredHooks[hookName]) {
                discoveredHooks[hookName] = [];
              }
              discoveredHooks[hookName].push(...hookFn.filter((f) => typeof f === 'function'));
            }
          });
        }
      } catch (err) {
        log(`Error loading user hook from ${fullPath}: ${err.message}`, 'error');
      }
    }
  });

  return discoveredHooks;
};

export default discoverAndLoadUserHooks;
