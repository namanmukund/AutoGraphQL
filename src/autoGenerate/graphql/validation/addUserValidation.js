import {
  generateUsername,
  validateUsername,
} from './index';
import { commonUserValidation } from '../preHookFunctions/validation/utils';
import { EitherEmailOrPhoneRequiredError } from '../../../../constants/errors';

const addUserValidation = async (input, context) => {
  const {
    name, username, email, phone,
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
  return doc;
};

export default addUserValidation;
