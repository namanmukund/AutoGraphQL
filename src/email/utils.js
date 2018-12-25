import sgMail from '@sendgrid/mail';
import fs from 'fs';
import { template } from 'lodash';
import { fromEmail } from '../../constants';
import { sendGridApi } from '../../config/authParams/';
import { log } from '../../utils/log';

const env = process.env.NODE_ENV || 'development';

// Clean html string parsed from html file to have only accepted utf-8 characters
const cleanString = (input) => {
  let output = '';
  for (let i = 0; i < input.length; i += 1) {
    if (input.charCodeAt(i) <= 127) {
      output += input.charAt(i);
    }
  }
  return output;
};

const getEmailObject = (emailTo, ccEmail, bccEmail, subject, text, html, emailFromParam) => {
  /* if html is empty then in the body text will be appear. Html is having higher
   precedence over text in subject */
  // emailto should be in array. Can send the mail to mutiple people
  // ccemail should be in array. Can send the mail to mutiple people
  // bccemail should be in array. Can send the mail to mutiple people
  const mailSubject = subject || text;
  const emailObject = {
    to: emailTo,
    cc: ccEmail || '',
    bcc: bccEmail || '',
    from: emailFromParam || fromEmail,
    subject: mailSubject,
    html,
  };
  return emailObject;
};

const parsedHtmlFromTemplateFileAndObject = (fileName, templateObject) => new Promise((resolve) => {
  fs.readFile(`static/templates/${fileName}.html`, 'utf8', (err, str) => {
    const createTemplateForHtml = template(str);
    const html = cleanString(createTemplateForHtml(templateObject));
    resolve(html);
  });
});

const sendEmail = (emailMsgObject) => {
  if (env === 'staging' || env === 'production') {
    sgMail.setApiKey(sendGridApi.SENDGRID_API_KEY);
    sgMail.send(emailMsgObject);
    return null;
  }
  log(`sendEmail method called in ${env} environment`);
  return null;
};

export { sendEmail,
  parsedHtmlFromTemplateFileAndObject,
  getEmailObject,
};
