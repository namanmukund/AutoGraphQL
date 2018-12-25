import { createAppToken, createToken } from '../auth';
import { encodeToken } from '../../utils';

const application = process.env.APPLICATION || 'core';

const getTokenForApi = (userData, tokenType, appName) => {
  let appToken;
  if (!appName) {
    appToken = createAppToken('core', application);
  } else {
    appToken = createAppToken(appName, application);
  }
  let userToken = '';
  if (userData) { userToken = createToken(userData); }

  switch (tokenType) {
    case 'app':
      return encodeToken({
        appToken,
        userToken: '',
      });
    case 'user':
      return encodeToken({
        appToken: '',
        userToken,
      });
    default:
  }
  return encodeToken({
    appToken,
    userToken,
  });
};

export default getTokenForApi;
