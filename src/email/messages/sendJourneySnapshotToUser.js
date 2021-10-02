import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';
import { get } from 'lodash';

const sendJourneySnapshotToUser = async (emailTo, input, appName) => {
  // take in all the variables as input to insert into html
  // send them inside template object to be inserted into the html file
  console.log('In sendJourneySnapshotToUser')

  const templateFileName = get(input, 'templateToFetch') === 'JourneySnapshot-1' ? 'journeySnapshotTemplate' : 'journeySnapshotTemplate2';
  let shoutouts = 0;
  get(input, 'userApprovedCodes', []).forEach(code => {
    shoutouts += get(code, 'totalReactionCount');
  });
  const avatarCode = get(input, 'avatarCode');
  console.log('avatarCode', avatarCode);
  const avatarCodeUrl = `https://tekie-backend.s3.amazonaws.com/python/email/${avatarCode}.png`;
  const templateObject = {
    studentName: get(input, 'studentName'),
    avatarCode,
    pqSolved: get(input, 'totalPqCountToDisplay'),
    savedCodes: get(input, 'userSavedCodes.length'),
    publishedCodes: get(input, 'userApprovedCodes.length'),
    avatarCodeUrl,
    shoutouts,
    appName,
  };
  const avatarDiv = await parsedHtmlFromTemplateFileAndObject('avatarDiv', templateObject);
  console.log('avatarDiv', avatarDiv);
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, { ...templateObject, avatarDiv },
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
