import jwt from 'jsonwebtoken';
import authParams from '../../config/authParams';

export default function verifyToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, authParams.SECRET);
  } catch (err) {
    return false;
  }
  return decoded;
}
