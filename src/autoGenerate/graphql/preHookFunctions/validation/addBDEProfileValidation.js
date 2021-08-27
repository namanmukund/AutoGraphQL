import { get } from 'lodash';
import { BDEProfileAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchBDEProfile = async (userId) => {
  const query = `
    {
      bdeProfiles(filter: { user_some: { id: "${userId}" } }) {
        id
      }
    }
    `;
  const bdeProfiles = await callLocalGraphqlApi(query);
  return get(bdeProfiles, 'data.bdeProfiles', []);
};

const addBDEProfileValidation = async (params) => {
  // check if the document for user is already present
  const userId = get(params, 'userConnectId');

  if (!userId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'User Id is missing in input',
      },
    });
  }
  const bdeProfiles = await fetchBDEProfile(userId);
  if (bdeProfiles && bdeProfiles.length > 0) {
    throw new BDEProfileAlreadyExist();
  }
  return true;
};

export default addBDEProfileValidation;
