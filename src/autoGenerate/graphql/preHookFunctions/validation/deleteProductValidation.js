import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { ProductIsPublishedError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteProductValidation = async (params) => {
  const { id: productId } = params;
  const query = `
        {
        product(id: "${productId}") {
            status
        }
        }
    `;
  const product = await callLocalGraphqlApi(query);
  if (get(product, 'data.product.status', UNPUBLISHED) === PUBLISHED) {
    throw new ProductIsPublishedError();
  }
  return true;
};

export default deleteProductValidation;
