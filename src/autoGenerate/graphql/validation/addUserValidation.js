import bcrypt from 'bcryptjs';
import {
  generateUsername,
  validateUsername,
} from './index';
import { commonUserValidation } from '../preHookFunctions/validation/utils';
import { EitherEmailOrPhoneRequiredError } from '../../../../constants/errors';
import authParams from '../../../../config/authParams';
import getUserPasswordObject from '../resolvers/mutation/user/utils/getUserPasswordObject';

const addUserValidation = async (input, context) => {
  const {
    name, username, email, phone, password,
  } = input;
  if (!email && !phone) {
    throw new EitherEmailOrPhoneRequiredError();
  }

  commonUserValidation({ name, email, phone });

  const doc = {};
  if (!username) {
    let newUsername;
    try {
      newUsername = await generateUsername(input, context);
    } catch (err) {
      return err;
    }
    Object.assign(doc, {
      username: newUsername,
    });
  } else {
    validateUsername(username);
  }

  if (password) {
    const passwordObj = getUserPasswordObject(password, true);
    Object.assign(doc, passwordObj);
  }

  return doc;
};

export default addUserValidation;
