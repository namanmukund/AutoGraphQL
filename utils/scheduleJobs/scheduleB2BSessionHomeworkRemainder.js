/* eslint-disable no-loop-func */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import getSlotLabel from '../getSlotLabel';
import getSelectedSlotsTime from '../../src/autoGenerate/graphql/preHookFunctions/validation/utils/getSelectedSlotsTime';

const BATCH_SESSION = (batchSessionId) => `{
  batchSession(id: "${batchSessionId}") {
    id
    course {
      id
    }
    topic {
      title
      order
    }
    batch {
      code
      type
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
            parents {
              user {
                id
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
    bookingDate
    ${new Array(24).fill('').map((_, i) => `slot${i}`).join('\n')}
  }
}`;

const isHomeworkSubmitted = async (topicId, courseId, studentId) => {
  const query = `
    query{
        mentorMenteeSessions(
            filter:{and:[
              {topic_some:{id:"${topicId}"}},
              {menteeSession_some: {user_some: {id: "${studentId}"}}},
              {course_some:{id:"${courseId}"}},
            ]}
          ) {
            isSubmittedForReview
            studentProfile {
              user{
                id
              }
            }
          }
   }
   `;
  const res = await callLocalGraphqlApi(query);
  const mentorMenteeSessions = get(res, 'data.mentorMenteeSessions');
  const isAssignmentSubmitted = get(mentorMenteeSessions, '[0].isSubmittedForReview', false);
  if (isAssignmentSubmitted) {
    return true;
  }
  return false;
};

const sendSessionRemainderMail = (email, sendEmailObject) => {
  const templateFileName = 'B2BHomework';
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
  );
  let emailTo = [email];
  if (process.env.DATA_MASKING) {
    // eslint-disable-next-line no-param-reassign
    emailTo = [
      'gokul.madhusudhan@tekie.in',
    ];
  }
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Tekie - Maintain your Homework Streak!';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};

const scheduleB2BSessionHomeworkRemainder = async (batchSessionId, deleteJob = () => {}) => {
  const batchSessionRes = await callLocalGraphqlApi(BATCH_SESSION(batchSessionId));
  const batchSession = get(batchSessionRes, 'data.batchSession', {});
  if (!(batchSession || batchSession.id)) return;
  const bookingDate = get(batchSessionRes, 'data.batchSession.bookingDate');
  const date = moment(bookingDate).format('DD/MM/YY');
  const slot = get(getSelectedSlotsTime(get(batchSessionRes, 'data.batchSession')), '[0]');
  const startTime = getSlotLabel(slot).startTime;
  const topicId = get(batchSession, 'batch.topic.id');
  const courseId = get(batchSession, 'course.id');
  const students = get(batchSession, 'batch.students');
  const schoolCode = get(batchSession, 'batch.school.code');
  const isWhatsAppCommsEnabled = get(batchSession, 'batch.school.isWhatsAppCommsEnabled', false);
  const isEmailCommsEnabled = get(batchSession, 'batch.school.isEmailCommsEnabled', false);
  const homeworkLink = schoolCode && schoolCode.length ? `https://${schoolCode}.tekie.in/homework` : `${process.env.TEKIE_WEB_URL}/homework`;
  const revisitLink = schoolCode && schoolCode.length ? `https://${schoolCode}.tekie.in/sessions` : `${process.env.TEKIE_WEB_URL}/sessions`;
  students.forEach(async (student) => {
    const studentName = get(student, 'user.studentProfile.user.name', '');
    const parentName = get(student, 'user.studentProfile.parents[0].user.name', '-');
    const studentId = get(student, 'user.studentProfile.user.id', '');
    const parentEmail = get(student, 'user.studentProfile.parents[0].user.email', '');
    const parentPhone = get(student, 'user.studentProfile.parents[0].user.phone.countryCode', '+91').split('+')[1] + get(student, 'user.studentProfile.parents[0].user.phone.number');
    const hasStudentSubmittedHomework = await isHomeworkSubmitted(topicId, courseId, studentId);
    if (!hasStudentSubmittedHomework) {
      if (isWhatsAppCommsEnabled) {
        sendWhatsAppTemplateMessage(
          parentPhone,
          'b2b_homework_reminder_24hrs',
          parentPhone,
          [
            {
              name: 'parent_name',
              value: parentName,
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
            {
              name: 'homework_link',
              value: homeworkLink,
            },
            {
              name: 'revisit_link',
              value: revisitLink,
            },
          ],
        );
      }
      if (isEmailCommsEnabled) {
        sendSessionRemainderMail(
          parentEmail,
          {
            parentName, studentName, date, startTime, homeworkLink,
          },
        );
      }
    }
  });
  deleteJob();
};

export default scheduleB2BSessionHomeworkRemainder;
