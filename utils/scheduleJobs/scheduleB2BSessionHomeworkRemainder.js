/* eslint-disable no-loop-func */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const getBatchSessions = async () => {
  const dt = new Date().setHours(0, 0, 0, 0);
  const hourValue = new Date().getHours();
  const slotNo = hourValue > 0 ? hourValue - 1 : 23;
  const yesterday = new Date(dt);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayParsedDate = yesterday.toISOString();
  const dayBeforeYesterday = new Date(dt);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  const dayBeforeYesterdayParsedDate = dayBeforeYesterday.toISOString();
  const sessionDate = slotNo === 23 ? dayBeforeYesterdayParsedDate : yesterdayParsedDate;
  const query = `
 query{
    batchSessions(filter:{and:[
        {batch_some:{type:b2b}},
        {sessionStartDate:"${sessionDate}"},
        {slot${slotNo}:true},
        {sessionStatus_in:[completed, started]},
      ]}){
        id
        sessionStartDate
        topic {
            id
            courses {
              id
              title
            }
          }
        batch {
          school {
            code
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
  const batchSessions = get(res, 'data.batchSessions', []);
  return { batchSessions, sessionDate };
};
const isHomeworkSubmitted = async (topicId, courseId, sessionStartDate, userId) => {
  const sessionEndDate = new Date(sessionDate).setHours(23, 59, 59, 999);
  const parsedSessionEndDate = new Date(sessionEndDate).toISOString();
  const query = `
    query{
        mentorMenteeSessions(
            filter:{and:[
              {topic_some:{id:"${topicId}"}},
              {sessionStartDate_gte: "${sessionStartDate}"},
              {sessionStartDate_lte: "${parsedSessionEndDate}"},
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
  const isAssignmentSubmitted = get(mentorMenteeSessions, 'isSubmittedForReview', false);
  const menteeId = get(mentorMenteeSessions, 'studentProfile.user.id');
  if (menteeId && menteeId === userId && isAssignmentSubmitted) {
    return true;
  }
  return false;
};
const sendSessionRemainderMail = (email, sendEmailObject) => {
  const templateFileName = 'B2BHomework';
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
  );
  const emailTo = [email];
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Tekie - Maintain your Homework Streak!';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};
const scheduleB2BSessionHomeworkRemainder = async () => {
  const { batchSessions, sessionDate } = getBatchSessions();
  if (batchSessions && batchSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const batchSession of batchSessions) {
      const date = moment(get(batchSession, 'sessionStartDate')).format('D/MM/YY');
      const startTime = moment(get(batchSession, 'sessionStartDate')).format('HH:mm a');
      const topicId = get(batchSession, 'batch.topic.id');
      const courseId = get(batchSession, 'batch.courses')[0].id;
      const students = get(batchSession, 'batch.students');
      const schoolCode = get(batchSession, 'batch.school.code');
      const homeworkLink = schoolCode && schoolCode.length ? `https://${schoolCode}.tekie.in/homework` : `${process.env.TEKIE_WEB_URL}/homework`;
      const revisitLink = schoolCode && schoolCode.length ? `https://${schoolCode}.tekie.in/sessions` : `${process.env.TEKIE_WEB_URL}/sessions`;
      students.forEach((student) => {
        const studentName = get(student, 'user.studentProfile.user.name');
        const parentName = get(student, 'user.parentProfile.user.name');
        const studentId = get(student, 'user.studentProfile.user.id');
        const parentEmail = get(student, 'user.parentProfile.user.email');
        const parentPhone = get(student, 'user.parentProfile.user.phone.countryCode').split('+')[1] + get(student, 'user.parentProfile.user.phone.number');
        if (isHomeworkSubmitted(topicId, courseId, sessionDate, studentId)) {
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
          sendSessionRemainderMail(
            parentEmail,
            {
              parentName, studentName, date, startTime, homeworkLink,
            },
          );
        }
      });
    }
  }
};

export default scheduleB2BSessionHomeworkRemainder;
