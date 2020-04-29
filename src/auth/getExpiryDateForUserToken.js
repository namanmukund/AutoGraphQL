import { TLA, TMS, TWA } from '../../constants';
import { MENTOR } from '../../constants/roles';

const getExpiryDateForUserToken = (authParams, authentication, isForgotPasswordToken = false, user) => {
  let expiresIn = authParams.TOKEN_EXPIRY_DATE;
  if (!authentication || !authentication.app) {
    return expiresIn;
  }
  // in case of forgot password flow, returning fogot pass expiry time
  if (isForgotPasswordToken) {
    expiresIn = authParams.FORGOT_PASSWORD_EXPIRY_DATE;
    return expiresIn;
  }
  const { app } = authentication;
  const { role } = user;
  const { name } = app;
  switch (name) {
    case TLA:
      expiresIn = authParams.TOKEN_EXPIRY_DATE;
      break;
    case TMS:
      expiresIn = authParams.TOKEN_EXPIRY_DATE;
      break;
    case TWA: {
      if (role === MENTOR) {
        expiresIn = authParams.MENTOR_TOKEN_TEKIE_WEB_APP_EXPIRY_DATE;
      }
      break;
    }
    default:
  }
  return expiresIn;
};

export default getExpiryDateForUserToken;
