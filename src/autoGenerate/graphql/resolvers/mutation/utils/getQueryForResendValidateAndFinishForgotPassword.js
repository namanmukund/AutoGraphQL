const getQueryForResendValidateAndFinishForgotPassword = (params) => {
  const { phone, isPhone, email } = params;
  let searchObj;
  if (isPhone) {
    const { countryCode, number } = phone;
    searchObj = {
      'phone.countryCode': countryCode,
      'phone.number': number,
    };
  } else {
    searchObj = {
      email,
    };
  }
  return searchObj;
};
export default getQueryForResendValidateAndFinishForgotPassword;
