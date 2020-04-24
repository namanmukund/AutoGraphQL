import sgMail from '@sendgrid/mail';
import sendGridApi from '../../../config/sendGrid';
import { log } from '../../../utils/log';
import allowedEmailEnvironments from '../../../constants/allowedEmailEnvironments';

const env = process.env.NODE_ENV || 'development';

const sendEmail = (emailMsgObject) => {
  if (allowedEmailEnvironments.includes(env)) {
    sgMail.setApiKey(sendGridApi.SENDGRID_API_KEY);
    sgMail
      .send(emailMsgObject, (error) => {
        if (error) {
          log('Error while sending emial.');
          log(error);
        }
      });
    return null;
  }
  log(`sendEmail method called in ${env} environment`);
  return null;
};

export default sendEmail;
