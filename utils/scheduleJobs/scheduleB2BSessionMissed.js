import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import getSelectedSlotsTime from '../../src/autoGenerate/graphql/preHookFunctions/validation/utils/getSelectedSlotsTime';
import getSlotLabel from '../getSlotLabel';

const getBatchAttendanceDetails = async (batchSessionId) => {
  const query = `
 query{
  batchSession(id:"${batchSessionId}") {
    bookingDate
    ${new Array(24).fill('').map((_, i) => `slot${i}`).join('\n')}
    topic {
      title
    }
    batch {
      school {
        code
        isWhatsAppCommsEnabled
        isEmailCommsEnabled
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
          studentProfile {
            parents {
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
const scheduleB2BSessionMissed = async (batchSessionId) => {
  const batchDetails = await getBatchAttendanceDetails(batchSessionId);
  const topicTitle = get(batchDetails, 'topic.title');
  const date = moment(get(batchDetails, 'bookingDate')).format('DD/MM/YY');
  const slot = get(getSelectedSlotsTime(batchDetails), '[0]');
  const startTime = getSlotLabel(slot).startTime;
  const schoolCode = get(batchDetails, 'batch.school.code');
  const isWhatsAppCommsEnabled = get(batchDetails, 'batch.school.isWhatsAppCommsEnabled', false);
  const isEmailCommsEnabled = get(batchDetails, 'batch.school.isEmailCommsEnabled', false);
  const revisitLink = schoolCode && schoolCode.length ? `https://${schoolCode}.tekie.in/sessions` : `${process.env.TEKIE_WEB_URL}/sessions`;
  const sessionTopicLink = revisitLink;
  const nonAttendes = get(batchDetails, 'attendance', []).filter((attendee) => attendee.status === 'absent' || attendee.status === 'notAssigned');
  nonAttendes.forEach(async (attendee) => {
    const studentName = get(attendee, 'student.user.name', '-');
    const parentName = get(attendee, 'student.user.studentProfile.parents[0].user.name', '-');
    const parentEmail = get(attendee, 'student.user.studentProfile.parents[0].user.email', '-');
    const parentPhone = get(attendee, 'student.user.studentProfile.parents[0].user.phone.countryCode', '+91').split('+')[1] + get(attendee, 'student.user.studentProfile.parents[0].user.phone.number');

    if (isWhatsAppCommsEnabled) {
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
    }
    if (isEmailCommsEnabled) {
      sendSessionAttendenceMail(
        parentEmail,
        'B2BAbsent',
        {
          parentName, topicTitle, sessionTopicLink, studentName, date, startTime,
        },
        'Tekie - You missed today\'s coding session!',
      );
    }
  });
};

export default scheduleB2BSessionMissed;
