import jwt from 'jsonwebtoken';
import authParams from '../../config/authParams';

export default function verifyToken(token, isForgetPasswordApiCall = false) {
  let decoded;
  let secret = authParams.SECRET;
  if (isForgetPasswordApiCall) secret = authParams.FORGOT_PASSWORD_SECRET;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    return false;
  }
  return decoded;
}
