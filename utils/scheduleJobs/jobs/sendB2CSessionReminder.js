import moment from 'moment';
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import getMentorCodingLanguages from '../../../src/autoGenerate/graphql/resolvers/utils/getMentorCodingLanguages';
import sendTransactionalEmail from '../../../src/autoGenerate/graphql/resolvers/utils/sendTransactionalEmail';
import getFullFilePath from '../../getFullFilePath';
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import getMenteeSessions from '../../../src/autoGenerate/graphql/postHookFunctions/utils/getMenteeSessions';
import getSelectedSlotsTime from '../../../src/autoGenerate/graphql/preHookFunctions/validation/utils/getSelectedSlotsTime';
import getIntlDateTime from '../../timeZoneDiff';
import { sendTextSms } from '../../../src/sms';
import { meWatiSMS, usWatiSMS } from '../../../constants';

const USER = (id) => `{
  user(id: "${id}") {
    name
    studentProfile {
      parents {
        user {
          name
          email
          country
          timezone
          phone {
            number
            countryCode
          }
        }
      }
    }
  }
}`;

const getMentorMenteeSession = async (menteeSessionId) => {
  const query = `
    query{
      mentorMenteeSessions(filter:{
          menteeSession_some:{id:"${menteeSessionId}"}
      }){
        id
        mentorSession{
          id
          user{
            id
            name
            username
            email
            country
            timezone
            phone{
              countryCode
              number
            }
            profilePic{
              id
              uri
            }
            mentorProfile{
              id
              codingLanguages {
                value
              }
              experienceYear
              sessionLink
              googleMeetLink
              meetingId
              meetingPassword
              pythonCourseRating1
              pythonCourseRating2
              pythonCourseRating3
              pythonCourseRating4
              pythonCourseRating5
            }
          }
        }
      }
    }`;
  const res = await callLocalGraphqlApi(query);
  const mentorMenteeSession = get(res, 'data.mentorMenteeSessions[0]', {});
  return mentorMenteeSession;
};

