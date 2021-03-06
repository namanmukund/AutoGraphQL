import { get } from 'lodash';
import checkIfBannerPublishedForTheDuration from './utils/checkIfBannerPublishedForTheDuration';
import { InvalidBannerDateRangeError } from '../../../../../constants/errors';

const addBannerValidation = async (params) => {
  const { input } = params;
  if (
    (new Date(get(input, 'expiryDate', null)))
    < (new Date(get(input, 'inceptionDate', null)))
  ) {
    throw new InvalidBannerDateRangeError();
  }
  await checkIfBannerPublishedForTheDuration({
    inceptionDate: get(input, 'inceptionDate', null),
    expiryDate: get(input, 'expiryDate', null),
    status: get(input, 'status', null),
    type: get(input, 'type', 'marketing'),
  });
  return true;
};

export default addBannerValidation;
