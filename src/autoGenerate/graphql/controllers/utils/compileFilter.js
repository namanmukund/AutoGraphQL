import { findIndex } from 'lodash';
import { recursiveFilter } from './processFilter';

// Get single key value from object
const getKeyValue = (obj) => {
  const key = Object.keys(obj)[0];
  return { key, value: obj[key] };
};
// Compile our array filter
const compileFilter = {
  // Generic filters
  // and filter
  and(data, filter) {
    let result = true;
    filter.forEach((singleFilter) => {
      const { key, value } = getKeyValue(singleFilter);
      result = result && recursiveFilter(data, key, value);
    });
    return result;
  },
  // or filter
  or(data, filter) {
    let result = false;
    filter.forEach((singleFilter) => {
      const { key, value } = getKeyValue(singleFilter);
      result = result || recursiveFilter(data, key, value);
    });
    return result;
  },
  // not filter
  not(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => val !== value);
  },
  // in filter
  in(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => value.includes(val));
  },
  // not in filter
  not_in(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => !value.includes(val));
  },
  // All integer filters
  // less than filter
  lt(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => val < value);
  },
  // greater than filter
  gt(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => val > value);
  },
  // All string filters
  // contains filter
  contains(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => val.includes(value));
  },
  // not contains filter
  not_contains(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => !val.includes(value));
  },
  // startsWith filter
  startsWith(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => val.startsWith(value));
  },
  // equal filter
  equal(data, key, value) {
    return [].concat(key === 'this' ? data : data[key]).some((val) => val === value);
  },
  // find inside an object
  checkReferenceIndex(data, key, value) {
    return findIndex([].concat(key === 'this' ? data : data[key]), value) !== -1;
  },
};

export default compileFilter;
