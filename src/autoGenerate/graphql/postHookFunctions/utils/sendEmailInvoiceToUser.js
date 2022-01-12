import parsedHtmlFromTemplateFileAndObject from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';

export const sendEmailInvoiceToUser = (payload, templateFileName, subject) => {
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, payload);
  templateString.then((html) => {
    // email to should be in array. Can send the mail to mutiple people
    let emailTo;
    // ccemail should be in array. Can send the mail to mutiple people
    let ccEmail;
    // send email in case a session is booked/updated/deleted
    if (process.env.NODE_ENV === 'production') {
      emailTo = [
        payload.email,
      ];
      ccEmail = [
        'naman.mukund@tekie.in',
        'hamza.hassan@tekie.in',
      ];
    } else {
      emailTo = [
        'kritesh.patel@tekie.in',
      ];
      ccEmail = [
        'kriteshpk@gmail.com',
        'naman.mukund@tekie.in',
      ];
    }

    if (process.env.DATA_MASKING) {
      emailTo = [
        'ishan.dubey@tekie.in',
      ];
      ccEmail = [
        'naman.mukund@tekie.in',
        'kritesh.patel@tekie.in',
      ];
    }

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
