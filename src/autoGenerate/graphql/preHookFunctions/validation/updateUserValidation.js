import bcrypt from 'bcryptjs';
import { validateUsername } from '../../validation';
import { commonUserValidation } from './utils';
import authParams from '../../../../../config/authParams';
import { QueryController } from '../../controllers';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { CanNotChangeVerifiedUserStatusError } from '../../../../../constants/errors/input';

const updateUserValidation = async (params, context) => {
  const { input, id } = params;
  const userObj = {};
  const {
    name,
    username,
    email,
    phone,
    password,
    salesTeamStatus,
    salesTeamUserStateUpdate,
  } = input;
  commonUserValidation({ name, email, phone });
  if (username) {
    validateUsername(username);
  }
  /*
@TODO change this code implementation: NM
 */
  if (password) {
    const hashedPwd = bcrypt.hashSync(password, authParams.SALT);
    userObj.password = hashedPwd;
    userObj.savedPassword = password;
    userObj.isSetPassword = true;
  }

  const typeName = 'User';
  const newAuthentication = {
    bypass: true,
  };
  const modelQueries = new QueryController(typeName, newAuthentication);
  const userData = await modelQueries.fetchOne({ id });
  if (!userData || (userData && !userData.id)) {
    throw new DatabaseRecordNotFoundError();
  }
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = userData;

  // can not change the status of a verified user
  const { salesTeamStatus: prevSalesTeamStatus } = userData;
  if (prevSalesTeamStatus === 'verified' && (salesTeamStatus && salesTeamStatus !== 'verified')) {
    throw new CanNotChangeVerifiedUserStatusError();
  }

  if (salesTeamStatus) {
    userObj.salesTeamStatusUpdateDate = new Date();
  }

  if (salesTeamUserStateUpdate) {
    userObj.salesTeamUserStateUpdateDate = new Date();
  }
  return userObj;
};

export default updateUserValidation;
