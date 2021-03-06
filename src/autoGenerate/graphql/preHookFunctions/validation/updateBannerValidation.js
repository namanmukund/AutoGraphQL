import { get } from 'lodash';
import checkIfBannerPublishedForTheDuration from './utils/checkIfBannerPublishedForTheDuration';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { InvalidBannerDateRangeError, DatabaseRecordNotFoundError, BannerFieldRequiredError } from '../../../../../constants/errors';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';

const fetchBanner = async (bannerId) => {
  const query = `
          {
              banner(id:"${bannerId}") {
                id  
                status
                type
                expiryDate
                inceptionDate
              }
          }
          `;
  const banner = await callLocalGraphqlApi(query);
  return get(banner, 'data.banner');
};

const checkIfRequiredFieldsExists = (input, existingBannerData) => {
  /**
   * Required Fields : Discount, width, height
   */
  const requiredFields = ['discount', 'width', 'height'];
  requiredFields.forEach((key) => {
    if (!(get(input, key, get(existingBannerData, key, false)))) {
      throw new BannerFieldRequiredError({
        data: {
          error: `${key} input is required!`,
        },
      });
    }
  });
};

const updateBannerValidation = async (params) => {
  const { id: bannerId, input } = params;
  const existingBannerData = await fetchBanner(bannerId);
  if (!get(existingBannerData, 'id', null)) {
    throw new DatabaseRecordNotFoundError();
  }
  /** throws error if ExpiryDate < InceptionDate */
  if (
    (new Date(get(input, 'expiryDate', existingBannerData.expiryDate)))
    < (new Date(get(input, 'inceptionDate', existingBannerData.inceptionDate)))
  ) {
    throw new InvalidBannerDateRangeError();
  }
  if (get(input, 'status', get(existingBannerData, 'status', UNPUBLISHED)) === PUBLISHED) {
    checkIfRequiredFieldsExists(input, existingBannerData);
    await checkIfBannerPublishedForTheDuration({
      bannerId,
      inceptionDate: get(input, 'inceptionDate', existingBannerData.inceptionDate),
      expiryDate: get(input, 'expiryDate', existingBannerData.expiryDate),
      type: get(input, 'type', existingBannerData.type),
    });
  }
  return true;
};

export default updateBannerValidation;
