import { isArray } from 'lodash';

const mergeCustomizer = (objValue, srcValue) => {
  let result;
  if (isArray(objValue)) {
    result = objValue.concat(srcValue);
  }
  return result;
};

export default mergeCustomizer;
