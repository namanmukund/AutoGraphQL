import { FRONTEND_APP_TWO } from '../../constants';

const getExpiryDateForAppToken = (authParams, applicationName) => {
  let expiresIn = authParams.TOKEN_EXPIRY_DATE;
  switch (applicationName) {
    case FRONTEND_APP_TWO:
      expiresIn = authParams.TOKEN_EXPIRY_DATE;
      break;
    default:
  }
  return expiresIn;
};

export default getExpiryDateForAppToken;
