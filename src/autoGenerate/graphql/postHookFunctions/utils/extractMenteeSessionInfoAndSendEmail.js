import { get, startCase, toLower } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
// import sendBookingReminderOrConfirmationB2BC from './sendBookingReminderOrConfirmationB2B2C';

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

const extractMenteeSessionInfoAndSendEmail = async (
  action,
  input,
  bookingDate,
  slotTimeStringArray,
  user,
) => {
  if (get(user, 'data.user.studentProfile.batch.id')) return;
  const slotNumber = slotTimeStringArray[0].split('slot')[1];

  const { user: { typeId: userId }, topic: { typeId: topicId } } = input;
  const userInfo = await callLocalGraphqlApi(menteeInfoQuery(userId));
  const menteeInfo = get(userInfo, 'data.user');
  const parentInfo = get(menteeInfo, 'studentProfile.parents[0].user');
  // const parentId = get(parentInfo, 'id');
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
  const topicInfo = await callLocalGraphqlApi(topicInfoQuery(topicId));
  menteeObj.topicTitle = get(topicInfo, 'data.topic.title');
  const topicThumbnail = get(topicInfo, 'data.topic.thumbnailSmall.uri');
  menteeObj.topicThumbnail = '';
  if (topicThumbnail) {
    menteeObj.topicThumbnail = `${process.env.FILE_BASE_URL}/${topicThumbnail}`;
  }
  menteeObj.prevBookingDate = '';
  menteeObj.previousStartTime = '';
  if (get(topicInfo, 'data.topic.order') !== 1) {
    return;
  }
  switch (action) {
    case 'add': {
      // sendBookingReminderOrConfirmationB2BC(parentId, true);
      break;
    }
    case 'update': {
      // sendBookingReminderOrConfirmationB2BC(parentId, true);
      break;
    }
    default:
  }
};

export default extractMenteeSessionInfoAndSendEmail;
