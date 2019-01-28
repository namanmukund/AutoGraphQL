import { findKey } from 'lodash';

const isDocContainsGivenKeyValue = (doc, key, value) => {
  if (!doc || !key || !value) {
    return false;
  }
  // if array find in array
  if (doc && Array.isArray(doc)) {
    if (findKey(doc, [key, value])) {
      return true;
    }
    // if object find in object
  } else if (doc && doc[key] === value) {
    return true;
  }
  return false;
};

export default isDocContainsGivenKeyValue;
