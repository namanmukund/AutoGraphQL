import { camelCase } from 'lodash';

const joinAndLowerCaseObjectProperties = (obj) => {
  const newObj = {};
  let newKey;
  let value;
  // recursively call for each element in array
  if (obj instanceof Array) {
    return obj.map((objValue) => {
      if (typeof objValue === 'object') {
        return joinAndLowerCaseObjectProperties(objValue);
      }
      return objValue;
    });
  }
  // Get all keys
  const keys = Object.keys(obj);
  keys.forEach((key) => {
    // camelCase each key
    newKey = camelCase(key).toLowerCase();
    value = obj[key];
    // recursively call for array or nested object
    if (value instanceof Array || (value !== null && value.constructor === Object)) {
      value = joinAndLowerCaseObjectProperties(value);
    }
    newObj[newKey] = value;
  });

  return newObj;
};

export default joinAndLowerCaseObjectProperties;
