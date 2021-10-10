import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const sendCertificateToUser = async (emailTo, input, appName) => {
  const templateFileName = 'certificate';
  const templateObject = {
    studentName: get(input, 'studentName'),
    mentorName: get(input, 'mentorName'),
    appName,
  };
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject,
  );
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Course Completion Certificate';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    sendEmail(emailMsgObject);
  });
};

export default sendCertificateToUser;
