import { get } from 'lodash';
import { backendApps } from '../../../../constants';
import sendMailAndWhatsappMessageForSupplyRequest from '../../utils/sendMailAndWhatsappMessageForSupplyRequest';

const addMentorAvailabilitySlotPostHookMethod = async (input, params, mutationName, context) => {
  const { appName } = context;
  if (backendApps.includes(appName)) {
    return true;
  }
  const { broadCastedMentors = [] } = input;
  if (broadCastedMentors.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorProfile of broadCastedMentors) {
      if (mentorProfile && mentorProfile.typeId) {
        sendMailAndWhatsappMessageForSupplyRequest(mentorProfile.typeId,
          { date: get(input, 'date'), time: get(input, 'slotName'), slotId: get(input, 'id') });
      }
    }
  }
  return true;
};

export default addMentorAvailabilitySlotPostHookMethod;
