import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const sendForgotPasswordLinkToUser = (emailTo, forgotPassLink, appName) => {
  const templateFileName = 'forgetUserTemplate';
  const templateObject = {
    forgotPassLink,
    appName,
  };
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject,
  );
  if (process.env.DATA_MASKING) {
    // eslint-disable-next-line no-param-reassign
    emailTo = [
      'shubham.gupta@tekie.in',
    ];
  }
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Reset Your Password';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    sendEmail(emailMsgObject);
  });
};

export default sendForgotPasswordLinkToUser;
