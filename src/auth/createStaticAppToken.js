import jwt from 'jsonwebtoken';
import { frontEndApps, backendApps, STATIC } from '../../constants';
import authParams from '../../config/authParams';
import { InvalidApplicationNameError } from '../../constants/errors';

const validateAppTokenType = (applicationName, type) => {
  switch (type) {
    case 'frontend': {
      if (!frontEndApps.includes(applicationName)) {
        throw new InvalidApplicationNameError({
          data: {
            applicationType: 'frontend',
          },
        });
      }
      break;
    }
    case 'backend': {
      if (!backendApps.includes(applicationName)) {
        throw new InvalidApplicationNameError({
          data: {
            applicationType: 'backend',
          },
        });
      }
      break;
    }
    default:
      throw new InvalidApplicationNameError();
  }

  return true;
};
const createStaticAppToken = (applicationName, type) => {
  validateAppTokenType(applicationName, type);
  const {
    FRONTEND_STATIC_APP_TOKEN_EXPIRY_DATE,
    BACKEND_STATIC_APP_TOKEN_EXPIRY_DATE,
  } = authParams;
  const token = jwt.sign(
    {
      appInfo: {
        name: applicationName,
        type: STATIC,
      },
    },
    authParams.SECRET,
    {
      expiresIn: (type === 'frontend') ? FRONTEND_STATIC_APP_TOKEN_EXPIRY_DATE : BACKEND_STATIC_APP_TOKEN_EXPIRY_DATE,
      algorithm: authParams.ALGORITHM,
    },
  );
  return token;
};
export default createStaticAppToken;
