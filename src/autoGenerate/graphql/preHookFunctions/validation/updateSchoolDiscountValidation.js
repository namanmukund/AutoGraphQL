import { get } from 'lodash';
import { OtherDiscountAlreadySetToDefault } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchDiscount = async (discountId) => {
  const query = `
          {
          products(filter: { discounts_some: { id: "${discountId}" } }) {
            id
            discounts(filter: { id_not: "${discountId}" }) {
              id
              isDefault
            }
          }
        }
          `;
  const products = await callLocalGraphqlApi(query);
  return get(products, 'data.products');
};

const updateSchoolDiscountValidation = async (params) => {
  const { id: discountId, input } = params;
  if (input.isDefault) {
    const data = await fetchDiscount(discountId);
    if (data && data.length > 0) {
      const discounts = get(data[0], 'discounts', []);
      if (discounts && discounts.length > 0) {
        discounts.forEach(({ isDefault }) => {
          if (isDefault) {
            throw new OtherDiscountAlreadySetToDefault();
          }
        });
      }
    }
  }
  return true;
};

export default updateSchoolDiscountValidation;
