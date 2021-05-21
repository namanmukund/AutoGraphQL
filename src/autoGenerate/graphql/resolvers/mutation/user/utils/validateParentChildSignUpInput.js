import isValidEmail from '../../../../validation/isValidEmail';
import { InvalidEmailError, InvalidPhoneError } from '../../../../../../../constants/errors';
import { isValidPhoneNumber, validateName } from '../../../../validation';

const validateParentChildSignUpInput = (input) => {
  const {
    parentName, childName, parentEmail, parentPhone,
  } = input;
    // check email
  if (!isValidEmail(parentEmail)) {
    throw new InvalidEmailError();
  }
  // check phone number
  if (!isValidPhoneNumber(parentPhone)) {
    throw new InvalidPhoneError();
  }
  // check childName
  validateName(childName);
  // check parentName
  validateName(parentName);

  return true;
};

export default validateParentChildSignUpInput;
