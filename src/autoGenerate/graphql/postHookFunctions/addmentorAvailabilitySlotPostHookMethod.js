import { get } from 'lodash';
import sendMailAndWhatsappMessageForSupplyRequest from '../../utils/sendMailAndWhatsappMessageForSupplyRequest';

const addMentorAvailabilitySlotPostHookMethod = async (input) => {
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
};

export default addMentorAvailabilitySlotPostHookMethod;
