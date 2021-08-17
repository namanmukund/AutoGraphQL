import { currencyTypes } from '../../../../../constants';

const { RS, USD } = currencyTypes;
const Currency = `
  enum Currency {
    ${RS}
    ${USD}
  }`;

export default Currency;
