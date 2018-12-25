
import { InvalidParamsError } from '../../../../../constants/errors';

const paginationValidationKeys = (inputParams) => {
  let valid = true;
  if (inputParams && ((inputParams.first && inputParams.last) || (inputParams.after &&
    inputParams.before) || (inputParams.last && inputParams.after) ||
    (inputParams.first && inputParams.before))) {
    valid = false;
  }
  return valid;
};

const paginationKeys = (params) => {
  const validation = paginationValidationKeys(params);
  if (!validation) {
    throw new InvalidParamsError();
  }
  const inputParams = params;
  let firstValue;
  let lastValue;
  if (inputParams.first) {
    firstValue = inputParams.first;
  }
  delete inputParams.first;
  if (inputParams.last) {
    lastValue = inputParams.last;
  }
  delete inputParams.last;
  const afterId = inputParams && inputParams.after;
  delete inputParams.after;
  const beforeId = inputParams && inputParams.before;
  delete inputParams.before;
  const skipValue = inputParams && inputParams.skip ? inputParams.skip : 0;
  delete inputParams.skip;
  return { afterId, beforeId, skipValue, lastValue, firstValue, inputParams };
};

export { paginationKeys, paginationValidationKeys };
