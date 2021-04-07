import { get } from 'lodash';
import { ProductTypeAlreadyAdded } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchProduct = async (schoolId) => {
  const query = `
          {
            products(filter: { school_some: { id: "${schoolId}" } }) {
              id
              type
            }
          }
          `;
  const products = await callLocalGraphqlApi(query);
  return get(products, 'data.products');
};

const addProductToSchoolValidation = async (params) => {
  const { schoolConnectId: schoolId, input } = params;
  const products = await fetchProduct(schoolId);
  let types = [];
  if (products && products.length > 0) {
    types = products.map(({ type }) => type);
  }
  if (types.includes(input.type)) {
    throw new ProductTypeAlreadyAdded();
  }
  return true;
};

export default addProductToSchoolValidation;
