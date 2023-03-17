import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const sendForgotPasswordLinkToUser = (emailTo, forgotPassLink, appName, name) => {
  const templateFileName = 'forgetUserTemplate';
  const templateObject = {
    forgotPassLink,
    appName,
    name,
  };
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject,
  );
  templateString.then((html) => {
    sendEmail(emailTo, html);
  });
};

export default sendForgotPasswordLinkToUser;
