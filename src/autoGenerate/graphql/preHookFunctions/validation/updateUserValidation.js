import { validateUsername } from '../../validation';
import { commonUserValidation, validateTokenAndExtractInformation } from './utils';
import getUserPasswordObject from '../../resolvers/mutation/user/utils/getUserPasswordObject';

const updateUserValidation = async (params, context) => {
  const { input } = params;
  const userObj = {};
  const {
    name,
    username,
    email,
    phone,
    verificationStatus,
    password,
  } = input;
  commonUserValidation({ name, email, phone });
  if (username) {
    validateUsername(username);
  }
  // getting user role from context. We will allow adding mentorSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;

  context.currentUser = currentUser;
  context.verificationStatusFromInput = verificationStatus;

  if (password) {
    const passwordObj = getUserPasswordObject(password, false);
    Object.assign(userObj, passwordObj);
  }

  return userObj;
};

export default updateUserValidation;
