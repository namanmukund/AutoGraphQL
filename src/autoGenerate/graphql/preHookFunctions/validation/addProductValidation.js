import { get } from 'lodash';
import { batchType } from '../../../../../constants';
import { ProductTypeAlreadyAdded } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchProduct = async (schoolId, targetUserType, type, isDemoPack, country = 'india') => {
  const query = `
          {
            products(
              filter: {
                and: [
                  ${schoolId ? `{ school_some: { id: "${schoolId}" } }` : ''}
                  { targetUserType: ${targetUserType} }
                  { type: ${type} }
                  { isDemoPack: ${isDemoPack} }
                  { country: ${country} }
                ]
              }
            ) {
              id
              type
            }
          }
          `;
  const products = await callLocalGraphqlApi(query);
  return get(products, 'data.products');
};

const addProductValidation = async (params) => {
  const {
    schoolConnectId: schoolId, input: {
      targetUserType, type, country, isDemoPack = false,
    },
  } = params;
  if (schoolId && targetUserType && (targetUserType === batchType.b2b2c || targetUserType === batchType.b2b) && type) {
    const products = await fetchProduct(schoolId, targetUserType, type, isDemoPack, country);
    if (products && products.length > 0) {
      throw new ProductTypeAlreadyAdded();
    }
  } else if (targetUserType === batchType.b2c) {
    const b2cProduct = await fetchProduct(null, targetUserType, type, isDemoPack, country);
    if (b2cProduct && b2cProduct.length > 0) {
      throw new ProductTypeAlreadyAdded();
    }
  }
  return true;
};

export default addProductValidation;
