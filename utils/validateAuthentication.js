/* eslint-disable no-console */
import { get } from 'lodash';
import { ifAuthorized } from './ifAuthorized';
import { UnauthorizedOperationError } from '../constants/errors';
import { backendApps } from '../constants';

const validateAuthentication = (context, type = 'both') => {
  const authentication = ifAuthorized(context);
  const appName = get(authentication, 'app.name');
  const userId = get(authentication, 'user.id');
  console.log('appName===========', appName, userId);
  switch (type) {
    case 'app': {
      if (backendApps.includes(appName)) {
        return true;
      }
      if (!appName) {
        throw new UnauthorizedOperationError();
      }
      break;
    }
    case 'user': {
      if (!userId) {
        throw new UnauthorizedOperationError();
      }
      break;
    }

    default: {
      if (backendApps.includes(appName)) {
        return true;
      }
      if (!appName || !userId) {
        throw new UnauthorizedOperationError();
      }
    }
  }
  return true;
};

export default validateAuthentication;
