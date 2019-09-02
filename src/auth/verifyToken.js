import jwt from 'jsonwebtoken';
import allAuthParams from '../../config/authParams/index';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];
export default function verifyToken(token, isCalledfromForgotPassword = false) {
  let decoded;
  let secret = authParams.SECRET;
  if (isCalledfromForgotPassword) secret = authParams.FORGOT_PASS_SECRET;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    return false;
  }
  return decoded;
}
