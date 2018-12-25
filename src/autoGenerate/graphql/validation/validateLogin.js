import { isValidEmail, isValidPhoneNumber } from './index';
import { EitherUsernameEmailOrPhoneRequiredError, InvalidEmailError,
  InvalidPhoneError } from '../../../../constants/errors';
import validateUsername from './validateUsername';

const validateLogin = (input) => {
  const { username, email, phone } = input;
  if (!username && !email && !phone) {
    throw new EitherUsernameEmailOrPhoneRequiredError();
  }
  if (username) {
    validateUsername(username);
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
export default validateLogin;
