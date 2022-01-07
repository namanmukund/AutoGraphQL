import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';

const eventSessionQuery = (id) => `{
    eventSessions(id: "${id}") {
      id
      event {
        eventName
      }
      sessionDate
      sessionLink
      meetingId
      meetingPassword
      attendance {
          student {
              user {
                  phone {
                    number
                  }
              }
          }
      }
    }
  }`;
const sendEventRemainderComms = async ({ eventSessionId }, deleteJob) => {
  const res = await callLocalGraphqlApi(eventSessionQuery(eventSessionId));
  const eventSession = get(res, 'data.eventSession', {});
  if (!get(eventSession, 'id')) return;
  if (!get(eventSession, 'attendence.user.phoneNumber')) return;
  const attendeters = get(eventSession, 'student.user.phoneNumber');
  attendeters.forEach((attender) => {
    sendWhatsAppTemplateMessage(
      get(attender, 'user.phoneNumber'),
      'session_notification',
      get(attender, 'user.phoneNumber'),
      [
        {
          name: 'event_name',
          value: get(eventSession, 'event.eventName'),
        },
        {
          name: 'session_date',
          value: get(eventSession, 'sessionDate'),
        },
        {
          name: 'session_link',
          value: get(eventSession, 'sessionLink'),
        },
        {
          name: 'meeting_id',
          value: get(eventSession, 'meetingId'),
        },
        {
          name: 'meeting_password',
          value: get(eventSession, 'meetingPassword'),
        },
      ],
    );
  });
  deleteJob();
};

export default sendEventRemainderComms;
