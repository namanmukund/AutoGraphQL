import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { getUserIdandAppNameAfterValidation } from './utils';

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
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
  } = userAndAppInfo;
  context.appName = appName;
  const mentorAvailabilitySlot = await getmentorAvailabilitySlot(mentorAvailabilitySlotId);
  if (get(mentorAvailabilitySlot, 'broadCastedMentors', []).length > 0) {
    context.prevBroadCastedMentorsConnectIds = get(mentorAvailabilitySlot, 'broadCastedMentors', []);
  }
  return true;
};

export default updateMentorAvailabilitySlotValidation;
