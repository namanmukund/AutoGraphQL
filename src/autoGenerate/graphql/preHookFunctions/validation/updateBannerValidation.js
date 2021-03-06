import { get } from 'lodash';
import checkIfBannerPublishedForTheDuration from './utils/checkIfBannerPublishedForTheDuration';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { InvalidBannerDateRangeError, DatabaseRecordNotFoundError } from '../../../../../constants/errors';

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
  await checkIfBannerPublishedForTheDuration({
    bannerId,
    inceptionDate: get(input, 'inceptionDate', existingBannerData.inceptionDate),
    expiryDate: get(input, 'expiryDate', existingBannerData.expiryDate),
    status: get(input, 'status', existingBannerData.status),
    type: get(input, 'type', existingBannerData.type),
  });
  return true;
};

export default updateBannerValidation;
