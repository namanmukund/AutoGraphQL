import isLength from 'validator/lib/isLength';
import { InvalidUsernameError, InvalidUsernameLengthError } from '../../../../constants/errors';
import { usernameRules } from '../../../../constants';

const validateUsername = (username) => {
  /*
    Username should start with a letter and can contain . or _ and alphanumeric characters
   */
  const exp = /^[A-Za-z][A-Za-z0-9._]*$/;
  if (!username.match(exp)) {
    throw new InvalidUsernameError();
  }

  if (!isLength(username, usernameRules)) {
    throw new InvalidUsernameLengthError();
  }
};

export default validateUsername;
