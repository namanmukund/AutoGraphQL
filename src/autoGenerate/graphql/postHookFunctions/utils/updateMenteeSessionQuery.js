import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const updateMenteeSessionQuery = async (menteeSessionId, studentProfileId, input = {}, bookingAgentId = '') => {
//   input with bookingDate is mandatory
  const query = `
mutation($input: MenteeSessionUpdate) {
  updateMenteeSession(id: "${menteeSessionId}", studentProfileConnectId: "${studentProfileId}", input: $input,
  ${bookingAgentId ? `bookingAgentConnectId: "${bookingAgentId}"` : ''}) {
    id
  }
}
  `;
  const variable = {
    input,
  };
  const result = await callLocalGraphqlApi(query, '', variable);
  return get(result, 'data.updateMenteeSession', {});
};

export default updateMenteeSessionQuery;
