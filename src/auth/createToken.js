import jwt from 'jsonwebtoken';
import { pick } from 'lodash';
import allAuthParams from '../../config/authParams/index';
import getExpiryDateForUserToken from './getExpiryDateForUserToken';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];

export default function createToken(user, authentication, toPhone) {
  const expiresIn = getExpiryDateForUserToken(authParams, authentication);
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
  const token = jwt.sign(
    {
      userInfo,
    },
    authParams.SECRET,
    {
      expiresIn,
      algorithm: authParams.ALGORITHM,
    },

  );
  return token;
}
