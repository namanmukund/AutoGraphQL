import {
  isValidPhoneNumber,
} from './index';

import {
  InvalidPhoneError,
  PhoneNumberAndCountryCodeRequiredError,
  EitherEmailOrPhoneNotBothRequiredError,
  EitherEmailOrPhoneRequiredError,
  InvalidEmailError,
} from '../../../../constants/errors';
import isValidEmail from './isValidEmail';


const validateForgotPassword = (params) => {
  let isPhone = false;
  let newParams;
  const { input: phone, email, ...rest } = params;

  if (phone && email) {
    throw new EitherEmailOrPhoneNotBothRequiredError();
  } else if (phone && !email) {
    const { countryCode, number } = phone;
    if (!countryCode || !number) {
      throw new PhoneNumberAndCountryCodeRequiredError();
    }
    const phoneFlag = isValidPhoneNumber(phone);
    if (!phoneFlag) {
      throw new InvalidPhoneError();
    }
    isPhone = true;
    newParams = Object.assign({}, { phone }, { isPhone }, rest);
  } else if (!phone && email) {
    const emailFlag = isValidEmail(email);
    if (!emailFlag) {
      throw new InvalidEmailError();
    }
    newParams = Object.assign({}, { email }, { isPhone }, rest);
  } else {
    throw new EitherEmailOrPhoneRequiredError();
  }
  return newParams;
};


export default validateForgotPassword;
