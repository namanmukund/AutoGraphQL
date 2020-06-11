import getSelectedSlotsStringArray from '../postHookFunctions/utils/getSelectedSlotsStringArray';
import increaseParticularAvailableSlotOfADate from '../postHookFunctions/utils/increaseParticularAvailableSlotOfADate';
import extractMenteeSessionInfoAndSendEmail from '../postHookFunctions/utils/extractMenteeSessionInfoAndSendEmail';

const deleteMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted increase corresponding availability slots
   */
  const { previousDocument } = context;
  const { bookingDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  await increaseParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
  await extractMenteeSessionInfoAndSendEmail('delete', input, bookingDate, slotTimeStringArray);
};

export default deleteMenteeSessionPostHookMethod;
