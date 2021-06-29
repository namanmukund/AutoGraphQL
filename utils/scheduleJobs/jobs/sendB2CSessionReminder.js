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

const sendB2CSessionReminder = async ({ userId, menteeSessionId, jobType }, deleteJob = () => {}) => {
  const menteeSessions = await getMenteeSessions(userId);
  if (menteeSessions.length === 0) {
    deleteJob();
    return;
  }
  const menteeSession = menteeSessions.get('[0]', {});
  if (menteeSession.get('id') !== menteeSessionId) {
    deleteJob();
    return;
  }
  const res = await callLocalGraphqlApi(USER(userId));

  const mentorMenteeSession = await getMentorMenteeSession(menteeSession.get('id'));
  if (!get(mentorMenteeSession, 'id')) {
    deleteJob();
    return;
  }
  const parent = get(res, 'data.user.studentProfile.parents[0].user', {});
  const parentEmail = get(parent, 'email', {});
  const country = get(parent, 'country', {});
  const timezone = get(parent, 'timezone', {});
  const parentName = get(parent, 'name');
  const phone = get(parent, 'phone.countryCode', '').replace('+', '') + get(res, 'phone.number');
  const studentName = get(res, 'data.user.name');

  const { bookingDate, ...slots } = menteeSessions;
  const slotNumber = get(getSelectedSlotsTime(slots), '[0]');

  const { dateObject, startTime, endTime } = getIntlDateTime(get(menteeSessions, 'bookingDate'), slotNumber, timezone);
  const date = moment(dateObject).format('dddd, Do MMMM');
  const sessionDateTime = `${date} ${startTime}`;

  const mentor = get(mentorMenteeSession, 'mentorSession.user');
  const mentorInfo = get(mentor, 'mentorProfile');
  const mentorName = get(mentor, 'name', '');
  const experienceYear = get(mentorInfo, 'experienceYear') || 3;
  const meetingId = get(mentorInfo, 'meetingId') || 3;
  const meetingPassword = get(mentorInfo, 'meetingPassword') || 3;
  const sessionLink = get(mentorInfo, 'googleMeetLink') ? get(mentorInfo, 'googleMeetLink') : get(mentorInfo, 'sessionLink');
  const mentorPhoneNumber = get(mentorInfo, 'phone.countryCode') + get(mentorInfo, 'phone.number');
  const mentorProfilePic = getFullFilePath(get(mentor, 'profilePic.uri', ''));
  const schoolName = getFullFilePath(get(mentor, 'school.name', ''));
  const codingLanguages = getMentorCodingLanguages(get(mentorInfo, 'codingLanguages'), []) || 'Python';

  if (jobType === 'B2CEngagementMail') {
    sendTransactionalEmail({
      parentEmail,
      parentName,
      studentName,
    }, {
      emailTemplate: 'B2CEngagementMail',
      subject: `${parentName}, Here are few Coding Terms you should know!`,
    }, country);
  } else if (jobType === 'B2CEngagementMailWithMentor') {
    if (country === 'usa') {
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
        subject: 'Meet your mentor for the Session!',
      }, country);
    } else {
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
        subject: 'Meet your mentor for the Session!',
      }, country);
    }
  } else if (jobType === 'B2CSessionLink') {
    if (country === 'usa') {
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
        subject: `${studentName}, Your link to join Tekie.`,
      }, country);
    } else {
      sendTransactionalEmail({
        sessionLink,
        parentEmail,
      }, {
        emailTemplate: 'B2CSessionLink',
        subject: `${studentName}, Your link to join Tekie.`,
      }, country);
    }
    if (country === 'india') {
      sendWhatsAppTemplateMessage(phone, 'demo_reminder_1', parentName, [
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
      sendWhatsAppTemplateMessage(phone, 'demo_reminder_2', parentName, [
        { name: 'student_name', value: studentName },
        { name: 'school_name', value: schoolName },
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
        subject: `${studentName}, Your link to join Tekie.`,
      }, country);
    } else {
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
        subject: `${studentName}, Your link to join Tekie Coding Carnival.`,
      }, country);
    }
    if (country === 'india') {
      sendWhatsAppTemplateMessage(phone, 'demo_reminder_1', parentName, [
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
