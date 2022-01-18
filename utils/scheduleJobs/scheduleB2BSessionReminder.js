import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const getBatchSessions = async () => {
  const dt = new Date().setHours(0, 0, 0, 0);
  const todayParsedDate = new Date(dt).toISOString();
  const hourValue = new Date().getHours();
  const slotNo = (hourValue + 1) <= 23 ? hourValue + 1 : 0;
  const tomorrow = new Date(dt);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowParsedDate = tomorrow.toISOString();
  const query = `
 query{
  batchSessions(filter:{and:[
    {batch_some:{type:b2b}},
    {bookingDate: "${slotNo === 0 ? tomorrowParsedDate : todayParsedDate}"},
    {slot${slotNo}: true},
  ]}){
    id
    sessionStartDate
    topic {
      title
    }
    batch {
      allottedMentor {
        mentorProfile {
          sessionLink
        }
      }
      school {
        code
        name
        isWhatsAppCommsEnabled
        isEmailCommsEnabled
      }
      students{
        user {
          studentProfile {
            user {
              id
              name
            }
          }
          parentProfile{
            user {
              name
              phone {
                countryCode
                number
              }
            }
          }
        }
      }
    }
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.batchSessions', []);
};
const getMagicLinkForUser = async (userId) => {
  const query = `{
  getMagicLink(input: { userId: "${userId}") {
    linkUri
    expiresIn
    linkToken
  }
}
`;
  const magicLinkResp = await callLocalGraphqlApi(query);
  const magicLink = get(magicLinkResp, 'data.getMagicLink', []);
  return magicLink;
};
const sendSessionRemainderMail = (email, sendEmailObject) => {
  const templateFileName = 'B2BJoinSessionReminder';
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
  );
  const emailTo = [email];
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Tekie - Session Reminder!';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};
const scheduleB2BSessionReminder = async () => {
  const batchSessions = await getBatchSessions();
  if (batchSessions && batchSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const batchSession of batchSessions) {
      const topicTitle = get(batchSession, 'topic.title');
      const schoolCode = get(batchSession, 'batch.school.code');
      const loginUrlForWhatsapp = schoolCode && schoolCode.length ? `https://${schoolCode}.tekie.in/login` : `${process.env.TEKIE_WEB_URL}/login`;
      const schoolName = get(batchSession, 'batch.school.name');
      const date = moment(get(batchSession, 'sessionStartDate')).format('D/MM/YY');
      const startTime = moment(get(batchSession, 'sessionStartDate')).format('HH:mm a');
      const students = get(batchSession, 'batch.students');
      const isWhatsAppCommsEnabled = get(batchSession, 'batch.school.isWhatsAppCommsEnabled', false);
      const isEmailCommsEnabled = get(batchSession, 'batch.school.isEmailCommsEnabled', false);
      students.forEach(async (student) => {
        const userId = get(student, 'user.studentProfile.user.id', '');
        const getMagicLink = await getMagicLinkForUser(userId);
        const loginUrlForEmail = getMagicLink.length > 0 ? get(getMagicLink, '[0].linkUri', '') : loginUrlForWhatsapp;
        const studentName = get(student, 'user.studentProfile.user.name');
        const phoneNumber = get(student, 'user.parentProfile.user.phone.countryCode', '+91').split('+')[1] + get(student, 'user.parentProfile.user.phone.number');
        if (isWhatsAppCommsEnabled) {
          sendWhatsAppTemplateMessage(
            phoneNumber,
            'b2b_session_reminder_1',
            phoneNumber,
            [
              {
                name: 'student_name',
                value: studentName,
              },
              {
                name: 'topic_title',
                value: topicTitle,
              },
              {
                name: 'school_name',
                value: schoolName,
              },
              {
                name: 'session_date',
                value: date,
              },
              {
                name: 'session_time',
                value: startTime,
              },
              {
                name: 'login_link',
                value: loginUrlForWhatsapp,
              },
            ],
          );
        }
        if (isEmailCommsEnabled) {
          sendSessionRemainderMail(
            get(student, 'user.parentProfile.user.email'),
            {
              topicTitle, studentName, schoolName, loginUrl: loginUrlForEmail, date, startTime,
            },
          );
        }
      });
    }
  }
};

export default scheduleB2BSessionReminder;
