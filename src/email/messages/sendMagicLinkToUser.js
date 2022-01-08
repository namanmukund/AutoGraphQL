import getEmailObject from '../../../services/email/utils/getEmailObject';
import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const sendMagicLinkToUser = (emailTo, sendEmailObject) => {
  const templateFileName = 'B2BJoinSession';
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
  );
  if (process.env.DATA_MASKING) {
    // eslint-disable-next-line no-param-reassign
    emailTo = [
      'ishan.dubey@tekie.in',
    ];
  }
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Login Via One Time Link';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};

export default sendMagicLinkToUser;
