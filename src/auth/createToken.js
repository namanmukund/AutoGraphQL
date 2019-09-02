import jwt from 'jsonwebtoken';
import { pick } from 'lodash';
import allAuthParams from '../../config/authParams/index';
import getExpiryDateForUserToken from './getExpiryDateForUserToken';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];

export default function createToken(user, authentication, toPhone, isForgotPassToken = false) {
  const expiresIn = getExpiryDateForUserToken(authParams, authentication, isForgotPassToken);
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
  if (isForgotPassToken) secret = authParams.FORGOT_PASS_SECRET;

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
