import bcrypt from 'bcryptjs';
import get from 'lodash/get';
import { MASTER_PASSWORD } from '../../../../../../constants';
import {
  PasswordMismatchError,
  PhoneNotVerifiedError,
  UnknownUserError,
  UserPasswordNotSetError,
} from '../../../../../../constants/errors';
import { MENTOR } from '../../../../../../constants/roles';
import { createUserTokenTypeData } from './createUserTokenTypeData';

const checkPasswordAndReturnUserWithToken = (fetchedUser, input, authentication) => {
  if (!fetchedUser) {
    throw new UnknownUserError();
  } else if (!fetchedUser.password) {
    throw new UserPasswordNotSetError();
  }

  const { password, phone } = input;
  // If logging in using email, check whether email is verified or not
  /*
  Commenting below code as we are allowing unverfied user to login for few days
   */

  /*
  if (email && !fetchedUser.emailVerified) {
    throw new EmailNotVerifiedError();
  }
   */

  // If logging in using phone, check whether phone is verified or not
  if (phone && !fetchedUser.phoneVerified) {
    throw new PhoneNotVerifiedError();
  }

  const valid = bcrypt.compareSync(password, fetchedUser.password);
  if (!(get(fetchedUser, 'role') === MENTOR && password === MASTER_PASSWORD)) {
    if (!valid) {
      throw new PasswordMismatchError();
    }
  }

  return createUserTokenTypeData(fetchedUser, authentication);
};
export { checkPasswordAndReturnUserWithToken };
