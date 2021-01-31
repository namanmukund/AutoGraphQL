import { get } from 'lodash';
import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';

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
    }
  }
`;

const sendBookingReminder = async (input, params) => {
  const studentName = get(params, 'input.childName');
  const children = get(input, 'children', []);
  const child = children.find((child) => get(child, 'child.name') === studentName);
  const studentId = get(
    child,
    'id',
  );
  const res = await callLocalGraphqlApi(
    menteeSessionQuery(studentId),
  );
  const menteeSessions = get(res, 'data.menteeSessions', []);
  const phone = get(input, 'phone.countryCode', '').replace('+', '') + get(input, 'phone.number');
  const country = get(input, 'country') ? get(input, 'country', 'india') : 'india';
  const parentName = get(input, 'name', '');
  const parameters = [
    {
      name: 'parent_name',
      value: parentName,
    },
    {
      name: 'student_name',
      value: studentName,
    },
  ];
  if (menteeSessions.length === 0 && country !== 'india') {
    sendWhatsAppTemplateMessage(
      phone,
      transactionalMessageBody.usNotBookedWelcomeMessage,
      parentName,
      parameters,
    );
  }
};

export default sendBookingReminder;
