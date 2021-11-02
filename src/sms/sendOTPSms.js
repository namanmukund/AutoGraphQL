import twilioConfig from '../../config/sms/twilioConfig';
import { smsOTPMessage } from '../../constants';
import { log } from '../../utils/log';

// require the Twilio module and create a REST client
const client = require('twilio')(twilioConfig.accountSid, twilioConfig.authToken);

const env = process.env.NODE_ENV || 'development';
const sendOTPSms = (receiverNumber, phoneOtp, name) => {
  if (env === 'test' || env === 'testBackend' || env === 'staging') {
    log(`sendOTPSms method called in ${env} environment`);
    return null;
  }
  // eslint-disable-next-line no-param-reassign
  if (process.env.DATA_MASKING) receiverNumber = '+919999694605';

  const { bodyBeforeName, bodyAfterName, bodyBeforeIfNoName } = smsOTPMessage;
  const body = name
    ? bodyBeforeName + name + bodyAfterName + phoneOtp
    : bodyBeforeIfNoName + bodyAfterName + phoneOtp;

  return client.messages
    .create({
      to: receiverNumber,
      from: twilioConfig.senderId,
      body,
    }).then((msg) => {
      log(msg.sid);
    }).catch((err) => {
      log(err);
    });
};

export default sendOTPSms;
