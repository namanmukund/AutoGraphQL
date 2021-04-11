import { get } from 'lodash';
import { batchType, PUBLISHED } from '../../../../../constants';
import { ProductTypeAlreadyAdded } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import fetchSimilarProducts from './utils/CheckStatusForSimilarProductType';

const fetchProducts = async (productId) => {
  const query = `
          {
            products(
                filter: { and: [{ id: "${productId}" }] }
            ) {
                school {
                  id
                }
                id
                type
                targetUserType
                isDemoPack
                status
                country
            }
          }
          `;
  const product = await callLocalGraphqlApi(query);
  return get(product, 'data.products');
};

const updateProductValidation = async (params) => {
  const { id: productId, input: { status } } = params;
  if (status && status === PUBLISHED) {
    const products = await fetchProducts(productId);
    if (products && products.length > 0) {
      const info = products[0];
      const {
        targetUserType, isDemoPack, country, type,
      } = info;
      const id = get(info, 'school.id', '');
      if (id && targetUserType && (targetUserType === batchType.b2b2c || targetUserType === batchType.b2b) && type) {
        const schoolProducts = await fetchSimilarProducts(id, targetUserType, type, isDemoPack, country);
        if (schoolProducts && schoolProducts.length > 0) {
          throw new ProductTypeAlreadyAdded();
        }
      } else if (targetUserType === batchType.b2c) {
        const b2cProduct = await fetchSimilarProducts(null, targetUserType, type, isDemoPack, country);
        if (b2cProduct && b2cProduct.length > 0) {
          throw new ProductTypeAlreadyAdded();
        }
      }
      return true;
    }
  }
  return true;
};

export default updateProductValidation;
