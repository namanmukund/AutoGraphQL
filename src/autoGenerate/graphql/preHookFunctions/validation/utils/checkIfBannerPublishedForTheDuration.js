import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { BannerExistsError } from '../../../../../../constants/errors';

const fetchOverlappingBanners = async (inceptionDate, expiryDate, bannerType, bannerId) => {
  /**
     * Fetch Overlapping Banners having similar 'type' &
     * ranges between inceptionDate and expiryDate
     */
  const query = `
        {
            banners(filter:{
                and: [
                    {
                        id_not:"${bannerId}"
                    }
                    {
                        type: ${bannerType}
                    },
                    {
                        or:[
                            {
                                and: [
                                    {inceptionDate_gte:"${inceptionDate}"},
                                    {inceptionDate_lte:"${expiryDate}"}
                                ]
                            },
                            {
                                and: [
                                    {inceptionDate_lte:"${inceptionDate}"},
                                    {expiryDate_gte: "${expiryDate}"}
                                ]
                            },
                            {
                                and: [
                                    {expiryDate_gte:"${inceptionDate}"},
                                    {expiryDate_lte:"${expiryDate}"}
                                ]
                            },
                            {
                                and: [
                                    {inceptionDate_gte:"${inceptionDate}"},
                                    {expiryDate_lte:"${expiryDate}"}
                                ]
                            }
                        ]
                    }
                ]
            }){
                id
            }
        }
    `;
  const overLappingBanners = await callLocalGraphqlApi(query);
  return get(overLappingBanners, 'data.banners');
};
const checkIfBannerPublishedForTheDuration = async (input) => {
  /** If Status Published check if another banner already published within specific date range  */
  const overlappingBanners = await fetchOverlappingBanners(
    get(input, 'inceptionDate', null),
    get(input, 'expiryDate', null),
    get(input, 'type', 'marketing'),
    get(input, 'bannerId', null),
  );
  if (overlappingBanners && overlappingBanners.length > 0) {
    throw new BannerExistsError();
  }
  return true;
};

export default checkIfBannerPublishedForTheDuration;
