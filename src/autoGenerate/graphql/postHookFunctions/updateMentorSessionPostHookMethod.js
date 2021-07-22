import { get, difference } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../graphqlQueries/updateAvailableSlotQuery';
import addAvailableSlotQuery from '../graphqlQueries/addAvailableSlotQuery';
import { byPassMenteeValidationApps } from '../../../../constants';

const updateMentorSessionPostHookMethod = async (input, mutationName, context) => {
  const { sessionType, availabilityDate, ...slots } = input;
  if (sessionType && (sessionType === 'paid' || sessionType === 'batch')) {
    return true;
  }

  const { previousDocument, appName } = context;

  // don't increase the availability slot if it is done through backend
  if (byPassMenteeValidationApps.includes(appName)) {
    return true;
  }

  const { availabilityDate: prevAvailabilityDate, ...prevSlots } = previousDocument;
  const prevSlotTimeStringArray = getSelectedSlotsStringArray(prevSlots);

  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  /* if a mentor has changed the date to future
    --remove the availability slot from the prevAvailabilityDate
    -- update the availability slot of current availabilityDate
    if a mentor has changed the slots of the current date
    ---add for new slots and remove for old slots
   */
  const currentAvailableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(availabilityDate));
  const currentAvailableSlots = get(currentAvailableSlotsRes, 'data.availableSlots', []);

  if (availabilityDate && availabilityDate.getTime() !== prevAvailabilityDate.getTime()) {
    // --remove the availability slot from the prevAvailabilityDate
    const prevAvailableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(prevAvailabilityDate));
    const prevAvailableSlots = get(prevAvailableSlotsRes, 'data.availableSlots');
    // if prevAvailableSlots document exist then update else do nothing
    if (prevAvailableSlots && prevAvailableSlots.length) {
      const prevDocToBeUpdated = {};
      prevSlotTimeStringArray.forEach((prevSlot) => {
        if (prevAvailableSlots[0][prevSlot] > 0) {
          prevDocToBeUpdated[prevSlot] = prevAvailableSlots[0][prevSlot] - 1;
        }
      });

      const { id: availableSlotId } = prevAvailableSlots[0];
      const variables = {
        input: prevDocToBeUpdated,
      };

      await callLocalGraphqlApi(updateAvailableSlotQuery(availableSlotId), context, variables);
    }
    //  -- update the availability slot of current availabilityDate
    const currentDocToBeUpdated = {};
    // if prevAvailableSlots document exist then update else add as it is a new date
    if (currentAvailableSlots && currentAvailableSlots.length) {
      slotTimeStringArray.forEach((currentSlot) => {
        currentDocToBeUpdated[currentSlot] = (currentAvailableSlots[0][currentSlot] >= 0 ? currentAvailableSlots[0][currentSlot] : 0) + 1;
      });

      const { id: currentSlotAvailableSlotId } = currentAvailableSlots[0];
      const variables = {
        input: currentDocToBeUpdated,
      };

      await callLocalGraphqlApi(updateAvailableSlotQuery(currentSlotAvailableSlotId), context, variables);
    } else {
      const docToBeAdded = {};
      slotTimeStringArray.forEach((slot) => {
        docToBeAdded[slot] = 1;
        docToBeAdded.date = availabilityDate.toISOString();
      });
      // add
      const variables = {
        input: docToBeAdded,
      };
      await callLocalGraphqlApi(addAvailableSlotQuery(docToBeAdded), context, variables);
    }
  } else {
    /*
 if a mentor has changed the slots of the current date
    ---add for new slots and remove for old slots
 */
    const docForUpdate = {};
    const slotsToBeDecreasedInUpdate = difference(prevSlotTimeStringArray, slotTimeStringArray);
    const slotsToBeIncreasedInUpdate = difference(slotTimeStringArray, prevSlotTimeStringArray);

    if (slotsToBeDecreasedInUpdate && slotsToBeDecreasedInUpdate.length
      && currentAvailableSlots && currentAvailableSlots.length) {
      slotsToBeDecreasedInUpdate.forEach((slot) => {
        if (currentAvailableSlots[0][slot] > 0) {
          docForUpdate[slot] = currentAvailableSlots[0][slot] - 1;
        }
      });
    }
    if (slotsToBeIncreasedInUpdate && slotsToBeIncreasedInUpdate.length
      && currentAvailableSlots && currentAvailableSlots.length) {
      slotsToBeIncreasedInUpdate.forEach((slot) => {
        docForUpdate[slot] = (currentAvailableSlots[0][slot] >= 0 ? currentAvailableSlots[0][slot] : 0) + 1;
      });
    }

    if (currentAvailableSlots && currentAvailableSlots.length) {
      const { id: currentSlotAvailableSlotId } = currentAvailableSlots[0];
      const variables = {
        input: docForUpdate,
      };
      if (Object.keys(docForUpdate).length) {
        await callLocalGraphqlApi(updateAvailableSlotQuery(currentSlotAvailableSlotId), context, variables);
      }
    }
  }
  return true;
};

export default updateMentorSessionPostHookMethod;
