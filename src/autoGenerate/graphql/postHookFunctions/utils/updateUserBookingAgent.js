import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const updateUserBookingAgent = async (userId, bookingAgentId) => {
  const query = `
    mutation {
      updateUser(
        id: "${userId}",
        bookingAgentConnectId: "${bookingAgentId}"
        input: {}
      ) {
        id
      }
    }
  `;
  await callLocalGraphqlApi(query);
};

export const fetchAgentName = async (id) => {
  const query = `
  {
    user(id: "${id}") {
      name
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user.name');
};

export default updateUserBookingAgent;
