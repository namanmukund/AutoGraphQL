import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const addToMentorMenteeSessionStudentProfile = async (mentorMenteeSessionId, studentProfileId, bookingAgentId) => {
  const query = `
  mutation {
  addToMentorMenteeSessionStudentProfile(
    mentorMenteeSessionId: "${mentorMenteeSessionId}"
    studentProfileId: "${studentProfileId}"
  ) {
    mentorMenteeSession {
      id
    }
  }
  ${bookingAgentId ? `addToMentorMenteeSessionBookingAgent(mentorMenteeSessionId: "${mentorMenteeSessionId}", userId: "${bookingAgentId}") {
    user {
      id
    }
  }` : ''}
}
  `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.addToMentorMenteeSessionStudentProfile', {});
};

export default addToMentorMenteeSessionStudentProfile;
