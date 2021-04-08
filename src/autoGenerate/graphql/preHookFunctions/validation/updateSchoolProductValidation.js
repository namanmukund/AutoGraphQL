import { get } from 'lodash';
import { batchType } from '../../../../../constants';
import { ProductTypeAlreadyAdded } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

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
            }
          }
          `;
  const product = await callLocalGraphqlApi(query);
  return get(product, 'data.products');
};

const fetchSchoolProducts = async (schoolId, targetUserType, type, isDemoPack) => {
  const query = `
    {
        products(
            filter: {
            and: [
                { school_some: { id: "${schoolId}" } }
                { targetUserType: ${targetUserType} }
                { type: ${type} }
                { isDemoPack: ${isDemoPack} }
            ]
            }
        ) {
            id
            type
        }
        }
  `;
  const schoolProducts = await callLocalGraphqlApi(query);
  return get(schoolProducts, 'data.products');
};

const updateSchoolProductValidation = async (params) => {
  const { id: productId, input: { type } } = params;
  if (productId) {
    const products = await fetchProducts(productId);
    if (products && products.length > 0) {
      if (get(products[0], 'type') !== type) {
        const info = products[0];
        const { school: { id }, targetUserType, isDemoPack } = info;
        if (id && targetUserType && targetUserType === batchType.b2b2c && type) {
          const schoolProducts = await fetchSchoolProducts(id, targetUserType, type, isDemoPack);
          if (schoolProducts && schoolProducts.length > 0) {
            throw new ProductTypeAlreadyAdded();
          }
        }
      }
      return true;
    }
  }
  return true;
};

export default updateSchoolProductValidation;
