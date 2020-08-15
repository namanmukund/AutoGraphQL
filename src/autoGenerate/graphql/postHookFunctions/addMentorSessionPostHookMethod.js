import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import availableSlotsQuery from '../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../graphqlQueries/updateAvailableSlotQuery';
import addAvailableSlotQuery from '../graphqlQueries/addAvailableSlotQuery';
import getSlotCountByProductType from './utils/getSlotCountByProductType';

const addMentorSessionPostHookMethod = async (input, mutationName, context) => {
  const { availabilityDate, slotType, ...slots } = input;
  const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(availabilityDate));
  const availableSlots = get(availableSlotsRes, 'data.availableSlots');

  // update if available slots for a particular date exist from before
  const docToBeUpdated = {};
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const slotCount = getSlotCountByProductType(slotType);
  if (availableSlots && availableSlots.length) {
    slotTimeStringArray.forEach((slot) => {
      docToBeUpdated[slot] = (availableSlots[0][slot] >= 0 ? availableSlots[0][slot] : 0) + slotCount;
    });

    const { id: availableSlotId } = availableSlots[0];
    const variables = {
      input: docToBeUpdated,
    };

    await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
    // update
  } else {
    slotTimeStringArray.forEach((slot) => {
      docToBeUpdated[slot] = slotCount;
      docToBeUpdated.date = availabilityDate.toISOString();
    });
    // add
    const variables = {
      input: docToBeUpdated,
    };

    await callLocalGraphqlApi(addAvailableSlotQuery(docToBeUpdated), context, variables);
  }
};

export default addMentorSessionPostHookMethod;
