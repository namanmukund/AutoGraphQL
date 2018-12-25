import jwt from 'jsonwebtoken';
import allAuthParams from '../../config/authParams/index';
import getExpiryDateForAppToken from './getExpiryDateForAppToken';
// applicationName: Name of the application they toked is being generated for
// application: Name of the application whose key is being used
const getAppInfoByApplicationName = (applicationName, code, typeName) => {
  const appInfo = {
    name: applicationName,
  };
  const codeData = {};
  if (typeName && typeName === 'SampleApp') {
    codeData.sampleAppCode = code;
  }
  // Assign relevant code info
  Object.assign(appInfo, codeData);
  return appInfo;
};

export default function createAppToken(applicationName, application, code, typeName) {
  const authParams = allAuthParams[application];
  const appInfo = getAppInfoByApplicationName(applicationName, code, typeName);
  const expiresIn = getExpiryDateForAppToken(authParams, applicationName);
  const token = jwt.sign(
    {
      appInfo,
    },
    authParams.SECRET,
    {
      expiresIn,
      algorithm: authParams.ALGORITHM,
    },

  );
  return token;
}
