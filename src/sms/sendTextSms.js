import twilioConfig from '../../config/sms/twilioConfig';
import { log } from '../../utils/log';

// require the Twilio module and create a REST client
const client = require('twilio')(twilioConfig.accountSid, twilioConfig.authToken);

const env = process.env.NODE_ENV || 'development';
const sendTextSms = (receiverNumber, body) => {
  if (env === 'test' || env === 'testBackend') {
    log(`sendTextSms method called in ${env} environment`);
    return null;
  }

  // eslint-disable-next-line no-param-reassign
  if (process.env.DATA_MASKING) receiverNumber = '+919999694605';

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

export default sendTextSms;
