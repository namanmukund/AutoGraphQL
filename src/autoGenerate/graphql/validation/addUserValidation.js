import bcrypt from 'bcryptjs';
import {
  generateUsername,
  validateUsername,
} from './index';
import { commonUserValidation } from '../preHookFunctions/validation/utils';
import { EitherEmailOrPhoneRequiredError } from '../../../../constants/errors';
import allAuthParams from '../../../../config/authParams';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];
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
    const hashedPwd = bcrypt.hashSync(password, authParams.SALT);
    doc.password = hashedPwd;
    doc.savedPassword = password;
    doc.isSetPassword = true;
  }

  return doc;
};

export default addUserValidation;
