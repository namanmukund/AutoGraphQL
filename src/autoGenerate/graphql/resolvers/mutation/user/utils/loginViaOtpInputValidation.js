import { isValidPhoneNumber, isValidEmail } from '../../../../validation';
import { InvalidPhoneError, InvalidEmailError } from '../../../../../../../constants/errors';

const loginViaOtpInputValidation = (input) => {
  const { phone, email } = input;
  if (phone) {
    if (isValidPhoneNumber(phone)) {
      return true;
    }
    throw new InvalidPhoneError();
  }
  if (email) {
    if (isValidEmail(email)) {
      return true;
    }
    throw new InvalidEmailError();
  }
  return true;
};

export default loginViaOtpInputValidation;
