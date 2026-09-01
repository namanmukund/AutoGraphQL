const getExpiryDateForUserToken = (authParams, authentication, isForgotPasswordToken = false) => {
  if (isForgotPasswordToken) {
    return authParams.FORGOT_PASSWORD_EXPIRY_DATE || '1h';
  }
  return authParams.TOKEN_EXPIRY_DATE || '1y';
};

export default getExpiryDateForUserToken;
