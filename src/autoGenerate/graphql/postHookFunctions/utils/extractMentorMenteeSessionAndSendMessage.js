import { get, startCase, toLower } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getFormatedDate from '../../../../../utils/getFormatedDate';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import getLongDate from '../../../../../utils/getLongDate';
import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';

const mentorInfoQuery = (mentorSessionId) => `
  query{
    mentorSession(id: "${mentorSessionId}"){
      user{
        id
        name
        phone{
          number
          countryCode
        }
      }
    }
  }
`;

const extractMentorMenteeSessionAndSendMessage = async (
  bookingDate,
  slotTimeStringArray,
  mentorSessionId,
  user,
  topic,
) => {
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const { startTime, endTime } = getSlotLabel(slotNumber);
  const menteeInfo = get(user, 'data.user');
  const parentInfo = get(menteeInfo, 'studentProfile.parents[0].user');

  const menteeObj = {
    date: getFormatedDate(bookingDate),
    startTime,
    endTime,
    name: startCase(toLower(get(menteeInfo, 'name') || '')),
    grade: get(menteeInfo, 'studentProfile.grade') || '',
    parentName: startCase(toLower(get(parentInfo, 'name') || '')),
    parentEmail: get(parentInfo, 'email') || '',
    parentNumber: get(parentInfo, 'phone.number') || '',
    countryCode: get(parentInfo, 'phone.countryCode') || '',
  };
  menteeObj.topicTitle = get(topic, 'data.topic.title');

  const mentorInfo = await callLocalGraphqlApi(mentorInfoQuery(mentorSessionId));
  const mentorObj = {
    name: startCase(toLower(get(mentorInfo, 'data.mentorSession.user.name') || '')),
    phoneNumber: get(mentorInfo, 'data.mentorSession.user.phone.number') || '',
    countryCode: get(mentorInfo, 'data.mentorSession.user.phone.countryCode') || '',
  };

  // send email
  if (process.env.NODE_ENV === 'production') {
    if (get(topic, 'data.topic.order') === 1) {
      // send whatsapp emailTemplate message
      const {
        parentName, parentNumber, countryCode, name, grade, parentEmail,
      } = menteeObj;
      const {
        name: mentorName, phoneNumber: mentorPhoneNumber, countryCode: mentorCountryCode,
      } = mentorObj;

      const parameters = [{
        name: 'parent_name',
        value: parentName,
      },
      {
        name: 'student_name',
        value: name,
      },
      {
        name: 'session_date',
        value: getLongDate(bookingDate),
      },
      {
        name: 'session_time',
        value: startTime,
      },
      {
        name: 'number',
        value: `${countryCode}-${parentNumber}`,
      },
      {
        name: 'grade',
        value: grade,
      },
      {
        name: 'email',
        value: parentEmail,
      },
      ];
      const phone = mentorCountryCode.split('+')[1] + mentorPhoneNumber;

      await sendWhatsAppTemplateMessage(
        phone,
        transactionalMessageBody.mentorSessionNotification,
        mentorName,
        parameters,
      );
    }
  }
};

export default extractMentorMenteeSessionAndSendMessage;
