import { get } from 'lodash';
import checkIfBannerPublishedForTheDuration from './utils/checkIfBannerPublishedForTheDuration';
import { InvalidBannerDateRangeError, BannerFieldRequiredError } from '../../../../../constants/errors';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';

const checkIfRequiredFieldsExists = (input) => {
  const requiredFields = [
    'title',
    'backgroundImage',
    'discount',
    'textBeforeDiscount',
    'textAfterDiscount',
    'width',
    'height',
    'expiryDate',
    'inceptionDate',
    'type',
  ];
  /** First check if fields exists in input or fallback to check in existing database */
  requiredFields.forEach((key) => {
    if (!(get(input, key, false))) {
      throw new BannerFieldRequiredError({
        data: {
          error: `${key} input is required!`,
        },
      });
    }
  });
};

const addBannerValidation = async (params) => {
  const { input } = params;
  if (
    (new Date(get(input, 'expiryDate', null)))
    < (new Date(get(input, 'inceptionDate', null)))
  ) {
    throw new InvalidBannerDateRangeError();
  }
  if (get(input, 'status', UNPUBLISHED) === PUBLISHED) {
    checkIfRequiredFieldsExists(input);
    await checkIfBannerPublishedForTheDuration({
      inceptionDate: get(input, 'inceptionDate', null),
      expiryDate: get(input, 'expiryDate', null),
      status: get(input, 'status', null),
      type: get(input, 'type', 'marketing'),
    });
  }
  return true;
};

export default addBannerValidation;
