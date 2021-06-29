import { get, startCase, toLower } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import parsedHtmlFromTemplateFileAndObject
  from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';
import getFormatedDate from '../../../../../utils/getFormatedDate';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
import updateBookSessionReminderStatus from './updateBookSessionReminderStatus';
import sendBookingReminderOrConfirmationB2BC from './sendBookingReminderOrConfirmationB2B2C';

const menteeInfoQuery = (userId) => `
  query{
    user(id:"${userId}"){
      id
      name
      country
      isBookSessionReminderSent
      timezone
      studentProfile{
        id
        grade
        batch {
          id
        }
        parents{
          id
          user{
            id
            name
            email
            phone{
              number
              countryCode
            }
          }
        }
      }
    }
  }
`;
const topicInfoQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      title
      thumbnailSmall {
        uri
      }
    }
  }
`;

const sendBookedSessionEmailToTekie = (subject, menteeObj) => {
  const templateFileName = 'menteeSessionBookingEmailTemplate';
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, menteeObj);
  templateString.then((html) => {
    const emailTo = [
      'shantanu.najhawan@tekie.in',
      'anand.verma@tekie.in',
      // 'shravastivaidya@gmail.com',
      '19j.agarwal99@gmail.com',
      'jayasivakami2001@gmail.com',
      'dubeyishan17@gmail.com',
      'veera.karan@gmail.com',
      'nilanjan.official1@gmail.com',
      'shivank.goel@tekie.in',
    ];
    const ccEmail = [''];
    const bccEmail = [''];
    const text = '';
    /* if html is empty then in the body text will be appear. Html is having higher
     precedence over text */
    const emailMsgObject = getEmailObject(
      emailTo,
      ccEmail,
      bccEmail,
      subject,
      text,
      html,
      'hello@tekie.in',
    );
    sendEmail(emailMsgObject);
  });
};

const sendBookedSessionEmailToParent = (subject, menteeObj, action) => {
  let templateFileName = menteeObj.country === 'india' ? 'bookedSessionEmailTemplate' : 'bookedSessionEmailTemplateInternational';
  if (action === 'delete') {
    templateFileName = 'canceledSessionEmailTemplate';
  }

  // eslint-disable-next-line no-param-reassign
  menteeObj.timingsText = 'soon!';

  if (menteeObj.isSessionBefore3Hours) {
    // eslint-disable-next-line no-param-reassign
    menteeObj.timingsText = '3 hours before your session!';
  }
  // eslint-disable-next-line no-param-reassign
  menteeObj.action = action;
  const templateString = parsedHtmlFromTemplateFileAndObject(templateFileName, menteeObj);
  templateString.then((html) => {
    const emailTo = [
      menteeObj.parentEmail,
    ];
    const ccEmail = [''];
    const bccEmail = [''];
    const text = '';
    /* if html is empty then in the body text will be appear. Html is having higher
     precedence over text */
    const emailMsgObject = getEmailObject(
      emailTo,
      ccEmail,
      bccEmail,
      subject,
      text,
      html,
      'hello@tekie.in',
    );
    if (menteeObj.country !== 'india') return; // temp check to disable us mentee
    if (action === 'delete' && menteeObj.country !== 'india') return;
    sendEmail(emailMsgObject);
  });
};

const extractMenteeSessionInfoAndSendEmail = async (
  action,
  input,
  bookingDate,
  slotTimeStringArray,
  prevBookingDate,
  prevSlotTimeStringArray,
  user,
  topic,
) => {
  if (get(user, 'data.user.studentProfile.batch.id')) return;
  const slotNumber = slotTimeStringArray[0].split('slot')[1];

  const { user: { typeId: userId }, topic: { typeId: topicId } } = input;
  const userInfo = await callLocalGraphqlApi(menteeInfoQuery(userId));
  const menteeInfo = get(userInfo, 'data.user');
  const parentInfo = get(menteeInfo, 'studentProfile.parents[0].user');
  const parentId = get(parentInfo, 'id');
  const timezone = (get(menteeInfo, 'timezone') && get(menteeInfo, 'timezone') !== 'undefined') ? get(menteeInfo, 'timezone') : 'Asia/Kolkata';
  const {
    startTime, endTime, date, dateObject,
  } = getIntlDateTime(bookingDate, slotNumber, timezone);
  const menteeObj = {
    date,
    startTime,
    endTime,
    id: get(menteeInfo, 'data.user'),
    name: startCase(toLower(get(menteeInfo, 'name') || '')),
    grade: get(menteeInfo, 'studentProfile.grade') || '',
    parentName: startCase(toLower(get(parentInfo, 'name') || '')),
    parentEmail: get(parentInfo, 'email') || '',
    parentNumber: get(parentInfo, 'phone.number') || '',
    countryCode: get(parentInfo, 'phone.countryCode') || '',
    country: get(menteeInfo, 'country') ? get(menteeInfo, 'country') : 'india',
    timezone: get(menteeInfo, 'timezone') || 'Asia/Kolkata',
    isSessionBefore3Hours: moment(dateObject).diff(getIntlDateTime(new Date(), new Date().getHours(), timezone), 'hours', false) >= 4,
    isBookSessionReminderSent: get(menteeInfo, 'isBookSessionReminderSent'),
  };
  const topicInfo = topic || await callLocalGraphqlApi(topicInfoQuery(topicId));
  menteeObj.topicTitle = get(topicInfo, 'data.topic.title');
  const topicThumbnail = get(topicInfo, 'data.topic.thumbnailSmall.uri');
  menteeObj.topicThumbnail = '';
  if (topicThumbnail) {
    menteeObj.topicThumbnail = `${process.env.FILE_BASE_URL}/${topicThumbnail}`;
  }
  menteeObj.prevBookingDate = '';
  menteeObj.previousStartTime = '';

  switch (action) {
    case 'add': {
      sendBookingReminderOrConfirmationB2BC(parentId, true);
      break;
    }
    case 'update': {
      sendBookingReminderOrConfirmationB2BC(parentId, true);
      break;
    }
    default:
  }
};

export default extractMenteeSessionInfoAndSendEmail;
