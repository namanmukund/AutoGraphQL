import { get } from 'lodash';
import { BDProfileAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchBDProfile = async (userId) => {
  const query = `
    {
      bdProfiles(filter: { user_some: { id: "${userId}" } }) {
        id
      }
    }
    `;
  const bdProfiles = await callLocalGraphqlApi(query);
  return get(bdProfiles, 'data.bdProfiles', []);
};

const addBDProfileValidation = async (params) => {
  // check if the document for user is already present
  const userId = get(params, 'userConnectId');

  if (!userId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'User Id is missing in input',
      },
    });
  }
  const bdProfiles = await fetchBDProfile(userId);
  if (bdProfiles && bdProfiles.length > 0) {
    throw new BDProfileAlreadyExist();
  }
  return true;
};

export default addBDProfileValidation;
