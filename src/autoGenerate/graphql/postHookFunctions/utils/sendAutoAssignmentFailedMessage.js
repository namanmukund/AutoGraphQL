/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
// import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';

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

const addNotification = async (context, input, userIds) => {
  const query = `
  mutation{
    addNotification(
      input:{
        title: "${input.title}"
      }
      toConnectIds: ${userIds}
    ){
      id
    }
  }
`;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.addNotification.id');
};

// toConnectIds: ["ckvg63ilu00010tu003ls3pta","ckvi200w7000e0tw5b5lwapuz","ckvj7fnkk0001lwujfut506we",]
const sendAutoAssignmentFailedMessage = async (context) => {
  // logic to send message to MSM
  // const studentName = get(userInfo, 'data.user.name', '');
  // const parentName = get(userInfo, 'data.user.studentProfile.parents[0].user.name');
  // const parentNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.countryCode', '').replace('+', '') + get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number', '');
  // console.log('inside sendAutoAssignmentFailedMessage');
  const msmUsers = await fetchMsmUsers();
  // send notification to MSM
  const notificationInput = {
    title: 'Mentor Un-assigned',
  };
  const userIds = [];
  let userIdString = '[';
  for (const msmUser of msmUsers) {
    userIds.push(get(msmUser, 'id'));
    userIdString += `"${get(msmUser, 'id')}",`;
  }
  userIdString += ']';
  await addNotification(context, notificationInput, userIdString);
};

export default sendAutoAssignmentFailedMessage;
