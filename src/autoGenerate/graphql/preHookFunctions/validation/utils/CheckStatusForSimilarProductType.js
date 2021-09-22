import { get } from 'lodash';
import { PUBLISHED } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchSimilarProducts = async (schoolId, targetUserType, type, isDemoPack, country = 'india', productId, courseId) => {
  const query = `
          {
            products(
              filter: {
                and: [
                  ${schoolId ? `{ school_some: { id: "${schoolId}" } }` : ''}
                  { targetUserType: ${targetUserType} }
                  { isDemoPack: ${isDemoPack} }
                  { country: ${country} }
                  { type: ${type} }
                  { status: ${PUBLISHED}}
                  ${productId ? `{ id_not:"${productId}" }` : ''}
                  ${courseId ? `{ course_some: { id: "${courseId}" } }` : ''}
                ]
              }
            ) {
              id
              type
              status
            }
          }
          `;
  const products = await callLocalGraphqlApi(query);
  return get(products, 'data.products');
};

export default fetchSimilarProducts;
