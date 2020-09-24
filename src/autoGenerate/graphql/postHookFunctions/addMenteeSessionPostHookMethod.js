import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import extractMenteeSessionInfoAndSendEmail from './utils/extractMenteeSessionInfoAndSendEmail';

const addMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since addition of session by mentee will consume a slot
   */
  const { bookingDate, ...slots } = input;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const { availableSlots } = context;

  await reduceParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context, availableSlots);
  // send email to mentor admin regarding the session
  await extractMenteeSessionInfoAndSendEmail('add', input, bookingDate, slotTimeStringArray);
};
export default addMenteeSessionPostHookMethod;
