import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const updateUserBookingAgent = async (menteeSessionId, bookingAgentId, bookingDate, slot) => {
  const query = `
    mutation {
      updateMenteeSession(
        id: "${menteeSessionId}",
        bookingAgentConnectId: "${bookingAgentId}"
        input: {
          bookingDate: "${bookingDate}"
          ${slot}:true
        }
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
