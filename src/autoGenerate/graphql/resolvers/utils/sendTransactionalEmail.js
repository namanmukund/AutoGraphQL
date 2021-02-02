import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject
  from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';

const sendTransactionalEmail = async (templateObject, emailBody, country = 'india') => {
  let templateFileName = get(emailBody, 'emailTemplate');
  let subject = get(emailBody, 'subject');
  if (!!country && country !== 'india') {
    templateFileName = get(emailBody, 'emailTemplateInternational');
    subject = get(emailBody, 'subjectInternational');
  }

  const footer = await parsedHtmlFromTemplateFileAndObject('footer', templateObject);
  const html = await parsedHtmlFromTemplateFileAndObject(templateFileName, { ...templateObject, footer });
  // const emailTo = [transactionalMessageBody.testEmail];
  const emailTo = [templateObject.parentEmail];

  const ccEmail = [];

  if (templateObject.mentorEmail) {
    ccEmail.push(templateObject.mentorEmail);
  }

  const bccEmail = [];
  /* if html is empty then in the body text will be appear. Html is having higher
    precedence over text */
  const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, '', html, 'hello@tekie.in');
  sendEmail(emailMsgObject);
};

export default sendTransactionalEmail;
