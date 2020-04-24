import jwt from 'jsonwebtoken';
import { pick } from 'lodash';
import authParams from '../../config/authParams';
import getExpiryDateForUserToken from './getExpiryDateForUserToken';

export default function createToken(user, authentication, toPhone, isForgotPasswordToken = false) {
  const expiresIn = getExpiryDateForUserToken(authParams, authentication, isForgotPasswordToken);
  let userInfo = pick(user, ['id', 'username']);
  // Assign information whether token is created by phone login or email login
  if (toPhone === true) {
    userInfo = {
      ...userInfo,
      byPhone: true,
    };
  } else if (toPhone === false) {
    userInfo = {
      ...userInfo,
      byEmail: true,
    };
  }
  let secret = authParams.SECRET;
  if (isForgotPasswordToken) secret = authParams.FORGOT_PASSWORD_SECRET;

  const token = jwt.sign(
    {
      userInfo,
    },
    secret,
    {
      expiresIn,
      algorithm: authParams.ALGORITHM,
    },

  );
  return token;
}
