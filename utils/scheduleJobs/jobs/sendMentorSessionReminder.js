import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../../src/autoGenerate/graphql/preHookFunctions/validation/utils/getSelectedSlotsTime';
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import getSlotTimesInString from '../../getSlotTimesInString';
import getIntlDateTime from '../../timeZoneDiff';

const mentorMenteeSessionQuery = (mentorMenteeSessionId) => `{
  mentorMenteeSession(id: "${mentorMenteeSessionId}") {
    id
    course {
      title
    }
    mentorSession {
      id
      user {
        phone {
          number
          countryCode
        }
        mentorProfile {
          sessionLink
        }
      }
    }
    menteeSession {
      id
      ${getSlotTimesInString()}
      bookingDate
      user {
        name
        studentProfile {
          grade
          parents {
            user {
              name
              email
              phone {
                number
              }
            }
          }
        }
      }
    }
  }
}`;

const sendMentorSessionReminder = async ({ mentorMenteeSessionId }, deleteJob) => {
  const res = await callLocalGraphqlApi(mentorMenteeSessionQuery(mentorMenteeSessionId));
  const mms = get(res, 'data.mentorMenteeSession', {});
  if (!get(mms, 'id') || !get(mms, 'mentorSession')) return;
  const courseName = get(mms, 'course.title', '');
  const sessionLink = get(mms, 'mentorSession.user.mentorProfile.sessionLink', '');
  const mentorPhone = get(mms, 'mentorSession.user.phone', {});
  const user = get(mms, 'menteeSession.user', {});
  const { bookingDate, ...slots } = get(mms, 'menteeSession', {});
  const slotNumber = getSelectedSlotsTime(slots)[0];
  const { dateObject, startTime } = getIntlDateTime(bookingDate, slotNumber, 'Asia/Kolkata');
  const date = moment(dateObject).format('dddd, Do MMMM');

  const parent = get(user, 'studentProfile.parents[0].user', {});
  const { name: studentName } = get(mms, 'menteeSession.user', {});
  const { name: parentName, email, phone } = parent;
  const menteePhone = get(phone, 'countryCode', '').replace('+', '') + get(phone, 'number', '');
  const grade = get(user, 'studentProfile.grade', '');
  sendWhatsAppTemplateMessage(
    get(mentorPhone, 'countryCode', '').replace('+', '') + get(mentorPhone, 'number', ''),
    'mentor_reminder_b2c',
    parentName,
    [
      {
        name: 'course',
        value: courseName,
      },
      {
        name: 'session_link',
        value: sessionLink || '-',
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
        name: 'parent_name',
        value: parentName,
      },
      {
        name: 'email',
        value: email,
      },
      {
        name: 'grade',
        value: grade.replace('Grade', ''),
      },
      {
        name: 'number',
        value: menteePhone,
      },
    ],
  );
  deleteJob();
};

export default sendMentorSessionReminder;
