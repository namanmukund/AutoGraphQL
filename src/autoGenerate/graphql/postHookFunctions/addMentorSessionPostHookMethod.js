import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import availableSlotsQuery from '../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../graphqlQueries/updateAvailableSlotQuery';
import addAvailableSlotQuery from '../graphqlQueries/addAvailableSlotQuery';
import { backendApps } from '../../../../constants';

const addMentorSessionPostHookMethod = async (input, mutationName, context) => {
  const {
    sessionType, country, availabilityDate, ...slots
  } = input;
  if (sessionType && (sessionType === 'paid' || sessionType === 'batch')) {
    return true;
  }

  // don't increase the availability slot if it is done through backend
  const { appName } = context;
  if (backendApps.includes(appName)) {
    return true;
  }

  const availableSlotsRes = await callLocalGraphqlApi(
    availableSlotsQuery(
      availabilityDate,
      country,
    ),
  );
  const availableSlots = get(availableSlotsRes, 'data.availableSlots');

  // update if available slots for a particular date exist from before
  const docToBeUpdated = {};
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  if (availableSlots && availableSlots.length) {
    slotTimeStringArray.forEach((slot) => {
      docToBeUpdated[slot] = (availableSlots[0][slot] >= 0 ? availableSlots[0][slot] : 0) + 1;
    });

    const { id: availableSlotId } = availableSlots[0];
    const variables = {
      input: docToBeUpdated,
    };

    await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
    // update
  } else {
    slotTimeStringArray.forEach((slot) => {
      docToBeUpdated[slot] = 1;
      docToBeUpdated.date = availabilityDate.toISOString();
      docToBeUpdated.country = country;
    });
    // add
    const variables = {
      input: docToBeUpdated,
    };
    await callLocalGraphqlApi(addAvailableSlotQuery(docToBeUpdated), context, variables);
  }
  return true;
};

export default addMentorSessionPostHookMethod;
