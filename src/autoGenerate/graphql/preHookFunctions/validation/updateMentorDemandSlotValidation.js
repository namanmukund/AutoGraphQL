import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { getUserIdandAppNameAfterValidation } from './utils';

const getMentorDemandSlot = async (id) => {
  const query = `{
  mentorDemandSlot(id: "${id}") {
    id
    slots {
      id
    }
    broadCastedMentors {
      id
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorDemandSlot');
};

const updateMentorDemandSlotValidation = async (params, mutationOrQueryName, context) => {
  const { id: mentorDemandSlotId } = params;
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
  } = userAndAppInfo;
  context.appName = appName;
  const mentorDemandSlot = await getMentorDemandSlot(mentorDemandSlotId);
  if (get(mentorDemandSlot, 'broadCastedMentors', []).length > 0) {
    context.prevDemandSlot = mentorDemandSlot;
  }
  return true;
};

export default updateMentorDemandSlotValidation;
