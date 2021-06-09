import { get } from 'lodash';
import isValidEmail from '../../../../validation/isValidEmail';
import { InvalidEmailError, InvalidPhoneError } from '../../../../../../../constants/errors';
import { isValidPhoneNumber, validateName } from '../../../../validation';
import { PhoneFieldRequiredError } from '../../../../../../../constants/errors/input';

const validateParentChildSignUpInput = (input, isBackendApp) => {
  const {
    parentName, childName, parentEmail, parentPhone, childEmail,
  } = input;
    // check email
  if (!isValidEmail(parentEmail)) {
    throw new InvalidEmailError();
  }

  if (childEmail && !isValidEmail(childEmail)) {
    throw new InvalidEmailError();
  }

  if (!isBackendApp && (!get(parentPhone, 'countryCode') || !get(parentPhone, 'number'))) {
    throw new PhoneFieldRequiredError();
  }
  // check phone number
  if (get(parentPhone, 'countryCode') && !get(parentPhone, 'number') && !isValidPhoneNumber(parentPhone)) {
    throw new InvalidPhoneError();
  }
  // check childName
  validateName(childName);
  // check parentName
  validateName(parentName);

  return true;
};

export default validateParentChildSignUpInput;
