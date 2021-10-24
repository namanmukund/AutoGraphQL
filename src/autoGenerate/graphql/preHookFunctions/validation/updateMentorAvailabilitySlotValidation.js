import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getmentorAvailabilitySlot = async (id) => {
  const query = `{
  mentorAvailabilitySlot(id: "${id}") {
    id
    broadCastedMentors {
      id
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorAvailabilitySlot');
};

const updateMentorAvailabilitySlotValidation = async (params, mutationOrQueryName, context) => {
  const { id: mentorAvailabilitySlotId } = params;
  const mentorAvailabilitySlot = await getmentorAvailabilitySlot(mentorAvailabilitySlotId);
  if (get(mentorAvailabilitySlot, 'broadCastedMentors', []).length > 0) {
    context.prevBroadCastedMentorsConnectIds = get(mentorAvailabilitySlot, 'broadCastedMentors', []);
  }
  return true;
};

export default updateMentorAvailabilitySlotValidation;
