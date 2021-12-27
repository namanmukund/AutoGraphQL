import { get } from 'lodash';
import { InvalidEmailError, InvalidPhoneError } from '../../../../../../constants/errors';
import { isValidEmail, isValidPhoneNumber, validateName } from '../../../validation';

const commonUserValidation = ({
  email, phone, name, mutationOrQueryName = '',
}) => {
  if (email) {
    const emailFlag = isValidEmail(email);
    if (!emailFlag) {
      throw new InvalidEmailError();
    }
  }
  if (!get(phone, 'number') && mutationOrQueryName === 'updateUser') {
    // eslint-disable-next-line no-param-reassign
    phone = null;
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
