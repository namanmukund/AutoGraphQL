import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const sendForgotPasswordLinkToUser = (emailTo, forgotPassLink, appName) => {
  const templateFileName = 'userEmailForgotPasswordLinkTemplate';
  const templateObject = {
    forgotPassLink,
    appName,
  };
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject);
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Forgot Password Sample';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    sendEmail(emailMsgObject);
  });
};

export default sendForgotPasswordLinkToUser;
