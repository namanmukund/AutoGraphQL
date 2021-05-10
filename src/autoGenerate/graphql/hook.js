import { isArray } from 'lodash';
import { functions } from '../../../utils';

const { hookFunctions } = functions || {};

const hook = (data, mutationName, hookName) => {
  if (!data) {
    return data;
  }
  let newData = data;
  const arrayName = `${mutationName}${hookName}`;
  if (hookFunctions && isArray(hookFunctions[arrayName])) {
    const loopArray = hookFunctions[arrayName];
    loopArray.map((fn) => {
      newData = fn(newData);

      return null;
    });
  }
  return newData;
};

export default hook;
