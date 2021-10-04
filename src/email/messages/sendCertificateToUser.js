import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const sendCertificateToUser = async (emailTo, input, appName) => {
  const templateFileName = 'certificate';
  console.log('templateFileName', templateFileName)
  const templateObject = {
    studentName: get(input, 'studentName'),
    appName,
  };
  console.log('templateObject', templateObject)
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject
  );
  console.log('templateString', templateString)
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Test : Certificate';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    sendEmail(emailMsgObject);
  });
};

export default sendCertificateToUser;
