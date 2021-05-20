import isValidEmail from '../../../../validation/isValidEmail';
import { InvalidEmailError, InvalidPhoneError } from '../../../../../../../constants/errors';
import { isValidPhoneNumber, validateName } from '../../../../validation';

const validateUpdateParentChildDetailInput = (input) => {
  const {
    parentName, childName, parentEmail, parentPhone,
  } = input;
    // check email
  if (parentEmail && !isValidEmail(parentEmail)) {
    throw new InvalidEmailError();
  }
  // check phone number
  if (
    parentPhone && parentPhone.number
        && parentPhone.countryCode && !isValidPhoneNumber(parentPhone)) {
    throw new InvalidPhoneError();
  }
  // check childName
  if (childName) {
    validateName(childName);
  }
  // check parentName
  if (parentName) {
    validateName(parentName);
  }
  return true;
};

export default validateUpdateParentChildDetailInput;
