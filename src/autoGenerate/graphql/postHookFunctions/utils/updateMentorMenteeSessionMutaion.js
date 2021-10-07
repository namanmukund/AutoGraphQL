import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const updateMentorMenteeSessionQuery = async (mentorMenteeSessionId, studentProfileId, input = {}) => {
//   input with sessionStatus is mandatory
  const query = `
  mutation($input: MentorMenteeSessionUpdate) {
    updateMentorMenteeSession(id: "${mentorMenteeSessionId}", 
    studentProfileConnectId: "${studentProfileId}",
    input: $input
    ) {
      id
    }
  }
  `;
  const variable = {
    input,
  };
  const result = await callLocalGraphqlApi(query, '', variable);
  return get(result, 'data.updateMentorMenteeSession', {});
};

export default updateMentorMenteeSessionQuery;
