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
                country
            }
          }
          `;
  const product = await callLocalGraphqlApi(query);
  return get(product, 'data.products');
};

const fetchSchoolProducts = async (schoolId, targetUserType, type, isDemoPack, country = 'india') => {
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
  const schoolProducts = await callLocalGraphqlApi(query);
  return get(schoolProducts, 'data.products');
};

const updateProductValidation = async (params) => {
  const { id: productId, input: { type } } = params;
  if (type) {
    const products = await fetchProducts(productId);
    if (products && products.length > 0) {
      if (get(products[0], 'type') !== type) {
        const info = products[0];
        const { targetUserType, isDemoPack, country } = info;
        const id = get(info, 'school.id', '');
        if (id && targetUserType && (targetUserType === batchType.b2b2c || targetUserType === batchType.b2b) && type) {
          const schoolProducts = await fetchSchoolProducts(id, targetUserType, type, isDemoPack, country);
          if (schoolProducts && schoolProducts.length > 0) {
            throw new ProductTypeAlreadyAdded();
          }
        } else if (targetUserType === batchType.b2c) {
          const b2cProduct = await fetchSchoolProducts(null, targetUserType, type, isDemoPack, country);
          if (b2cProduct && b2cProduct.length > 0) {
            throw new ProductTypeAlreadyAdded();
          }
        }
      }
      return true;
    }
  }
  return true;
};

export default updateProductValidation;
