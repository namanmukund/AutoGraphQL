import { getEmailObject, sendEmail, parsedHtmlFromTemplateFileAndObject,
} from '../../email';

const sendEmailOtpToUser = (emailTo, userOtp, appName) => {
  const templateFileName = 'userEmailOtptemplate';
  const templateObject = {
    userOtp,
    appName,
  };
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject);
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'One Time Password (OTP) for sample';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    sendEmail(emailMsgObject);
  });
};

export default sendEmailOtpToUser;
