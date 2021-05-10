import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { BannerIsPublishedError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteBannerValidation = async (params) => {
  const { id: bannerId } = params;
  const query = `
        {
            banner(id:"${bannerId}") {
                status
            }
        }
    `;
  const banner = await callLocalGraphqlApi(query);
  if (get(banner, 'data.banner.status', UNPUBLISHED) === PUBLISHED) {
    throw new BannerIsPublishedError();
  }
  return true;
};

export default deleteBannerValidation;
