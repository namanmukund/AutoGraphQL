import { getEmailObject, sendEmail, parsedHtmlFromTemplateFileAndObject } from '.';
// template file is the template file name and object is what you want to replace in the html
const templateFileName = 'sampleEmailTemplate';
const templateObject = { user: 'XYZ' };
const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, templateObject);
templateString.then((html) => {
  // emailto should be in array. Can send the mail to mutiple people
  const emailTo = [''];
  // ccemail should be in array. Can send the mail to mutiple people
  const ccEmail = [''];
  // bccemail should be in array. Can send the mail to mutiple people
  const bccEmail = [''];
  const subject = 'Test Subject';
  const text = 'Test Text';
  /* if html is empty then in the body text will be appear. Html is having higher
   precedence over text */
  const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
  sendEmail(emailMsgObject);
});
