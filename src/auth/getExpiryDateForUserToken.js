import { FRONTEND_APP_TWO, FRONTEND_APP_ONE } from '../../constants';

const getExpiryDateForUserToken = (authParams, authentication) => {
  let expiresIn = authParams.TOKEN_EXPIRY_DATE;
  if (!authentication || !authentication.app) {
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
