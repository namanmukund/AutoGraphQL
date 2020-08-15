import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../../graphqlQueries/updateAvailableSlotQuery';

// update if doc exist else leave
const reduceParticularAvailableSlotOfADate = async (
  slotTimeStringArray,
  date,
  context,
  availableSlots,
  slotCount = 1,
) => {
  if (!availableSlots || !availableSlots.length) {
    const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(date));
    // eslint-disable-next-line no-param-reassign
    availableSlots = get(availableSlotsRes, 'data.availableSlots');
  }
  // update if doc exist else leave
  if (availableSlots && availableSlots.length) {
    const docToBeUpdated = {};

    slotTimeStringArray.forEach((slot) => {
      if (availableSlots[0][slot] > 0) {
        docToBeUpdated[slot] = availableSlots[0][slot] - slotCount;
      }
    });

    const { id: availableSlotId } = availableSlots[0];
    const variables = {
      input: docToBeUpdated,
    };
    await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
  }
  return true;
};

export default reduceParticularAvailableSlotOfADate;
