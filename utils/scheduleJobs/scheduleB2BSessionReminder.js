import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const getBatchSessions = async () => {
  const dt = new Date().setHours(0, 0, 0, 0);
  const parsedDate = new Date(dt).toISOString();
  const hourValue = new Date().getHours();
  const query = `
 query{
  batchSessions(filter:{and:[
    {batch_some:{type:b2b}},
    {bookingDate: "${parsedDate}"},
    {slot${hourValue + 1}: true},
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
        name
      }
      students{
        user {
          studentProfile {
            user {
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
const sendSessionRemainderMail = (email, sendEmailObject) => {
  const templateFileName = 'B2BJoinSessionReminder';
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
  );
  const emailTo = [email];
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Session About to start';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};
const scheduleB2BSessionReminder = async () => {
  const batchSessions = getBatchSessions();
  if (batchSessions && batchSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const batchSession of batchSessions) {
      const topicTitle = get(batchSession, 'topic.title');
      const loginUrl = get(batchSession, 'allottedMentor.mentorProfile.sessionLink');
      const schoolName = get(batchSession, 'batch.school.name');
      const date = moment(get(batchSession, 'sessionStartDate')).format('D/MM/YY');
      const startTime = moment(get(batchSession, 'sessionStartDate')).format('HH:mm a');
      const students = get(batchSession, 'batch.students');
      students.forEach((student) => {
        const studentName = get(student, 'user.studentProfile.user.name');
        const parentName = get(student, 'user.parentProfile.user.name');
        const phoneNumber = get(student, 'user.parentProfile.user.phone.countryCode').split('+')[1] + get(student, 'user.parentProfile.user.phone.number');
        sendWhatsAppTemplateMessage(
          phoneNumber,
          'B2Bsessionremainder',
          phoneNumber,
          [
            {
              name: 'parentsName',
              value: parentName,
            },
            {
              name: 'topicTitle',
              value: topicTitle,
            },
            {
              name: 'studentName',
              value: studentName,
            },
          ],
        );
        sendSessionRemainderMail(
          get(student, 'user.parentProfile.user.email'),
          {
            topicTitle, studentName, schoolName, loginUrl, date, startTime,
          },
        );
      });
    }
  }
};

export default scheduleB2BSessionReminder;
