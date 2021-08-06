import moment from 'moment';
import { get } from 'lodash';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';

const mentorSessionQuery = (id) => `{
  mentorSession(id: "${id}") {
    id
    user {
      name
      phone {
        countryCode
        number
      }
    }
  }
}`;

const sendSessionCancellationMessage = async (mentorSessionId, bookingDate, slotTimeStringArray, studentName, parentName) => {
  const mentorSession = await callLocalGraphqlApi(mentorSessionQuery(mentorSessionId));
  const slotNumber = Number(get(slotTimeStringArray, '0', '').replace('slot', ''));
  const sessionTime = getSlotLabel(slotNumber).startTime;
  const sessionDate = moment(bookingDate).format('dddd, Do MMMM');
  const mentorName = get(
    mentorSession,
    'data.mentorSession.user.name',
    '',
  );
  const mentorPhoneNumber = get(
    mentorSession,
    'data.mentorSession.user.phone.countryCode',
    '',
  ).replace('+', '') + get(
    mentorSession,
    'data.mentorSession.user.phone.number',
    '',
  );
  const sessionDateTime = new Date(
    new Date(
      bookingDate,
    ).setHours(slotNumber, 0, 0, 0),
  );
  if (moment().isBefore(moment(sessionDateTime).add(20, 'minutes'))) {
    sendWhatsAppTemplateMessage(mentorPhoneNumber, 'mentor_cancellation3', mentorName, [
      {
        name: 'session_date',
        value: sessionDate,
      },
      {
        name: 'session_time',
        value: sessionTime,
      },
      {
        name: 'student_name',
        value: studentName,
      },
      {
        name: 'parent_name',
        value: parentName,
      },
    ]);
  }
};

export default sendSessionCancellationMessage;
