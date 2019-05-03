import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

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
