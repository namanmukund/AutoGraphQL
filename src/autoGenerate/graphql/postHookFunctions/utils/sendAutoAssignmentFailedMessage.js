/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';

const fetchMsmUsers = async () => {
  const query = `
    {
      users(filter: {
        and: {
          role_in:[supplyManager]
        }
      }){
        id
        phone{
          number
          countryCode
        }
      }
    }
    `;
  const users = await callLocalGraphqlApi(query);
  return get(users, 'data.users', []);
};

const sendAutoAssignmentFailedMessage = (userInfo) => {
  // logic to send message to MSM
  const studentName = get(userInfo, 'data.user.name', '');
  const parentName = get(userInfo, 'data.user.studentProfile.parents[0].user.name');
  const parentNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.countryCode', '').replace('+', '') + get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number', '');
  const msmUsers = fetchMsmUsers();
  for (const msmUser of msmUsers) {
    const msmPhoneNumber = get(
      msmUser,
      'phone.countryCode',
      '',
    ).replace('+', '') + get(
      msmUser,
      'phone.number',
      '',
    );
    sendWhatsAppTemplateMessage(msmPhoneNumber, 'demo_cancelled_mentor', mentorName, [
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
      {
        name: 'number',
        value: parentNumber,
      },
    ]);
  }
};

export default sendAutoAssignmentFailedMessage;
