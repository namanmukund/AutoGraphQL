import sgMail from '@sendgrid/mail';
import sendGridApi from '../../../config/sendGrid';
import { log } from '../../../utils/log';

const sendEmail = (emailMsgObject) => {
  sgMail.setApiKey(sendGridApi.SENDGRID_API_KEY);
  sgMail
    .send(emailMsgObject, (error) => {
      if (error) {
        log('Error while sending email.');
        log(error);
      }
    });
  return null;
};

export default sendEmail;
