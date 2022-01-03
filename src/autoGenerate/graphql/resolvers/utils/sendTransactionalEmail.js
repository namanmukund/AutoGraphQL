import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject
  from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { emailText, testMailingList } from '../../../../../constants';

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

const getText = (key, country = 'india') => {
  if (emailText[key]) {
    if (emailText[key][country]) {
      return emailText[key][country];
    }
    return emailText[key].default;
  }
  return '';
};

const sendTransactionalEmail = async (templateObject, emailBody, country = 'india', sendToMentor = false) => {
  const templateFileName = get(emailBody, 'emailTemplate');
  const subject = get(emailBody, 'subject');
  if (!sendToMentor) {
    const res = await callLocalGraphqlApi(USER_QUERY(templateObject.parentEmail));
    const isBatchTypeB2B = get(res, 'data.users[0].parentProfile.children', []).find((child) => get(child, 'batch.type') === 'b2b');
    if (isBatchTypeB2B) return;
  }
  const footerDark = await parsedHtmlFromTemplateFileAndObject(
    'footerDark', {
      instagramLink: getText('instagramLink', country),
      tekieLink: getText('tekieLink', country),
      tekieText: getText('tekieText', country),
    },
  );
  const help = await parsedHtmlFromTemplateFileAndObject('help', { country });
  const footer = await parsedHtmlFromTemplateFileAndObject('footer', templateObject);
  const html = await parsedHtmlFromTemplateFileAndObject(templateFileName, {
    ...templateObject,
    footer,
    footerDark,
    country,
    help,
  });
  // const emailTo = [transactionalMessageBody.testEmail];
  let emailTo = [templateObject.parentEmail];

  let ccEmail = [];

  if (process.env.DATA_MASKING) {
    emailTo = [
      'shubham.gupta+1@tekie.in',
    ];
    ccEmail = [
      'naman.mukund@tekie.in',
      'kritesh.patel@tekie.in',
    ];
  }

  if (templateObject.mentorEmail) {
    ccEmail.push(templateObject.mentorEmail);
  }

  const bccEmail = [];
  /* if html is empty then in the body text will be appear. Html is having higher
    precedence over text */
  const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, '', html, 'hello@tekie.in');
  sendEmail(emailMsgObject);
  if (testMailingList[process.env.NODE_ENV] && testMailingList[process.env.NODE_ENV].email && testMailingList[process.env.NODE_ENV].email.length) {
    testMailingList[process.env.NODE_ENV].email.forEach((email) => {
      sendEmail({ ...emailMsgObject, to: email, cc: [''] });
    });
  }
  if (process.env.NODE_ENV === 'production') {
    if (country === 'usa') {
      testMailingList.usMailingList.forEach((email) => {
        sendEmail({ ...emailMsgObject, to: email, cc: [''] });
      });
    }
  }
};

export default sendTransactionalEmail;
