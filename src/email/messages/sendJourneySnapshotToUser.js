import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const sendJourneySnapshotToUser = (emailTo, input, appName) => {
  // take in all the variables as input to insert into html
  // send them inside template object to be inserted into the html file
  console.log('In sendJourneySnapshotToUser')
  const templateFileName = 'journeySnapshotTemplate';
  const templateObject = {
    appName,
  };
  console.log('templateObject', templateObject)
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject,
  );
  console.log('templateString', templateString)
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Test : Journey Snapshot';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    console.log('emailMsgObject', emailMsgObject)
    sendEmail(emailMsgObject);
  });
};

export default sendJourneySnapshotToUser;
