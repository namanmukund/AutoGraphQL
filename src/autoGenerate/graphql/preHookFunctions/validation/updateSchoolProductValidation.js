import { get } from 'lodash';
import { ProductTypeAlreadyAdded } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchProducts = async (productId) => {
  const query = `
          {
            product(id: "${productId}") {
                id
                type
                school {
                id
                name
                products(filter: { id_not: "${productId}" }) {
                    id
                    type
                }
                }
            }
          }
          `;
  const product = await callLocalGraphqlApi(query);
  return get(product, 'data.product');
};

const updateSchoolProductValidation = async (params) => {
  const { id: productId, input } = params;
  const product = await fetchProducts(productId);
  if (get(product, 'type') !== get(input, 'type')) {
    let types = [];
    const products = get(product, 'school.products', []);
    if (products && products.length > 0) {
      types = products.map(({ type }) => type);
      if (types.includes(get(input, 'type'))) {
        throw new ProductTypeAlreadyAdded();
      }
    }
    return true;
  }
  return true;
};

export default updateSchoolProductValidation;
