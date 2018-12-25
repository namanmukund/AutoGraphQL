import { getPhoneOTP } from '../../sms';
import { getEmailOTP } from '../../email';

// parse input according to email/phone
const getSendResendForgotPasswordOTPInput = (hookInput) => {
  const { isPhone } = hookInput;
  let newParams;
  if (isPhone) {
    newParams = getPhoneOTP(hookInput);
  } else {
    newParams = getEmailOTP(hookInput);
  }
  return newParams;
};

export default getSendResendForgotPasswordOTPInput;
