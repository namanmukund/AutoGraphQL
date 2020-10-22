import parsedHtmlFromTemplateFileAndObject
  from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';

export const sendEmailInvoiceToUser = (payload, templateFileName, subject) => {
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, payload);
  templateString.then((html) => {
    // email to should be in array. Can send the mail to mutiple people
    let emailTo;
    // send email in case a session is booked/updated/deleted
    if (process.env.NODE_ENV === 'production') {
      emailTo = [
        payload.email,
      ];
    } else {
      emailTo = [
        'kriteshpk@gmail.com',
        'namanmukund@gmail.com',
      ];
    }

    // ccemail should be in array. Can send the mail to mutiple people
    const ccEmail = [''];
    // bccemail should be in array. Can send the mail to mutiple people
    const bccEmail = [''];

    const text = 'Payment Receipt';
    /* if html is empty then in the body text will be appear. Html is having higher
         precedence over text */

    const emailMsgObject = getEmailObject(
      emailTo,
      ccEmail,
      bccEmail,
      subject,
      text,
      html,
      'hello@tekie.in',
    );
    sendEmail(emailMsgObject);
  });
};
