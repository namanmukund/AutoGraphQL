import { get } from 'lodash';
import { SalesExecutiveProfileAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSalesExecutiveProfile = async (userId) => {
  const query = `
    {
      salesExecutiveProfiles(filter: { user_some: { id: "${userId}" } }) {
        id
      }
    }
    `;
  const salesExecutiveProfiles = await callLocalGraphqlApi(query);
  return get(salesExecutiveProfiles, 'data.salesExecutiveProfiles', []);
};

const addSalesExecutiveProfileValidation = async (params) => {
  // check if the document for user is already present
  const userId = get(params, 'userConnectId');

  if (!userId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'User Id is missing in input',
      },
    });
  }
  const salesExecutiveProfiles = await fetchSalesExecutiveProfile(userId);
  if (salesExecutiveProfiles && salesExecutiveProfiles.length > 0) {
    throw new SalesExecutiveProfileAlreadyExist();
  }
  return true;
};

export default addSalesExecutiveProfileValidation;
