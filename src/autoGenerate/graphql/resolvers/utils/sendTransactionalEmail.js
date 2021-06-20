import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject
  from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const USER_QUERY = (email) => `{
  users(filter: { email: "${email}" }) {
    id
    parentProfile {
      children {
        batch {
          type
        }
      }
    }
  }
}`;

const sendTransactionalEmail = async (templateObject, emailBody, country = 'india') => {
  // temporarily switching off mails for US
  if (!country || country === 'india') {
    let templateFileName = get(emailBody, 'emailTemplate');
    let subject = get(emailBody, 'subject');
    if (!!country && country !== 'india') {
      templateFileName = get(emailBody, 'emailTemplateInternational');
      subject = get(emailBody, 'subjectInternational');
    }
    const res = await callLocalGraphqlApi(USER_QUERY(templateObject.parentEmail));
    const isBatchTypeB2B = get(res, 'data.users[0].parentProfile.children', []).find((child) => get(child, 'batch.type') === 'b2b');
    if (isBatchTypeB2B) return;
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
  }
};

export default sendTransactionalEmail;
