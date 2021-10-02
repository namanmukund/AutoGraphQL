import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';
import { get } from 'lodash';

const sendJourneySnapshotToUser = (emailTo, input, appName) => {
  // take in all the variables as input to insert into html
  // send them inside template object to be inserted into the html file
  console.log('In sendJourneySnapshotToUser')

  // TODO : fetch selective template
  const templateFileName = 'journeySnapshotTemplate';
  // TODO : get shoutouts
  const templateObject = {
    studentName: get(input, 'studentName'),
    avatarCode: get(input, 'avatarCode'),
    pqSolved: get(input, 'totalPqCountToDisplay'),
    savedCodes: get(input, 'userSavedCodes.length'),
    publishedCodes: get(input, 'userApprovedCodes.length'),
    shoutouts: '0',
    appName,
  };
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject,
  );
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Test : Journey Snapshot';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    sendEmail(emailMsgObject);
  });
};

export default sendJourneySnapshotToUser;
