import { get } from 'lodash';
import isValidEmail from '../../../../validation/isValidEmail';
import { InvalidEmailError, InvalidPhoneError } from '../../../../../../../constants/errors';
import { isValidPhoneNumber, validateName } from '../../../../validation';
import { EitherPhoneOrEmailIsMandatory } from '../../../../../../../constants/errors/input';

const validateParentChildSignUpInput = (input) => {
  const {
    parentName, childName, parentEmail, parentPhone, childEmail,
  } = input;
  if (!parentEmail && (!get(parentPhone, 'countryCode') || !get(parentPhone, 'number'))) {
    throw new EitherPhoneOrEmailIsMandatory();
  }
  // check email
  if (parentEmail && !isValidEmail(parentEmail)) {
    throw new InvalidEmailError();
  }

  if (childEmail && !isValidEmail(childEmail)) {
    throw new InvalidEmailError();
  }

  // if (!isBackendApp && (!get(parentPhone, 'countryCode') || !get(parentPhone, 'number'))) {
  //   throw new PhoneFieldRequiredError();
  // }
  // check phone number
  if (get(parentPhone, 'countryCode') && get(parentPhone, 'number') && !isValidPhoneNumber(parentPhone)) {
    throw new InvalidPhoneError();
  }
  // check childName
  validateName(childName);
  // check parentName
  validateName(parentName);

  return true;
};

export default validateParentChildSignUpInput;
