import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../../graphqlQueries/updateAvailableSlotQuery';

// update if doc exist else leave
const increaseParticularAvailableSlotOfADate = async (
  slotTimeStringArray,
  date,
  context,
  availableSlots,
  country,
) => {
  if (!availableSlots || !availableSlots.length) {
    const availableSlotsRes = await callLocalGraphqlApi(
      availableSlotsQuery(
        date,
        country,
      ),
    );
    // eslint-disable-next-line no-param-reassign
    availableSlots = get(availableSlotsRes, 'data.availableSlots');
  }
  // update if doc exist else leave
  if (availableSlots && availableSlots.length) {
    const docToBeUpdated = {};

    slotTimeStringArray.forEach((slot) => {
      docToBeUpdated[slot] = (availableSlots[0][slot] >= 0 ? availableSlots[0][slot] : 0) + 1;
    });

    const { id: availableSlotId } = availableSlots[0];
    const variables = {
      input: docToBeUpdated,
    };
    await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
  }
  return true;
};

export default increaseParticularAvailableSlotOfADate;
