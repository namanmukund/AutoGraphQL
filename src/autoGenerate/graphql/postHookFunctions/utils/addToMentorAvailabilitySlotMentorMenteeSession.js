import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const addToMentorAvailabilitySlotMentorMenteeSession = async (mentorMenteeSessionId, mentorAvailabilitySlotId) => {
  const query = `
  mutation {
  addToMentorAvailabilitySlotMentorMenteeSession(
    mentorMenteeSessionId: "${mentorMenteeSessionId}"
    mentorAvailabilitySlotId: "${mentorAvailabilitySlotId}"
  ) {
    mentorMenteeSession {
      id
    }
  }
}

  `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.addToMentorAvailabilitySlotMentorMenteeSession', {});
};

export default addToMentorAvailabilitySlotMentorMenteeSession;
