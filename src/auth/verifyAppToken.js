import jwt from 'jsonwebtoken';
import allAuthParams from '../../config/authParams/index';

export default function verifyToken(token, application) {
  let decoded;
  const authParams = allAuthParams[application];
  try {
    decoded = jwt.verify(token, authParams.SECRET);
  } catch (err) {
    return false;
  }
  return decoded;
}
