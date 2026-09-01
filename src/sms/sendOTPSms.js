import twilio from 'twilio';
import twilioConfig from '../../config/sms/twilioConfig';
import { log } from '../../utils/log';

const getClient = () => {
  if (twilioConfig.accountSid && twilioConfig.authToken) {
    return twilio(twilioConfig.accountSid, twilioConfig.authToken);
  }
  return null;
};

const env = process.env.NODE_ENV || 'development';
const sendOTPSms = (receiverNumber, phoneOtp, name) => {
  log(`sendOTPSms method called in ${env} environment`);
  if (env === 'test' || env === 'development') {
    return null;
  }
  const client = getClient();
  if (!client) {
    log('Twilio credentials not configured, skipping SMS');
    return null;
  }

  const greeting = name ? `Hi ${name}` : 'Hi';
  const body = `${greeting}, your verification code is: ${phoneOtp}`;
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
