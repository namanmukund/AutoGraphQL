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

const addMentorDemandSlotPostHookMethod = async (input, params, mutationName, context) => {
  const { appName } = context;
  if (backendApps.includes(appName)) {
    return true;
  }
  const { broadCastedMentors = [], slots = [] } = input;
  let slotsTime = '';
  if (slots.length > 0) {
    for (const slot of slots) {
      const slotDetails = await getmentorAvailabilitySlot(get(slot, 'typeId'));
      const time = get(slotDetails, 'slotName').split('slot')[1];
      const startTime = getSlotLabel(time).startTime;
      slotsTime += `${startTime} `;
    }
  }
  if (broadCastedMentors.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorProfile of broadCastedMentors) {
      sendMailAndWhatsappMessageForSupplyRequest(get(mentorProfile, 'typeId'),
        {
          date: get(input, 'date'),
          slotId: get(input, 'id'),
          slotsTime,
          type: 'singleDay',
        });
    }
  }
  return true;
};

export default addMentorDemandSlotPostHookMethod;
