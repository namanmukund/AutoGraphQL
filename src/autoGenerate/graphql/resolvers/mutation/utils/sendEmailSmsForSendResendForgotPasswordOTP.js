import { getNumberAndSendSms } from '../../../../../sms';
import { sendEmailOtpToUser } from '../../../../../email/messages';

const sendEmailSmsForSendResendForgotPasswordOTP = (fetchedUser, isPhone, authentication) => {
  const {
    name, phoneOtp, emailOtp, phone, email,
  } = fetchedUser;
  if (isPhone) {
    getNumberAndSendSms(phone, phoneOtp, name);
  } else {
    const appName = authentication.app.name;
    sendEmailOtpToUser(email, emailOtp, appName);
  }
  return null;
};

export default sendEmailSmsForSendResendForgotPasswordOTP;
