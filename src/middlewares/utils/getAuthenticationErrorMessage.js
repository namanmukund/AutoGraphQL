import { isBackendApp, isFrontEndApp } from '../../autoGenerate/graphql/validation';
import { ifAuthorized } from '../../../utils';
import { STATIC } from '../../../constants';

const getAuthenticationErrorMessage = (request) => {
  const { currentUser, currentApp } = request;
  const doc = {
    decodedUser: currentUser,
    decodedApp: currentApp,
  };
  const authentication = ifAuthorized(doc);
  const app = authentication && authentication.app;
  const user = authentication && authentication.user;
  if (app) {
    const { type, isValidStaticToken } = app;
    if (type && type === STATIC && !isValidStaticToken) {
      return 'InvalidStaticToken';
    }
    if (isBackendApp(authentication)) {
      return null;
    }

    if (!isFrontEndApp(authentication)) {
      return 'UnauthenticatedAppError';
    }
  } else {
    return 'UnauthenticatedAppError';
  }
  if (!user) {
    return 'UnauthenticatedUserError';
  }

  return null;
};

export default getAuthenticationErrorMessage;
