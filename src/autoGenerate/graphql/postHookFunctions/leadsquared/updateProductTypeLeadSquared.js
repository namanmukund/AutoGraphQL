import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const productTypes = {
  oneToOne: '1:1',
  oneToTwo: '1:2',
  oneToThree: '1:3',
  oneToFour: '1:4',
  oneToFive: '1:5',
  oneToSix: '1:6',
  oneToSeven: '1:7',
  oneToEight: '1:8',
  oneToNine: '1:9',
  oneToTen: '1:10',
  oneToEleven: '1:11',
  oneToTwelve: '1:12',
};

const updateProductTypeLeadSquared = async (phoneNumber, productType) => {
  if (productTypes[productType]) {
    const leadSquaredInput = {
      Phone: phoneNumber,
      mx_Lead_Conversion_Model: productTypes[productType],
    };
    updateLeadsquared(leadSquaredInput, false);
  }
};

export default updateProductTypeLeadSquared;
