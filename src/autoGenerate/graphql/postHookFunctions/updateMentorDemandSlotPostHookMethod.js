/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { backendApps } from '../../../../constants';
import getSlotLabel from '../../../../utils/getSlotLabel';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import sendMailAndWhatsappMessageForSupplyRequest from '../../utils/sendMailAndWhatsappMessageForSupplyRequest';

const getmentorAvailabilitySlot = async (id) => {
  const query = `{
  mentorAvailabilitySlot(id: "${id}") {
    id
    slotName
    date
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorAvailabilitySlot');
};

const updateMentorDemandSlotPostHookMethod = async (input, params, mutationName, context) => {
  const { appName, prevDemandSlot } = context;
  if (backendApps.includes(appName)) {
    return true;
  }
  const { broadCastedMentors = [], slots = [] } = input;
  const prevMentorAvailabilitySlot = get(prevDemandSlot, 'slots', []);
  const prevBroadCastedMentorsConnectIds = get(prevDemandSlot, 'broadCastedMentors', []);
  let slotsTime = '';
  if (slots.length > 0) {
    const prevAddedSlots = prevMentorAvailabilitySlot.map((slot) => get(slot, 'id'));
    for (const slot of slots) {
      if (!prevAddedSlots.includes(get(slot, 'typeId'))) {
        const slotDetails = await getmentorAvailabilitySlot(get(slot, 'typeId'));
        const time = get(slotDetails, 'slotName').split('slot')[1];
        const startTime = getSlotLabel(time).startTime;
        slotsTime += `${startTime} `;
      }
    }
  }
  if (broadCastedMentors.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    const prevBroadCastedMentors = prevBroadCastedMentorsConnectIds.map((mentor) => get(mentor, 'id'));
    for (const mentorProfile of broadCastedMentors) {
      if (!prevBroadCastedMentors.includes(get(mentorProfile, 'typeId'))) {
        sendMailAndWhatsappMessageForSupplyRequest(get(mentorProfile, 'typeId'),
          {
            date: get(input, 'date'),
            slotId: get(input, 'id'),
            slotsTime,
            type: 'singleDay',
          });
      }
    }
  }
  return true;
};

export default updateMentorDemandSlotPostHookMethod;
