import bcrypt from 'bcryptjs';
import authParams from '../../../../../../../config/authParams';

const getUserPasswordObject = (password, savePasswordForReference = false) => {
  const doc = {};
  if (password) {
    const hashedPwd = bcrypt.hashSync(password, authParams.SALT);
    doc.password = hashedPwd;
    doc.isSetPassword = true;
  }
  if (savePasswordForReference) {
    doc.savedPassword = password;
  }
  return doc;
};

export default getUserPasswordObject;
