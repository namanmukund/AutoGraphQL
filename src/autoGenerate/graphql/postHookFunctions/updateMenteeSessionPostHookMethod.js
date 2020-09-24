import { get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import increaseParticularAvailableSlotOfADate from './utils/increaseParticularAvailableSlotOfADate';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../graphqlQueries/availableSlotsQuery';
import updateAvailableSlotQuery from '../graphqlQueries/updateAvailableSlotQuery';
import extractMenteeSessionInfoAndSendEmail from './utils/extractMenteeSessionInfoAndSendEmail';
import isTrialSession from '../resolvers/utils/isTrialSession';

const updateMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  const { previousDocument } = context;
  const { bookingDate: prevBookingDate, ...prevSlots } = previousDocument;
  const prevSlotTimeStringArray = getSelectedSlotsStringArray(prevSlots);

  const { bookingDate, ...slots } = input;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  // Only for trial session
  /* if a mentee has changed the date to future
  --increase the availability slot from the prevBookingDate
  -- decrease the availability slot of current availabilityDate
  if a mentee has changed the slots of the current date
  ---decrease for new slots and increase for old slots
 */

  const isTrial = await isTrialSession(input.topic.typeId);

  if (typeof isTrial === 'boolean' && isTrial) {
    if (bookingDate && bookingDate.getTime() !== prevBookingDate.getTime()) {
      // -- decrease the availability slot of current availabilityDate
      await reduceParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
      // --increase the availability slot from the prevBookingDate
      await increaseParticularAvailableSlotOfADate(prevSlotTimeStringArray, prevBookingDate, context);
    } else {
      // ---decrease for new slots and increase for old slots
      const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(bookingDate));
      const availableSlots = get(availableSlotsRes, 'data.availableSlots');
      // update if doc exist else leave
      if (availableSlots && availableSlots.length) {
        const docToBeUpdated = {};

        // increase for old slots
        prevSlotTimeStringArray.forEach((slot) => {
          docToBeUpdated[slot] = (availableSlots[0][slot] >= 0 ? availableSlots[0][slot] : 0) + 1;
        });

        // ---decrease for new slots
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
    }
  }
  // send email to mentor admin regarding the session
  await extractMenteeSessionInfoAndSendEmail(
    'update',
    input,
    bookingDate,
    slotTimeStringArray,
    prevBookingDate,
    prevSlotTimeStringArray,
  );
};

export default updateMenteeSessionPostHookMethod;
