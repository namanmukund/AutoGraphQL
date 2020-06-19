import bcrypt from 'bcryptjs';
import { validateUsername } from '../../validation';
import { commonUserValidation } from './utils';
import authParams from '../../../../../config/authParams';

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
  /*
@TODO change this code implementation: NM
 */
  if (password) {
    const hashedPwd = bcrypt.hashSync(password, authParams.SALT);
    userObj.password = hashedPwd;
    userObj.savedPassword = password;
    userObj.isSetPassword = true;
  }
  return userObj;
};

export default updateUserValidation;
