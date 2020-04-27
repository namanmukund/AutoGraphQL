import { get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../graphqlQueries/updateAvailableSlotQuery';

const deleteMentorSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted remove corresponding availability slots
   */
  const { previousDocument } = context;
  const { availabilityDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(availabilityDate));
  const availableSlots = get(availableSlotsRes, 'data.availableSlots');
  // update if doc exist else leave
  if (availableSlots && availableSlots.length) {
    const docToBeUpdated = {};

    slotTimeStringArray.forEach((slot) => {
      if (availableSlots[0][slot] > 0) {
        docToBeUpdated[slot] = availableSlots[0][slot] - 1;
      }
    });

    const { id: availableSlotId } = availableSlots[0];
    const variables = {
      input: docToBeUpdated,
    };
    await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
  }
};

export default deleteMentorSessionPostHookMethod;
