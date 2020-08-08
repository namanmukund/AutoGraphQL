import sendOTPSms from './sendOTPSms';

const getNumberAndSendSms = (phone, phoneOtp, name) => {
  if (phone && phoneOtp) {
    const { countryCode, number } = phone;
    const phoneNumber = countryCode + number;
    sendOTPSms(phoneNumber, phoneOtp, name);
  }
};

export default getNumberAndSendSms;
