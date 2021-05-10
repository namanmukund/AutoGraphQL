// emailTemplate file is the emailTemplate file name and object is what you want to replace in the html
import parsedHtmlFromTemplateFileAndObject from './utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from './utils/getEmailObject';
import sendEmail from './utils/sendEmail';

const sampleEmail = () => {
  const templateFileName = 'sampleEmailTemplate';
  const templateObject = { user: 'testUser' };
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, templateObject);
  templateString.then((html) => {
    // emailto should be in array. Can send the mail to mutiple people
    const emailTo = ['namanmukund@gmail.com', 'kriteshpk@gmail.com'];
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
};

export default sampleEmail;
