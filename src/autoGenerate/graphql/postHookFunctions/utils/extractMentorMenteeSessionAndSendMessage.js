import {
  capitalize, get, startCase, toLower,
} from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getFormatedDate from '../../../../../utils/getFormatedDate';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import getLongDate from '../../../../../utils/getLongDate';
import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';
import updateLeadSquared from '../../../../../services/leadsquared/updateLeadSquared';
import addToSchedule from '../../../../../utils/scheduleJobs/addToSchedule';
import getMentorCodingLanguages from '../../resolvers/utils/getMentorCodingLanguages';
import getFullFilePath from '../../../../../utils/getFullFilePath';

const minCap = (num, cap) => (num > cap ? num : cap);

const mentorInfoQuery = (mentorSessionId) => `
  query {
    mentorSession(id: "${mentorSessionId}") {
      user {
        id
        mentorProfile {
          sessionLink
          meetingId
          meetingPassword
          googleMeetLink
          experienceYear
          codingLanguages {
            value
          }
          pythonCourseRating5
          pythonCourseRating4
          pythonCourseRating3
          pythonCourseRating2
          pythonCourseRating1
        }
        profilePic{
          id
          uri
        }
        name
        phone{
          number
          countryCode
        }
      }
    }
  }
`;

const extractMentorMenteeSessionAndSendMessage = async (
  bookingDate,
  slotTimeStringArray,
  mentorSessionId,
  user,
  topic,
  mentorMenteeSessionId,
) => {
  if (get(user, 'data.user.studentProfile.batch.id')) return;
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const { startTime, endTime } = getSlotLabel(slotNumber);
  const menteeInfo = get(user, 'data.user');
  const parentInfo = get(menteeInfo, 'studentProfile.parents[0].user');

  const menteeObj = {
    date: getFormatedDate(bookingDate),
    startTime,
    endTime,
    name: startCase(toLower(get(menteeInfo, 'name') || '')),
    grade: get(menteeInfo, 'studentProfile.grade') || '',
    parentName: startCase(toLower(get(parentInfo, 'name') || '')),
    parentEmail: get(parentInfo, 'email') || '',
    parentNumber: get(parentInfo, 'phone.number') || '',
    countryCode: get(parentInfo, 'phone.countryCode') || '',
  };
  menteeObj.topicTitle = get(topic, 'data.topic.title');

  const mentorInfo = await callLocalGraphqlApi(mentorInfoQuery(mentorSessionId));
  const mentorSession = get(mentorInfo, 'mentorSession', {});
  const mentorProfile = get(mentorSession, 'mentorProfile', {});
  const mentorObj = {
    name: startCase(toLower(get(mentorInfo, 'data.mentorSession.user.name') || '')),
    phoneNumber: get(mentorInfo, 'data.mentorSession.user.phone.number') || '',
    countryCode: get(mentorInfo, 'data.mentorSession.user.phone.countryCode') || '',
  };
  const {
    pythonCourseRating1, pythonCourseRating2, pythonCourseRating3, pythonCourseRating4, pythonCourseRating5,
  } = mentorProfile;

  let totalRatingUsers = 0;
  let cumulativeRating = 0;
  if (pythonCourseRating5) {
    totalRatingUsers += pythonCourseRating5;
    cumulativeRating += pythonCourseRating5 * 5;
  }
  if (pythonCourseRating4) {
    totalRatingUsers += pythonCourseRating4;
    cumulativeRating += pythonCourseRating4 * 4;
  }
  if (pythonCourseRating3) {
    totalRatingUsers += pythonCourseRating3;
    cumulativeRating += pythonCourseRating3 * 3;
  }
  if (pythonCourseRating2) {
    totalRatingUsers += pythonCourseRating2;
    cumulativeRating += pythonCourseRating2 * 2;
  }
  if (pythonCourseRating1) {
    totalRatingUsers += pythonCourseRating1;
    cumulativeRating += pythonCourseRating1;
  }
  mentorObj.rating = minCap(
    totalRatingUsers === 0
      ? 5
      : Math.round(((cumulativeRating) / totalRatingUsers) * 100) / 100,
    4.7,
  );

  const {
    parentName, parentNumber, countryCode, name, grade, parentEmail,
  } = menteeObj;
  const mentorPhoto = get(mentorSession, 'user.profilePic.uri', 'python/email/mentor1.png') || 'python/email/mentor1.png';
  // add session Link to LS
  updateLeadSquared({
    Phone: parentNumber,
    mx_mentor_Name: capitalize(mentorObj.name),
    mx_Meeting_ID: get(mentorInfo, 'data.mentorSession.user.mentorProfile.meetingId'),
    mx_Meeting_Password: get(mentorInfo, 'data.mentorSession.user.mentorProfile.meetingPassword'),
    mx_Demo_Session_Link: get(mentorInfo, 'data.mentorSession.user.mentorProfile.sessionLink'),
    mx_Mentor_Star_Rating: mentorObj.rating,
    mx_Mentor_Photo: getFullFilePath(mentorPhoto),
    mx_Mentor_Exp_in_years: get(mentorProfile, 'experienceYear') || 3,
    mx_Mentor_Languages_Known: getMentorCodingLanguages(get(mentorProfile, 'experienceYear')) || 'Python',
  }, true, {}, true);

  // send email
  if (process.env.NODE_ENV === 'production') {
    if (get(topic, 'data.topic.order') === 1) {
    // send whatsapp emailTemplate message
      const {
        name: mentorName, phoneNumber: mentorPhoneNumber, countryCode: mentorCountryCode,
      } = mentorObj;

      const parameters = [{
        name: 'parent_name',
        value: parentName,
      },
      {
        name: 'student_name',
        value: name,
      },
      {
        name: 'session_date',
        value: getLongDate(bookingDate),
      },
      {
        name: 'session_time',
        value: startTime,
      },
      {
        name: 'number',
        value: `${countryCode}-${parentNumber}`,
      },
      {
        name: 'grade',
        value: grade,
      },
      {
        name: 'email',
        value: parentEmail,
      },
      ];
      const phone = mentorCountryCode.split('+')[1] + mentorPhoneNumber;

      await sendWhatsAppTemplateMessage(
        phone,
        transactionalMessageBody.mentorSessionNotification,
        mentorName,
        parameters,
      );
      // mentor_confirmation_b2c
      const bookingDateTime = new Date(moment(bookingDate).toDate().setHours(slotNumber, 0, 0, 0)).toISOString();

      const hoursLeftForSession = Math.abs(moment(bookingDateTime).diff(moment(), 'hours'));
      if (hoursLeftForSession < 3) return;

      let mentorSessionReminderDateTime = moment(bookingDateTime).subtract(30, 'minutes').toDate();
      if (hoursLeftForSession >= 18) {
        mentorSessionReminderDateTime = moment(bookingDateTime).subtract(2, 'hours').toDate();
      }
      addToSchedule('mentorSessionNotificationB2C', mentorSessionReminderDateTime, {
        mentorMenteeSessionId,
      });
    }
  }
};

export default extractMentorMenteeSessionAndSendMessage;
