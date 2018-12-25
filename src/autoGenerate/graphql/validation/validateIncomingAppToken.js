import { backendApps } from '../../../../constants';

const validateIncomingAppToken = (authentication, frontendAppName) => {
  let flag = false;
  if (authentication && authentication.app && authentication.app.name) {
    const { app: { name } } = authentication;
    if (backendApps.includes(name) || (name === frontendAppName)) {
      flag = true;
    }
  }
  return flag;
};

export default validateIncomingAppToken;
