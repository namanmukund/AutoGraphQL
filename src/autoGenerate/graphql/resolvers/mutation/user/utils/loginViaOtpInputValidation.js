import { isValidPhoneNumber } from '../../../../validation';
import { InvalidPhoneError } from '../../../../../../../constants/errors';

const loginViaOtpInputValidation = (input) => {
  const { phone, email } = input;
  if (!isValidPhoneNumber(phone)) {
    throw new InvalidPhoneError();
  }
  // temporary error for future reference to extend the functionality further
  if (email) {
    throw new Error('Service is currently unavailable');
  }
  return true;
};

export default loginViaOtpInputValidation;
