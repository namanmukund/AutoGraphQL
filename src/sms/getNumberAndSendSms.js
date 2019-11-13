import sendOTPSms from './sendOTPSms';

const getNumberAndSendSms = (input, name) => {
  // console.log()
  const { phone, phoneOtp } = input;
  if (phone && phoneOtp) {
    const { countryCode, number } = phone;
    const phoneNumber = countryCode + number;
    getNumberAndSendSms.sendSms(phoneNumber, phoneOtp, name);
  }
};

getNumberAndSendSms.sendSms = (...args) => {
  sendOTPSms(...args);
};

export default getNumberAndSendSms;
