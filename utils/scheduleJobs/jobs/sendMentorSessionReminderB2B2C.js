import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const batchSessionQuery = (id) => `{
  batchSession(id: "${id}") {
    id
    batch {
      allottedMentor {
        id
      }
    }
  }
}`;

const sendMentorSessionReminderB2B2C = async ({
  batchSessionId,
  courseName,
  batchCode,
  schoolName,
  sessionDate,
  sessionTime,
  sessionLink,
  mentorPhoneNumber,
  mentorUserId,
}, deleteJob) => {
  const res = await callLocalGraphqlApi(batchSessionQuery(batchSessionId));
  const batchSession = get(res, 'data.batchSession', {});
  if (!get(batchSession, 'id')) return;
  if (mentorUserId !== get(batchSession, 'batch.allottedMentor.id')) return;
  sendWhatsAppTemplateMessage(
    mentorPhoneNumber,
    'mentor_reminder_b2b2c',
    mentorPhoneNumber,
    [
      {
        name: 'course',
        value: courseName,
      },
      {
        name: 'batch_code',
        value: batchCode,
      },
      {
        name: 'school_name',
        value: schoolName,
      },
      {
        name: 'w_date',
        value: sessionDate,
      },
      {
        name: 'w_time',
        value: sessionTime,
      },
      {
        name: 'session_link',
        value: sessionLink,
      },
    ],
  );
  deleteJob();
};

export default sendMentorSessionReminderB2B2C;
