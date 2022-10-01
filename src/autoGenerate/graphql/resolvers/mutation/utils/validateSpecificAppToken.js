import { backendApps } from '../../../../../../constants';
import {
  UnauthenticatedAppError,
  UnauthenticatedUserError, UserTokenNotRequiredError,
} from '../../../../../../constants/errors';

const validateSpecificAppToken = (
  authentication,
  appName,
  isUserTokenReq = true,
  isBackendAppAllowed = true,
) => {
  const { user, app } = authentication;
  if (app && app.name && isBackendAppAllowed && backendApps.includes(app.name)) {
    return true;
  }

  if (!appName.includes(app.name)) {
    throw new UnauthenticatedAppError();
  }
  if (!user && isUserTokenReq) {
    throw new UnauthenticatedUserError();
  } else if (user && !isUserTokenReq) {
    throw new UserTokenNotRequiredError();
  }
  return true;
};

export default validateSpecificAppToken;
