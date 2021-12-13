import { get } from 'lodash';
import { SenseiProfileAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSenseiProfile = async (userId) => {
  const query = `
    {
        senseiProfiles(filter: { user_some: { id: "${userId}" } }) {
            id
        }
    }
    `;
  const senseiProfiles = await callLocalGraphqlApi(query);
  return get(senseiProfiles, 'data.senseiProfiles', []);
};

const addSenseiProfileValidation = async (params) => {
  // check if the document for user is already present
  const userId = get(params, 'userConnectId');

  if (!userId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'User Id is missing in input',
      },
    });
  }
  const senseiProfiles = await fetchSenseiProfile(userId);
  if (senseiProfiles && senseiProfiles.length > 0) {
    throw new SenseiProfileAlreadyExist();
  }
  return true;
};

export default addSenseiProfileValidation;
