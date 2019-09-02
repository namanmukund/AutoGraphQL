import { FRONTEND_APP_TWO, FRONTEND_APP_ONE } from '../../constants';

const getExpiryDateForUserToken = (authParams, authentication, isForgotPasswordToken = false) => {
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
  const { name } = app;
  switch (name) {
    case FRONTEND_APP_TWO:
      expiresIn = authParams.TOKEN_EXPIRY_DATE;
      break;
    case FRONTEND_APP_ONE:
      expiresIn = authParams.TOKEN_EXPIRY_DATE;
      break;
    default:
  }
  return expiresIn;
};

export default getExpiryDateForUserToken;
