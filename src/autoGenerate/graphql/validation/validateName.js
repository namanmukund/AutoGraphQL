import isLength from 'validator/lib/isLength';
import { InvalidNameError, InvalidNameLengthError } from '../../../../constants/errors';
import { nameRules } from '../../../../constants';

const validateName = (name) => {
  // Name should start with a letter and can contain aplhanumeric characters and spaces
  const exp = /^[A-Za-z][A-Za-z0-9 .']*$/;
  if (!name.match(exp)) {
    throw new InvalidNameError();
  }

  if (!isLength(name, nameRules)) {
    throw new InvalidNameLengthError();
  }
  return true;
};

export default validateName;
