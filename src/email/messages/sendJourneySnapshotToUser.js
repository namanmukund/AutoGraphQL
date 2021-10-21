import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

function capitalize(str) {
  const lower = str.toLowerCase();
  return str.charAt(0).toUpperCase() + lower.slice(1);
}

const sendJourneySnapshotToUser = async (emailTo, input, appName) => {
  const templateFileName = get(input, 'templateToFetch') === 'JourneySnapshot-1' ? 'journeySnapshotTemplate' : 'journeySnapshotTemplate2';
  // const templateFileName = 'journeySnapshotTemplate';
  let shoutouts = 0;
  get(input, 'userApprovedCodes', []).forEach((code) => {
    shoutouts += get(code, 'totalReactionCount');
  });
  const studentName = capitalize(get(input, 'studentName').split(' ')[0]);
  const avatarCode = get(input, 'avatarCode');
  const avatarCodeUrl = `https://tekie-backend.s3.amazonaws.com/python/email/${avatarCode}.png`;
  const avatarMarginTop = get(input, 'templateToFetch') === 'JourneySnapshot-1' ? '50px' : '100px';
  // const avatarMarginTop = '50px';
  const templateObject = {
    studentName,
    avatarCode,
    avatarMarginTop,
    pqSolved: get(input, 'totalPqCountToDisplay'),
    savedCodes: get(input, 'userSavedCodes.length'),
    publishedCodes: get(input, 'userApprovedCodes.length'),
    avatarCodeUrl,
    shoutouts,
    appName,
  };
  const avatarDiv = await parsedHtmlFromTemplateFileAndObject('avatarDiv', templateObject);
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, { ...templateObject, avatarDiv },
  );

  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Tekie - Journey Snapshot';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html);
    sendEmail(emailMsgObject);
  });
};

export default sendJourneySnapshotToUser;
