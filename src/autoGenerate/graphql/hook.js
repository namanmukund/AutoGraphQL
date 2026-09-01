import { isArray } from 'lodash';
import { functions } from '../../../utils';
import { discoverAndLoadUserHooks } from '../utils/hookAutoDiscovery';

const { hookFunctions: staticHookFunctions } = functions || {};
let userDiscoveredHooks = null;

const getHookFunctions = () => {
  if (!userDiscoveredHooks) {
    userDiscoveredHooks = discoverAndLoadUserHooks();
  }
  return {
    ...(staticHookFunctions || {}),
    ...(userDiscoveredHooks || {}),
  };
};

const hook = async (data, mutationName, hookName) => {
  if (!data) {
    return data;
  }
  let newData = data;
  const arrayName = `${mutationName}${hookName}`;
  const allHooks = getHookFunctions();

  if (allHooks && isArray(allHooks[arrayName])) {
    const loopArray = allHooks[arrayName];
    for (let i = 0; i < loopArray.length; i += 1) {
      const fn = loopArray[i];
      if (typeof fn === 'function') {
        // Support both async and sync hooks
        // eslint-disable-next-line no-await-in-loop
        const result = await fn(newData);
        if (result !== undefined) {
          newData = result;
        }
      }
    }
  }
  return newData;
};

export default hook;