const sendB2CSessionReminder = async ({
  userId, menteeSessionId, menteeSessionUpdatedAt, jobType,
}, deleteJob = () => {}) => {
  const menteeSessions = await getMenteeSessions(userId);
  if (menteeSessions.length === 0) {
    deleteJob();
    return;
  }
  const menteeSession = get(menteeSessions, '[0]', {});
  if (menteeSession.id !== menteeSessionId) {
    deleteJob();
    return;
  }
  if (!!menteeSessionUpdatedAt && menteeSession.updatedAt.toString() !== menteeSessionUpdatedAt.toString()) {
    deleteJob();
    return;
  }
  const res = await callLocalGraphqlApi(USER(userId));
  const mentorMenteeSession = await getMentorMenteeSession(get(menteeSession, 'id', ''));
  if (jobType !== 'B2CEngagementMail') {
    if (!get(mentorMenteeSession, 'id')) {
      deleteJob();
      return;
    }
  }
  const parent = get(res, 'data.user.studentProfile.parents[0].user', {});
  const parentEmail = get(parent, 'email', {});
  const country = get(parent, 'country', {});
  const timezone = get(parent, 'timezone', {});
  const parentName = get(parent, 'name');
  const phone = get(parent, 'phone.countryCode', '').replace('+', '') + get(parent, 'phone.number');
  const studentName = get(res, 'data.user.name');

  const { bookingDate, ...slots } = menteeSession;
  const slotNumber = getSelectedSlotsTime(slots)[0];
  const { dateObject, startTime, endTime } = getIntlDateTime(get(menteeSession, 'bookingDate'), slotNumber, timezone);
  const date = moment(dateObject).format('dddd, Do MMMM');
  const sessionDateTime = `${date} ${startTime}`;

  const mentor = get(mentorMenteeSession, 'mentorSession.user');
  const mentorInfo = get(mentor, 'mentorProfile');
  const mentorName = get(mentor, 'name', '');
  const experienceYear = get(mentorInfo, 'experienceYear') || 3;
  const meetingId = get(mentorInfo, 'meetingId') || 3;
  const meetingPassword = get(mentorInfo, 'meetingPassword') || 3;
  const sessionLink = get(mentorInfo, 'sessionLink');
  const mentorPhoneNumber = get(mentorInfo, 'phone.countryCode') + get(mentorInfo, 'phone.number');
  const mentorProfilePic = getFullFilePath(get(mentor, 'profilePic.uri', ''));
  const codingLanguages = getMentorCodingLanguages(get(mentorInfo, 'codingLanguages'), []) || 'Python';
  if (jobType === 'B2CEngagementMail') {
    sendTransactionalEmail({
      parentEmail,
      parentName,
      studentName,
    }, {
      emailTemplate: 'B2CEngagementMail',
      subject: 'Become a Super Parent - Here\'s how!',
    }, country);
  } else if (jobType === 'B2CEngagementMailWithMentor') {
    if (country === 'usa') {
      if (!sessionLink) return;
      sendTransactionalEmail({
        parentEmail,
        parentName,
        studentName,
        bookingDate: date,
        startTime,
        endTime,
        mentorProfilePic,
        mentorName,
        sessionDateTime,
        sessionLink,
        experienceYear,
        meetingId,
        meetingPassword,
        codingLanguages,
        mentorPhoneNumber,
      }, {
        emailTemplate: 'textMentorDetails',
        subject: 'Your Mentor is ready to meet You!',
      }, country);
    } else {
      if (!sessionLink) return;
      sendTransactionalEmail({
        parentEmail,
        parentName,
        studentName,
        bookingDate: date,
        startTime,
        endTime,
        mentorProfilePic,
        mentorName,
        sessionLink,
        experienceYear,
        sessionDateTime,
        meetingId,
        meetingPassword,
        codingLanguages,
        mentorPhoneNumber,
      }, {
        emailTemplate: 'B2CEngagementMailWithMentor',
        subject: 'Your Mentor is ready to meet You!',
      }, country);
    }
  } else if (jobType === 'B2CBookingFinalReminder') {
    if (country === 'usa') {
      if (!sessionLink) return;
      sendTransactionalEmail({
        sessionLink,
        parentEmail,
        parentName,
        sessionDateTime,
        meetingId,
        meetingPassword,
        startTime,
      }, {
        emailTemplate: 'textSessionLink',
        subject: `${studentName}'s coding journey begins soon. Are you excited?`,
      }, country);
    } else {
      if (!sessionLink) return;
      sendTransactionalEmail({
        sessionLink,
        parentEmail,
      }, {
        emailTemplate: 'B2CSessionLink',
        subject: `${studentName}'s coding journey begins soon. Are you excited?`,
      }, country);
    }
    if (country === 'india') {
      if (!sessionLink) return;
      sendWhatsAppTemplateMessage(phone, 'demo_reminder_1', parentName, [
        { name: 'parent_name', value: parentName },
        { name: 'student_name', value: studentName },
        { name: 'session_date', value: date },
        { name: 'session_time', value: startTime },
        { name: 'session_link', value: sessionLink },
        { name: 'meeting_id', value: meetingId },
        { name: 'meeting_password', value: meetingPassword },
      ]);
    }
  } else if (jobType === 'B2CSessionReminderWati') {
    if (country === 'india') {
      if (!sessionLink) return;
      sendWhatsAppTemplateMessage(phone, 'demo_reminder_2', parentName, [
        { name: 'student_name', value: studentName },
        { name: 'session_link', value: sessionLink },
        { name: 'meeting_id', value: meetingId },
        { name: 'meeting_password', value: meetingPassword },
      ]);
    } else if (country === 'usa') {
      sendTextSms(`+${phone}`, usWatiSMS.sessionReminder(studentName, startTime));
    } else {
      sendTextSms(`+${phone}`, meWatiSMS.sessionReminder(studentName, startTime));
    }
  } else {
    if (country === 'usa') {
      if (!sessionLink) return;
      sendTransactionalEmail({
        parentEmail,
        parentName,
        studentName,
        bookingDate: date,
        startTime,
        endTime,
        mentorProfilePic,
        mentorName,
        sessionLink,
        experienceYear,
        sessionDateTime,
        meetingId,
        meetingPassword,
        codingLanguages,
        mentorPhoneNumber,
      }, {
        emailTemplate: 'textMentorDetails',
        subject: `${studentName}'s coding journey begins soon. Are you excited?`,
      }, country);
    } else {
      if (!sessionLink) return;
      sendTransactionalEmail({
        parentEmail,
        parentName,
        studentName,
        bookingDate: date,
        startTime,
        endTime,
        mentorProfilePic,
        mentorName,
        experienceYear,
        codingLanguages,
        sessionLink,
      }, {
        emailTemplate: 'B2CSessionLinkWithMentor',
        subject: `${studentName}'s coding journey begins soon. Are you excited?`,
      }, country);
    }
    if (country === 'india') {
      if (!sessionLink) return;
      sendWhatsAppTemplateMessage(phone, 'demo_reminder_1', parentName, [
        { name: 'parent_name', value: parentName },
        { name: 'student_name', value: studentName },
        { name: 'session_date', value: date },
        { name: 'session_time', value: startTime },
        { name: 'session_link', value: sessionLink },
        { name: 'meeting_id', value: meetingId },
        { name: 'meeting_password', value: meetingPassword },
      ]);
    }
  }
  deleteJob();
};

export default sendB2CSessionReminder;
