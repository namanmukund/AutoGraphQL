import { get } from 'lodash';
import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
// import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import sendTransactionalEmail from '../../resolvers/utils/sendTransactionalEmail';
import updateBookSessionReminderStatus from './updateBookSessionReminderStatus';

const menteeSessionQuery = (userId) => `
  query {
    menteeSessions(filter: {
      user_some: {
        id: "${userId}"
      }
    }) {
      id
      topic {
        id
      }
      user {
        id
        isBookSessionReminderSent
      }
    }
  }
`;

const sendBookingReminder = async (input, params) => {
  const studentName = get(params, 'input.childName');
  const children = get(input, 'children', []);
  const child = children.find((student) => get(student, 'name') === studentName);
  const studentId = get(
    child,
    'id',
  );
  const res = await callLocalGraphqlApi(
    menteeSessionQuery(studentId),
  );
  const menteeSessions = get(res, 'data.menteeSessions', []);
  // const phone = get(input, 'phone.countryCode', '').replace('+', '') + get(input, 'phone.number');
  const country = get(input, 'country') ? get(input, 'country', 'india') : 'india';
  const parentName = get(input, 'name', '');
  const parentEmail = get(input, 'email', '');
  // const parameters = [
  //   {
  //     name: 'parent_name',
  //     value: parentName,
  //   },
  //   {
  //     name: 'student_name',
  //     value: studentName,
  //   },
  // ];
  if (menteeSessions.length === 0 && country !== 'india') {
    // sendWhatsAppTemplateMessage(
    //   phone,
    //   transactionalMessageBody.demoNotBooked.whatsAppTemplate,
    //   parentName,
    //   parameters,
    // );
    sendTransactionalEmail({
      parentEmail,
      studentName,
      parentName,
    }, transactionalMessageBody.demoNotBooked);
    updateBookSessionReminderStatus(studentId, true);
  }
};

export default sendBookingReminder;
