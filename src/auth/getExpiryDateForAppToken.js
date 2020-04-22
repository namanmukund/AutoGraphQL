import { TLA } from '../../constants';

const getExpiryDateForAppToken = (authParams, applicationName) => {
  let expiresIn = authParams.TOKEN_EXPIRY_DATE;
  switch (applicationName) {
    case TLA:
      expiresIn = authParams.TOKEN_EXPIRY_DATE;
      break;
    default:
  }
  return expiresIn;
};

export default getExpiryDateForAppToken;
