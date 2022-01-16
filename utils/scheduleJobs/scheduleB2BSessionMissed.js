import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const getBatchAttendanceDetails = async (batchSessionId) => {
  const query = `
 query{
  batchSession(id:"${batchSessionId}") {
    sessionStartDate
    topic {
      title
    }
    batch {
      school {
        code
      }
      allottedMentor {
        mentorProfile {
          sessionLink
        }
      }
    }
    attendance {
      status
      student {
        user {
          name
          parentProfile {
            user {
              name
              email
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
  return get(res, 'data.batchSession');
};
const sendSessionAttendenceMail = (email, templateName, sendEmailObject, mailSubject) => {
  const templateFileName = templateName;
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
  );
  const emailTo = [email];
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = mailSubject;
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};
const scheduleB2BSessionMissed = async (input, params, mutationName, context) => {
  const { batchSessionId } = context;
  const batchDetails = getBatchAttendanceDetails(batchSessionId);
  const topicTitle = get(batchDetails, 'topic.title');
  const date = moment(get(batchDetails, 'sessionStartDate')).format('D/MM/YY');
  const startTime = moment(get(batchDetails, 'sessionStartDate')).format('HH:mm a');
  const schoolCode = get(batchDetails, 'batch.school.code');
  const revisitLink = schoolCode && schoolCode.length ? `https://${schoolCode}.tekie.in/sessions` : `${process.env.TEKIE_WEB_URL}/sessions`;
  const nonAttendes = get(batchDetails, 'attendance', []).filter((attendee) => attendee.status === 'absent');
  nonAttendes.forEach(async (attendee) => {
    const studentName = get(attendee, 'student.user.name');
    const parentName = get(attendee, 'student.user.parentProfile.user.name');
    const parentEmail = get(attendee, 'student.user.parentProfile.user.email');
    const parentPhone = get(attendee, 'student.user.parentProfile.user.phone.countryCode').split('+')[1] + get(attendee, 'student.user.parentProfile.user.phone.number');
    sendWhatsAppTemplateMessage(
      parentPhone,
      'b2b2_missed_session_update',
      parentPhone,
      [
        {
          name: 'parent_name',
          value: parentName,
        },
        {
          name: 'topic_title',
          value: topicTitle,
        },
        {
          name: 'revisit_link',
          value: revisitLink,
        },
        {
          name: 'student_name',
          value: studentName,
        },
        {
          name: 'session_date',
          value: date,
        },
        {
          name: 'session_time',
          value: startTime,
        },
      ],
    );
    sendSessionAttendenceMail(
      parentEmail,
      'B2BAbsent',
      {
        parentName, topicTitle, sessionTopicLink, studentName, date, startTime,
      },
      'Tekie - You missed today\'s coding session!',
    );
  });
};

export default scheduleB2BSessionMissed;
