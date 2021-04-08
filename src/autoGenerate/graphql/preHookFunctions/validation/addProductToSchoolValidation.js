import { get } from 'lodash';
import { batchType } from '../../../../../constants';
import { ProductTypeAlreadyAdded } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchProduct = async (schoolId, targetUserType, type, isDemoPack) => {
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
  const products = await callLocalGraphqlApi(query);
  return get(products, 'data.products');
};

const addProductToSchoolValidation = async (params) => {
  const { schoolConnectId: schoolId, input: { targetUserType, type, isDemoPack = false } } = params;
  if (schoolId && targetUserType && targetUserType === batchType.b2b2c && type) {
    const products = await fetchProduct(schoolId, targetUserType, type, isDemoPack);
    if (products && products.length > 0) {
      throw new ProductTypeAlreadyAdded();
    }
  }
  return true;
};

export default addProductToSchoolValidation;
