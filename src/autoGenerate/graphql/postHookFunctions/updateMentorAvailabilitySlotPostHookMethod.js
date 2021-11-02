import { get } from 'lodash';
import { backendApps } from '../../../../constants';
import getSlotLabel from '../../../../utils/getSlotLabel';
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
      const time = get(input, 'slotName').split('slot')[1];
      const startTime = getSlotLabel(time).startTime;
      sendMailAndWhatsappMessageForSupplyRequest(get(mentorProfile, 'typeId'),
        { date: get(input, 'date'), slotsTime: startTime, slotId: get(input, 'id') });
    }
  }
  return true;
};

export default updateMentorAvailabilitySlotPostHookMethod;
