import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';

const addMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since addition of session by mentee will consume a slot
   */
  const { bookingDate, ...slots } = input;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const { availableSlots } = context;

  await reduceParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context, availableSlots);
};
export default addMenteeSessionPostHookMethod;
