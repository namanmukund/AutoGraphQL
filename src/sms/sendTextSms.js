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
const sendTextSms = (receiverNumber, body) => {
  if (env === 'test' || env === 'testBackend') {
    log(`sendTextSms method called in ${env} environment`);
    return null;
  }
  const client = getClient();
  if (!client) {
    log('Twilio credentials not configured, skipping SMS');
    return null;
  }
  let targetNumber = receiverNumber;
  if (process.env.DATA_MASKING) targetNumber = '+919999694605';

  return client.messages
    .create({
      to: targetNumber,
      from: twilioConfig.senderId,
      body,
    }).then((msg) => {
      log(msg.sid);
    }).catch((err) => {
      log(err);
    });
};

export default sendTextSms;
