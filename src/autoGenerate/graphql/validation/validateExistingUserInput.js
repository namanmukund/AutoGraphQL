import {
  isValidEmail,
  isValidPhoneNumber,
} from './index';

import {
  EitherEmailOrPhoneRequiredError,
  InvalidEmailError,
  InvalidPhoneError,
  EitherEmailOrPhoneNotBothRequiredError,
} from '../../../../constants/errors';


const validateExistingUserInput = (input) => {
  const { email, phone } = input;
  // either email or phone is mandatory for registration
  if (!email && !phone) {
    throw new EitherEmailOrPhoneRequiredError();
  }
  if (email && phone) {
    throw new EitherEmailOrPhoneNotBothRequiredError();
  }

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

  return {};
};


export default validateExistingUserInput;
