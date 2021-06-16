import { validateUsername } from '../../validation';
import { commonUserValidation } from './utils';
import getUserPasswordObject from '../../resolvers/mutation/user/utils/getUserPasswordObject';

const updateUserValidation = async (params) => {
  const { input } = params;
  const userObj = {};
  const {
    name,
    username,
    email,
    phone,
    password,
  } = input;
  commonUserValidation({ name, email, phone });
  if (username) {
    validateUsername(username);
  }

  if (password) {
    const passwordObj = getUserPasswordObject(password, false);
    Object.assign(userObj, passwordObj);
  }

  return userObj;
};

export default updateUserValidation;
