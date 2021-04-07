import { get } from 'lodash';
import { OtherDiscountAlreadySetToDefault } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchDiscount = async (discountId) => {
  const query = `
          {
          discount(id: "${discountId}") {
            product {
              id
              school {
                id
                products(filter: { and: [{ discounts_some: { id: "${discountId}" } }] }) {
                  id
                  discounts {
                    id
                    isDefault
                  }
                }
              }
            }
          }
        }
          `;
  const discount = await callLocalGraphqlApi(query);
  return get(discount, 'data.discount');
};

const updateSchoolDiscountValidation = async (params) => {
  const { id: discountId, input } = params;
  if (input.isDefault) {
    const { product } = await fetchDiscount(discountId);
    if (product) {
      const { school: { products } } = product;
      if (products && products.length > 0) {
        const discounts = get(products[0], 'discounts', []);
        if (discounts && discounts.length > 0) {
          discounts.forEach(({ isDefault }) => {
            if (isDefault) {
              throw new OtherDiscountAlreadySetToDefault();
            }
          });
        }
      }
    }
  }
  return true;
};

export default updateSchoolDiscountValidation;
