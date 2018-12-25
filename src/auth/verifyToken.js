import jwt from 'jsonwebtoken';
import allAuthParams from '../../config/authParams/index';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];
export default function verifyToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, authParams.SECRET);
  } catch (err) {
    return false;
  }
  return decoded;
}
