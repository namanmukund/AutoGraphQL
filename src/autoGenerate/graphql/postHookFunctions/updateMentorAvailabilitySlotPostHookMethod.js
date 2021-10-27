import { get } from 'lodash';
import { backendApps } from '../../../../constants';
import sendMailAndWhatsappMessageForSupplyRequest from '../../utils/sendMailAndWhatsappMessageForSupplyRequest';

const updateMentorAvailabilitySlotPostHookMethod = async (input, params, mutationName, context) => {
  const { appName } = context;
  if (backendApps.includes(appName)) {
    return true;
  }
  const { broadCastedMentors = [] } = input;
  const { prevBroadCastedMentorsConnectIds = [] } = context;
  const prevBroadCastedMentorsIds = prevBroadCastedMentorsConnectIds.map((mentor) => get(mentor, 'id'));
  // eslint-disable-next-line no-restricted-syntax
  for (const mentorProfile of broadCastedMentors) {
    if (!prevBroadCastedMentorsIds.includes(get(mentorProfile, 'typeId'))) {
      sendMailAndWhatsappMessageForSupplyRequest(get(mentorProfile, 'typeId'),
        { date: get(input, 'date'), time: get(input, 'slotName'), slotId: get(input, 'id') });
    }
  }
  return true;
};

export default updateMentorAvailabilitySlotPostHookMethod;
