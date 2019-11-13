import { InvalidEmailError, InvalidPhoneError } from '../../../../../../constants/errors';
import { isValidEmail, isValidPhoneNumber, validateName } from '../../../validation';

const commonUserValidation = ({ email, phone, name }) => {
  if (email) {
    const emailFlag = isValidEmail(email);
    if (!emailFlag) {
      throw new InvalidEmailError();
    }
  }

  if (phone) {
    const phoneFlag = isValidPhoneNumber(phone);
    if (!phoneFlag) {
      throw new InvalidPhoneError();
    }
  }

  // validating name before username as this can be used for generating username further
  if (name) {
    validateName(name);
  }

  return true;
};

export default commonUserValidation;
